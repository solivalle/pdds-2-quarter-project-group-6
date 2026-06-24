output "compute_role_arn" {
  description = "ARN of the EC2 compute role."
  value       = aws_iam_role.compute.arn
}

output "compute_role_name" {
  description = "Name of the EC2 compute role."
  value       = aws_iam_role.compute.name
}

output "compute_instance_profile_name" {
  description = "Name of the EC2 instance profile."
  value       = aws_iam_instance_profile.compute.name
}

output "compute_policy_arn" {
  description = "ARN of the compute IAM policy."
  value       = aws_iam_policy.compute.arn
}

output "async_consumer_role_arn" {
  description = "ARN of the async consumer role."
  value       = aws_iam_role.async_consumer.arn
}

output "async_consumer_policy_arn" {
  description = "ARN of the async consumer IAM policy."
  value       = aws_iam_policy.async_consumer.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role."
  value       = aws_iam_role.lambda.arn
}

output "lambda_policy_arn" {
  description = "ARN of the Lambda execution IAM policy."
  value       = aws_iam_policy.lambda.arn
}

output "scheduler_role_arn" {
  description = "ARN of the EventBridge Scheduler role."
  value       = aws_iam_role.scheduler.arn
}

output "scheduler_role_name" {
  description = "Name of the EventBridge Scheduler role."
  value       = aws_iam_role.scheduler.name
}

output "scheduler_policy_arn" {
  description = "ARN of the EventBridge Scheduler invoke policy."
  value       = aws_iam_policy.scheduler.arn
}

output "ci_runner_role_arn" {
  description = "ARN of the GitHub Actions OIDC-assumable CI role."
  value       = aws_iam_role.ci_runner.arn
}

output "ci_runner_policy_arn" {
  description = "ARN of the CI runner IAM policy."
  value       = aws_iam_policy.ci_runner.arn
}

output "github_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider."
  value       = aws_iam_openid_connect_provider.github_actions.arn
}
