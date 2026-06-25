# Main Terraform configuration file for the project infrastructure
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  storage_bucket_arn     = "arn:aws:s3:::${var.bucket_name}"
  app_bucket_arn         = "arn:aws:s3:::${var.app_bucket_name}"
  database_table_name    = "${var.project_name}-${var.environment}-tickets"
  database_table_arn     = "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${local.database_table_name}"
  queue_name             = "${var.queue_name_prefix}-queue-${var.environment}"
  queue_arn              = "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.queue_name}"
  backend_log_group_name = "/${var.project_name}/${var.environment}/backend"
  backend_log_group_arn  = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${local.backend_log_group_name}"
  lambda_function_name   = "lambda-${var.environment}"
  lambda_function_arn    = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.lambda_function_name}"
  lambda_log_group_name  = "/aws/lambda/${local.lambda_function_name}"
  lambda_log_group_arn   = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${local.lambda_log_group_name}"
}

module "network" {
  source = "./modules/network"

  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
  ingress_port         = var.ingress_port
  private_port         = var.private_port
  default_port         = var.default_port
}

#── VPC ───────────────────────────────────────────────────────────────────────
# The VPC and subnets are created in the network module, which outputs the VPC
module "ingress" {
  source = "./modules/ingress"

  environment          = var.environment
  name                 = var.name
  vpc_id               = module.network.vpc_id
  public_subnet_ids    = module.network.public_subnet_ids
  web_sg_id            = module.network.web_sg_id
  default_port         = var.default_port
  ingress_port         = var.ingress_port
  private_port         = var.private_port
  health_check_path    = var.health_check_path
  enable_tls           = var.enable_tls
  domain_name          = var.domain_name
  hosted_zone_id       = var.hosted_zone_id
  ssl_policy_name      = var.ssl_policy_name
  redirect_status_code = var.redirect_status_code
}

#── Security Groups ───────────────────────────────────────────────────────────
# The security groups are created in the network module, which outputs their IDs for use in the ingress and compute modules
module "iam" {
  source = "./modules/iam"

  environment                 = var.environment
  project_name                = var.project_name
  github_repository           = var.github_repository
  github_oidc_provider_url    = var.github_oidc_provider_url
  github_oidc_audience        = var.github_oidc_audience
  database_table_arn          = local.database_table_arn
  storage_bucket_arn          = local.storage_bucket_arn
  app_bucket_arn              = local.app_bucket_arn
  queue_arn                   = local.queue_arn
  backend_log_group_arn       = local.backend_log_group_arn
  lambda_log_group_arn        = local.lambda_log_group_arn
  scheduler_target_lambda_arn = local.lambda_function_arn
  ci_managed_resource_arns = [
    local.database_table_arn,
    local.queue_arn,
    module.ingress.alb_arn,
    module.ingress.aws_lb_target_group_arn,
    local.backend_log_group_arn,
    local.lambda_log_group_arn,
    local.lambda_function_arn,
    "arn:aws:scheduler:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:schedule/default/scheduler-${var.environment}",
  ]
}

module "security" {
  source = "./modules/security"

  environment                    = var.environment
  project_name                   = var.project_name
  kms_alias_name                 = var.kms_alias_name
  runtime_secret_name            = var.runtime_secret_name
  runtime_secret_value           = var.runtime_secret_value
  compute_role_arn               = module.iam.compute_role_arn
  ci_runner_role_arn             = module.iam.ci_runner_role_arn
  terraform_admin_principal_arns = var.terraform_admin_principal_arns
}

