variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging)"
}

variable "project_name" {
  type        = string
  description = "Base project name applied to all resources in this module"
}

variable "billing_mode" {
  type        = string
  default     = "PAY_PER_REQUEST"
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
}

variable "kms_key_arn" {
  type        = string
  description = "KMS CMK ARN used for DynamoDB server-side encryption"
}
