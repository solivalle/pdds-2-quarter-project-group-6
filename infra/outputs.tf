output "bucket_name" {
  description = "Bucket name"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "Bucket ARN"
  value       = aws_s3_bucket.main.arn
}