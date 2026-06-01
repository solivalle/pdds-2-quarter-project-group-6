output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer — the public endpoint for the service"
  value       = aws_lb.this.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.this.arn
}

output "aws_lb_target_group_arn" {
  description = "ARN of the ALB target group — passed to the compute module for ECS service registration"
  value       = aws_lb_target_group.this.arn
}