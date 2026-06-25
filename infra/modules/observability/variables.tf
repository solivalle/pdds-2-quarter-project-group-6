variable "environment" {
  description = "Deployment environment name used in observability resources."
  type        = string
}

variable "project_name" {
  description = "Project name used in observability resource names."
  type        = string
}

variable "aws_region" {
  description = "AWS region where metrics and logs are published."
  type        = string
}

variable "notification_email" {
  description = "Email address that receives alarm and budget notifications."
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days."
  type        = number
}

variable "alb_arn_suffix" {
  description = "Application Load Balancer ARN suffix used as CloudWatch metric dimension."
  type        = string
}

variable "target_group_arn_suffix" {
  description = "Target group ARN suffix used as CloudWatch metric dimension."
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name used as CloudWatch metric dimension."
  type        = string
}

variable "queue_name" {
  description = "SQS queue name used as CloudWatch metric dimension."
  type        = string
}

variable "alb_request_count_metric_name" {
  description = "CloudWatch metric name for ALB request count."
  type        = string
}

variable "alb_5xx_metric_name" {
  description = "CloudWatch metric name for ALB 5XX errors."
  type        = string
}

variable "lambda_error_metric_name" {
  description = "CloudWatch metric name for Lambda errors."
  type        = string
}

variable "sqs_visible_messages_metric_name" {
  description = "CloudWatch metric name for visible SQS messages."
  type        = string
}

variable "alb_5xx_threshold" {
  description = "Threshold for ALB 5XX errors alarm."
  type        = number
}

variable "lambda_error_threshold" {
  description = "Threshold for Lambda errors alarm."
  type        = number
}

variable "alarm_period_seconds" {
  description = "CloudWatch alarm period in seconds."
  type        = number
}

variable "alarm_evaluation_periods" {
  description = "CloudWatch alarm evaluation periods."
  type        = number
}

variable "monthly_budget_usd" {
  description = "Monthly AWS budget limit in USD."
  type        = number
}