resource "aws_iam_policy" "compute_runtime_secret" {
  name = "${var.project_name}-${var.environment}-compute-runtime-secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadRuntimeSecret"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = module.security.runtime_secret_arn
      },
      {
        Sid      = "DecryptRuntimeSecret"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = module.security.kms_key_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "compute_runtime_secret" {
  role       = module.iam.compute_role_name
  policy_arn = aws_iam_policy.compute_runtime_secret.arn
}

module "storage" {
  source = "./modules/storage"

  bucket_name            = var.bucket_name
  environment            = var.environment
  lifecycle_ia_days      = 30
  lifecycle_glacier_days = 90
  lifecycle_expire_days  = 365
  kms_key_arn            = module.security.kms_key_arn
}

#── Compute and Database ─────────────────────────────────────────────────────
# The compute and database modules create the EC2 instance and DynamoDB table, respectively, and output their identifiers for use in the outputs.tf file
module "app_bucket" {
  source = "./modules/storage"

  bucket_name            = var.app_bucket_name
  environment            = var.environment
  lifecycle_ia_days      = 30
  lifecycle_glacier_days = 90
  lifecycle_expire_days  = 365
  kms_key_arn            = module.security.kms_key_arn
}

module "tickets_queue" {
  source = "./modules/async"

  queue_name_prefix             = var.queue_name_prefix
  max_receive_count             = var.max_receive_count
  message_retention_seconds     = var.message_retention_seconds
  dlq_message_retention_seconds = var.dlq_message_retention_seconds
  visibility_timeout_seconds    = var.visibility_timeout_seconds
  environment                   = var.environment
}

// The compute module creates the EC2 instance and outputs its ID and ARN for use in the outputs.tf file
module "compute" {
  source = "./modules/compute"

  subnet_id                 = module.network.private_subnet_ids[0]
  environment               = var.environment
  app_bucket_name           = var.app_bucket_name
  app_bucket_id             = module.app_bucket.bucket_id
  storage_bucket_name       = var.bucket_name
  project_name              = var.project_name
  ami_id                    = var.ami_id
  instance_type             = var.instance_type
  app_sg_id                 = module.network.app_sg_id
  iam_instance_profile_name = module.iam.compute_instance_profile_name
  aws_region                = var.region
  aws_lb_target_group_arn   = module.ingress.aws_lb_target_group_arn
  table_name                = module.database.table_name
  default_port              = var.default_port
  queue_url                 = module.tickets_queue.queue_url
  dlq_url                   = module.tickets_queue.dlq_url
  polling_batch_size        = var.polling_batch_size
  runtime_secret_arn        = module.security.runtime_secret_arn
  backend_log_group_name    = module.observability.backend_log_group_name
}

// The compute_lambda module creates the Lambda function and outputs its ARN for use in the scheduler module
module "compute_lambda" {
  source = "./modules/compute_lambda"

  project_name     = var.project_name
  environment      = var.environment
  health_check_url = var.enable_tls ? "${module.ingress.https_url}${var.health_check_path}" : "http://${module.ingress.alb_dns_name}${var.health_check_path}"
  architecture     = var.architecture
  memory_size      = var.memory_size
  lambda_role_arn  = module.iam.lambda_role_arn

  depends_on = [module.observability]
}

// The scheduler module creates the EventBridge Scheduler and outputs its ARN and name for use in the outputs.tf file
module "scheduler" {
  source = "./modules/scheduler"

  environment = var.environment

  schedule_expression = var.schedule_expression
  scheduler_timezone  = var.scheduler_timezone

  target_lambda_arn  = module.compute_lambda.lambda_arn
  scheduler_role_arn = module.iam.scheduler_role_arn
}

module "database" {
  source = "./modules/database"

  environment  = var.environment
  project_name = var.project_name
  kms_key_arn  = module.security.kms_key_arn
}

module "observability" {
  source = "./modules/observability"

  environment                      = var.environment
  project_name                     = var.project_name
  aws_region                       = var.region
  notification_email               = var.notification_email
  log_retention_days               = var.log_retention_days
  alb_arn_suffix                   = module.ingress.alb_arn_suffix
  target_group_arn_suffix          = module.ingress.target_group_arn_suffix
  lambda_function_name             = local.lambda_function_name
  queue_name                       = module.tickets_queue.queue_name
  alb_request_count_metric_name    = var.alb_request_count_metric_name
  alb_5xx_metric_name              = var.alb_5xx_metric_name
  lambda_error_metric_name         = var.lambda_error_metric_name
  sqs_visible_messages_metric_name = var.sqs_visible_messages_metric_name
  alb_5xx_threshold                = var.alb_5xx_threshold
  lambda_error_threshold           = var.lambda_error_threshold
  alarm_period_seconds             = var.alarm_period_seconds
  alarm_evaluation_periods         = var.alarm_evaluation_periods
  monthly_budget_usd               = var.monthly_budget_usd
}

resource "time_sleep" "lock_demo" {
  create_duration = "20s"
}
