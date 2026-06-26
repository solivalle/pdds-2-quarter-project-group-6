output "kms_key_arn" {
  description = "ARN of the customer-managed KMS key."
  value       = aws_kms_key.this.arn
}

output "kms_key_id" {
  description = "ID of the customer-managed KMS key."
  value       = aws_kms_key.this.key_id
}

output "kms_alias_name" {
  description = "KMS alias name."
  value       = aws_kms_alias.this.name
}

output "runtime_secret_arn" {
  description = "ARN of the backend runtime secret."
  value       = aws_secretsmanager_secret.runtime.arn
}

output "runtime_secret_name" {
  description = "Name of the backend runtime secret."
  value       = aws_secretsmanager_secret.runtime.name
}
