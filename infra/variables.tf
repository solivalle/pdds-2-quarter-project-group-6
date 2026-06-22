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
