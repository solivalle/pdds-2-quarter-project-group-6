variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "app_bucket_name" {
  description = "app S3 bucket name"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance — region-specific, must match architecture"
  type        = string
  # us-west-2, Amazon Linux 2023, arm64: ami-023a34a1153befb51
}

variable "instance_type" {
  description = "EC2 instance type — must match AMI architecture (arm64 → t4g.*)"
  type        = string
  default     = "t4g.nano"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets — one per availability zone"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets — one per availability zone"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones to deploy subnets into — must match subnet CIDR count"
  type        = list(string)
}

variable "name" {
  description = "Base name applied to all ECS and ALB resources"
  type        = string
}

variable "default_port" {
  description = "Default port for the application"
  type        = number
  default     = 8080
}

variable "ingress_port" {
  description = "Port for ALB to listen on (80 for HTTP, 443 for HTTPS)"
  type        = number
  default     = 80
}

variable "private_port" {
  description = "Port for ALB to forward to (usually same as default_port, but can differ if using ALB for TLS termination)"
  type        = number
  default     = 443
}

variable "health_check_path" {
  description = "HTTP path for ALB health checks"
  type        = string
  default     = "/health"
}

variable "queue_name_prefix" {
  description = "Name prefix for the queue and its dead-letter queue"
  type        = string
}

variable "max_receive_count" {
  description = "Maximum receive count before a message is sent to the DLQ"
  type        = number
}

variable "message_retention_seconds" {
  description = "Seconds a message is retained in the main queue"
  type        = number
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for the main queue in seconds"
  type        = number
}

variable "dlq_message_retention_seconds" {
  description = "Seconds a message is retained in the dead-letter queue"
  type        = number
}

variable "polling_batch_size" {
  description = "Maximum number of SQS messages the EC2 worker reads per poll"
  type        = number
}

variable "memory_size" {
  description = "Memory allocated to the Lambda function in MB (min 128)"
  type        = number
  default     = 128
}

variable "architecture" {
  description = "CPU architecture for the Lambda function (x86_64 or arm64)"
  type        = string
  default     = "arm64"
}

variable "schedule_expression" {
  description = "Cron expression for the scheduler"
  type        = string
}

variable "scheduler_timezone" {
  description = "Timezone for the scheduler"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the CI OIDC role, in owner/repository format"
  type        = string
  default     = "solivalle/pdds-2-quarter-project-group-6"
}

variable "github_oidc_provider_url" {
  description = "GitHub Actions OIDC provider issuer URL"
  type        = string
  default     = "https://token.actions.githubusercontent.com"
}

variable "github_oidc_audience" {
  description = "GitHub Actions OIDC audience claim"
  type        = string
  default     = "sts.amazonaws.com"
}

variable "kms_alias_name" {
  description = "Alias name for the Delivery 5 KMS CMK, without alias/ prefix"
  type        = string
}

variable "runtime_secret_name" {
  description = "Secrets Manager secret name for backend runtime configuration"
  type        = string
}

variable "runtime_secret_value" {
  description = "Sensitive backend runtime secret stored in Secrets Manager"
  type        = string
  sensitive   = true
}

variable "terraform_admin_principal_arns" {
  description = "Optional AWS principal ARNs allowed to administer the KMS key during the initial bootstrap before OIDC is active"
  type        = list(string)
  default     = []
}

variable "enable_tls" {
  description = "Whether to provision ACM TLS and HTTP to HTTPS redirect"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Public DNS name for the HTTPS endpoint"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for domain_name"
  type        = string
  default     = ""
}

variable "ssl_policy_name" {
  description = "ALB SSL policy name for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "redirect_status_code" {
  description = "Redirect status code used by the HTTP listener when TLS is enabled"
  type        = string
  default     = "HTTP_301"
}

variable "notification_email" {
  description = "Email address for CloudWatch alarms and AWS Budget notifications"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "alb_request_count_metric_name" {
  description = "CloudWatch ALB request count metric name"
  type        = string
  default     = "RequestCount"
}

variable "alb_5xx_metric_name" {
  description = "CloudWatch ALB 5XX metric name"
  type        = string
  default     = "HTTPCode_ELB_5XX_Count"
}

variable "lambda_error_metric_name" {
  description = "CloudWatch Lambda errors metric name"
  type        = string
  default     = "Errors"
}

variable "sqs_visible_messages_metric_name" {
  description = "CloudWatch SQS visible messages metric name"
  type        = string
  default     = "ApproximateNumberOfMessagesVisible"
}

variable "alb_5xx_threshold" {
  description = "Threshold for ALB 5XX error alarm"
  type        = number
  default     = 1
}

variable "lambda_error_threshold" {
  description = "Threshold for Lambda error alarm"
  type        = number
  default     = 1
}

variable "alarm_period_seconds" {
  description = "CloudWatch alarm period in seconds"
  type        = number
  default     = 300
}

variable "alarm_evaluation_periods" {
  description = "CloudWatch alarm evaluation periods"
  type        = number
  default     = 1
}

variable "monthly_budget_usd" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 25
}
