variable "environment" {
  description = "Deployment environment name used in IAM role and policy names."
  type        = string
}

variable "project_name" {
  description = "Project name used as IAM resource name prefix."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the CI role, in owner/repository format."
  type        = string
}

variable "github_oidc_provider_url" {
  description = "GitHub Actions OIDC issuer URL."
  type        = string
}

variable "github_oidc_audience" {
  description = "Audience claim expected in GitHub Actions OIDC tokens."
  type        = string
}

variable "database_table_arn" {
  description = "DynamoDB tickets table ARN used by the compute role."
  type        = string
}

variable "storage_bucket_arn" {
  description = "S3 attachments bucket ARN used by compute and async roles."
  type        = string
}

variable "app_bucket_arn" {
  description = "S3 application artifact bucket ARN used by the compute role."
  type        = string
}

variable "queue_arn" {
  description = "SQS queue ARN used by compute and async roles."
  type        = string
}

variable "backend_log_group_arn" {
  description = "CloudWatch backend log group ARN used by the compute role."
  type        = string
}

variable "lambda_log_group_arn" {
  description = "CloudWatch Lambda log group ARN used by the Lambda execution role."
  type        = string
}

variable "scheduler_target_lambda_arn" {
  description = "Lambda function ARN the EventBridge Scheduler role may invoke."
  type        = string
}

variable "ci_managed_resource_arns" {
  description = "Resource ARNs the CI role may manage for Terraform plan/apply."
  type        = list(string)
}
