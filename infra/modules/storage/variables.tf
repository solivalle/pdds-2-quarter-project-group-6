variable "bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment (dev, staging)"
}

variable "lifecycle_ia_days" {
  type        = number
  default     = 30
  description = "Days for transitioning to infrequent access storage"
}

variable "lifecycle_glacier_days" {
  type        = number
  default     = 90
  description = "Days for transitioning to glacier storage"
}

variable "lifecycle_expire_days" {
  type        = number
  default     = 365
  description = "Days for expiring objects in the bucket"
}

variable "kms_key_arn" {
  type        = string
  description = "KMS CMK ARN used for S3 server-side encryption"
}
