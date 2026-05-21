output "state_bucket_name" {
  value       = aws_s3_bucket.state.id
  description = "The name of the S3 bucket created for Terraform remote state"
}

output "lock_table_name" {
  value       = aws_dynamodb_table.locks.name
  description = "The name of the DynamoDB table created for state locking"
}

output "region" {
  value       = var.region
  description = "The AWS region where resources are deployed"
}
