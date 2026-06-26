variable "environment" {
  description = "Deployment environment (dev, staging)"
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

variable "scheduler_role_arn" {
  description = "IAM role ARN assumed by EventBridge Scheduler"
  type        = string
}
