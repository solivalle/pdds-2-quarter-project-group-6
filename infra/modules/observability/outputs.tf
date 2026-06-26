output "backend_log_group_name" {
  description = "CloudWatch backend log group name."
  value       = aws_cloudwatch_log_group.backend.name
}

output "backend_log_group_arn" {
  description = "CloudWatch backend log group ARN."
  value       = aws_cloudwatch_log_group.backend.arn
}

output "lambda_log_group_name" {
  description = "CloudWatch Lambda log group name."
  value       = aws_cloudwatch_log_group.lambda.name
}

output "lambda_log_group_arn" {
  description = "CloudWatch Lambda log group ARN."
  value       = aws_cloudwatch_log_group.lambda.arn
}

output "alerts_topic_arn" {
  description = "SNS topic ARN for observability alerts."
  value       = aws_sns_topic.alerts.arn
}

output "alb_5xx_alarm_arn" {
  description = "ARN of the ALB 5XX CloudWatch alarm."
  value       = aws_cloudwatch_metric_alarm.alb_5xx.arn
}

output "lambda_errors_alarm_arn" {
  description = "ARN of the Lambda errors CloudWatch alarm."
  value       = aws_cloudwatch_metric_alarm.lambda_errors.arn
}

output "dashboard_name" {
  description = "CloudWatch dashboard name."
  value       = aws_cloudwatch_dashboard.this.dashboard_name
}

output "budget_name" {
  description = "Monthly budget name."
  value       = aws_budgets_budget.monthly.name
}
