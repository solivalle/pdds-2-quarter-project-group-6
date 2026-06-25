variable "environment" {
  description = "Deployment environment name used in security resource names."
  type        = string
}

variable "project_name" {
  description = "Project name used as a security resource prefix."
  type        = string
}

variable "kms_alias_name" {
  description = "Alias name for the customer-managed KMS key, without the alias/ prefix."
  type        = string
}

variable "runtime_secret_name" {
  description = "Secrets Manager secret name for backend runtime configuration."
  type        = string
}

variable "runtime_secret_value" {
  description = "Sensitive backend runtime secret value stored in Secrets Manager."
  type        = string
  sensitive   = true
}

variable "compute_role_arn" {
  description = "Compute role ARN allowed to decrypt and read the runtime secret."
  type        = string
}

variable "ci_runner_role_arn" {
  description = "CI runner role ARN allowed to administer the CMK during Terraform operations."
  type        = string
}

variable "terraform_admin_principal_arns" {
  description = "Optional AWS principal ARNs allowed to administer the CMK during the first bootstrap before OIDC is active."
  type        = list(string)
  default     = []
}
