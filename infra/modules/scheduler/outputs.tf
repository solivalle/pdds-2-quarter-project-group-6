output "scheduler_arn" {
  description = "The ARN of the scheduler."
  value       = aws_scheduler_schedule.this.arn
}

output "scheduler_name" {
  description = "The name of the scheduler."
  value       = aws_scheduler_schedule.this.name
}

output "scheduler_role_arn" {
  description = "The ARN of the scheduler IAM role."
  value       = var.scheduler_role_arn
}
