output "table_name" {
  value       = aws_dynamodb_table.tickets.name
  description = "The name of the DynamoDB table"
}

output "table_arn" {
  value       = aws_dynamodb_table.tickets.arn
  description = "The ARN of the DynamoDB table"
}