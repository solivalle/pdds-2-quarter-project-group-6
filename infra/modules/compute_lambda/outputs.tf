output "lambda_function_name" {
  description = "The name of the Lambda function."
  value       = aws_lambda_function.lambda_health_check.function_name
}

output "lambda_arn" {
  description = "The ARN of the Lambda function."
  value       = aws_lambda_function.lambda_health_check.arn
}