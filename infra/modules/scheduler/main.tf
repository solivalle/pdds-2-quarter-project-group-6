resource "aws_scheduler_schedule" "this" {
  name = "scheduler-${var.environment}"

  schedule_expression          = var.schedule_expression
  schedule_expression_timezone = var.scheduler_timezone

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = var.target_lambda_arn
    role_arn = var.scheduler_role_arn
  }
}
