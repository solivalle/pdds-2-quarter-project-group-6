variable "bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment (dev, staging, prod)"
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