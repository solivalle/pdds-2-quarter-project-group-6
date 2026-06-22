variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "schedule_expression" {
  description = "Cron expression for the scheduler"
  type        = string
}

variable "scheduler_timezone" {
  description = "Timezone for the scheduler"
  type        = string
}

variable "target_lambda_arn" {
  description = "ARN of the target Lambda function to invoke"
  type        = string
}

variable "target_lambda_name" {
  description = "Name of the target Lambda function to invoke"
  type        = string
}