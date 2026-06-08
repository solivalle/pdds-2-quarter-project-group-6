output "bucket_name" {
  description = "Bucket name"
  value       = module.storage.bucket_id
}

output "bucket_arn" {
  description = "Bucket ARN"
  value       = module.storage.bucket_arn
}

output "compute_ec2_instance_id" {
  description = "The ID of the EC2 instance created by the compute_ec2 module."
  value       = module.compute.instance_id
}

output "instance_arn" {
  description = "EC2 instance ARN"
  value       = module.compute.instance_arn
}

output "database_table_name" {
  description = "DynamoDB table name"
  value       = module.database.table_name
}

output "database_table_arn" {
  description = "DynamoDB table ARN"
  value       = module.database.table_arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer — the public endpoint for the service"
  value       = module.ingress.alb_dns_name
}