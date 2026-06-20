# Main Terraform configuration file for the project infrastructure
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

  environment       = var.environment
  name              = var.name
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  web_sg_id         = module.network.web_sg_id
  default_port      = var.default_port
  ingress_port      = var.ingress_port
  private_port      = var.private_port
  health_check_path = var.health_check_path
}

#── Security Groups ───────────────────────────────────────────────────────────
# The security groups are created in the network module, which outputs their IDs for use in the ingress and compute modules
module "storage" {
  source = "./modules/storage"

  bucket_name            = var.bucket_name
  environment            = var.environment
  lifecycle_ia_days      = 30
  lifecycle_glacier_days = 90
  lifecycle_expire_days  = 365
}

#── Compute and Database ─────────────────────────────────────────────────────
# The compute and database modules create the EC2 instance and DynamoDB table, respectively, and output their identifiers for use in the outputs.tf file
module "app_bucket" {
  source = "./modules/storage"

  bucket_name = var.app_bucket_name
  environment = var.environment
}

module "compute" {
  source = "./modules/compute"

  subnet_id               = module.network.private_subnet_ids[0]
  environment             = var.environment
  app_bucket_name         = var.app_bucket_name
  app_bucket_id           = module.app_bucket.bucket_id
  storage_bucket_name     = var.bucket_name
  project_name            = var.project_name
  ami_id                  = var.ami_id
  instance_type           = var.instance_type
  app_sg_id               = module.network.app_sg_id
  aws_region              = var.region
  aws_lb_target_group_arn = module.ingress.aws_lb_target_group_arn
  table_arn               = module.database.table_arn
  table_name              = module.database.table_name
  default_port            = var.default_port
}

module "database" {
  source = "./modules/database"

  environment  = var.environment
  project_name = var.project_name
}

resource "time_sleep" "lock_demo" {
  create_duration = "20s"
}

module "tickets_queue" {
  source = "./modules/async"

  queue_name                 = var.queue_name
  max_receive_count          = var.max_receive_count
  message_retention_seconds  = var.message_retention_seconds
  visibility_timeout_seconds = var.visibility_timeout_seconds
  environment                = var.environment
}