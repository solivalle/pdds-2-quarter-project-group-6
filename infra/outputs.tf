output "bucket_name" {
  description = "Bucket name"
  value       = module.storage.bucket_id
}

output "bucket_arn" {
  description = "Bucket ARN"
  value       = module.storage.bucket_arn
}