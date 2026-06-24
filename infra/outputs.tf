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

output "nat_gateway_id" {
  description = "ID of the NAT Gateway for private subnet internet access"
  value       = module.network.nat_gateway_id
}

output "queue_url" {
  description = "SQS main queue URL — used by the application to enqueue messages"
  value       = module.tickets_queue.queue_url
}

output "queue_arn" {
  description = "SQS main queue ARN"
  value       = module.tickets_queue.queue_arn
}

output "dlq_url" {
  description = "Dead letter queue URL"
  value       = module.tickets_queue.dlq_url
}

output "dlq_arn" {
  description = "Dead letter queue ARN"
  value       = module.tickets_queue.dlq_arn
}

output "scheduler_arn" {
  description = "The ARN of the scheduler."
  value       = module.scheduler.scheduler_arn
}

output "scheduler_name" {
  description = "The name of the scheduler."
  value       = module.scheduler.scheduler_name
}

output "kms_key_arn" {
  description = "Delivery 5 KMS CMK ARN"
  value       = module.security.kms_key_arn
}

output "runtime_secret_arn" {
  description = "Secrets Manager runtime secret ARN"
  value       = module.security.runtime_secret_arn
}

output "ci_runner_role_arn" {
  description = "GitHub Actions OIDC-assumable CI role ARN"
  value       = module.iam.ci_runner_role_arn
}

output "github_oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN"
  value       = module.iam.github_oidc_provider_arn
}

output "https_url" {
  description = "HTTPS public URL when TLS is enabled"
  value       = module.ingress.https_url
}

output "certificate_arn" {
  description = "ACM certificate ARN when TLS is enabled"
  value       = module.ingress.certificate_arn
}

output "backend_log_group_arn" {
  description = "Backend CloudWatch log group ARN"
  value       = module.observability.backend_log_group_arn
}

output "lambda_log_group_arn" {
  description = "Lambda CloudWatch log group ARN"
  value       = module.observability.lambda_log_group_arn
}

output "alb_5xx_alarm_arn" {
  description = "ALB 5XX CloudWatch alarm ARN"
  value       = module.observability.alb_5xx_alarm_arn
}

output "lambda_errors_alarm_arn" {
  description = "Lambda errors CloudWatch alarm ARN"
  value       = module.observability.lambda_errors_alarm_arn
}

output "observability_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = module.observability.dashboard_name
}

output "monthly_budget_name" {
  description = "AWS monthly budget name"
  value       = module.observability.budget_name
}
