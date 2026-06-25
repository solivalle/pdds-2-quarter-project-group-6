output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer — the public endpoint for the service"
  value       = aws_lb.this.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.this.arn
}

output "alb_arn_suffix" {
  description = "ARN suffix of the Application Load Balancer for CloudWatch metrics"
  value       = aws_lb.this.arn_suffix
}

output "aws_lb_target_group_arn" {
  description = "ARN of the ALB target group — passed to the compute module for ECS service registration"
  value       = aws_lb_target_group.this.arn
}

output "target_group_arn_suffix" {
  description = "ARN suffix of the target group for CloudWatch metrics"
  value       = aws_lb_target_group.this.arn_suffix
}

output "https_url" {
  description = "HTTPS URL when TLS is enabled"
  value       = var.enable_tls ? "https://${var.domain_name}" : null
}

output "certificate_arn" {
  description = "ACM certificate ARN when TLS is enabled"
  value       = var.enable_tls ? aws_acm_certificate.this[0].arn : null
}
