variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Base project name applied to all resources in this module"
  type        = string
}

variable "memory_size" {
  description = "Memory allocated to the Lambda function in MB (min 128)"
  type        = number
  default     = 128
}

variable "lambda_role_arn" {
  description = "IAM role ARN used by the Lambda function"
  type        = string
}

variable "architecture" {
  description = "CPU architecture for the Lambda function (x86_64 or arm64)"
  type        = string
  default     = "arm64"
}

variable "health_check_url" {
  description = "Full URL used by the Lambda health check."
  type        = string
}
