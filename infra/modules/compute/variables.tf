variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Base project name applied to all resources in this module"
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

variable "vpc_id" {
  description = "VPC ID where the EC2 instance will be deployed"
  type        = string
}

variable "app_bucket_name" {
  description = "app S3 bucket name"
  type        = string
}

variable "storage_bucket_name" {
  description = "S3 bucket name for storage"
  type        = string
}

variable "app_bucket_id" {
  description = "app S3 bucket ID (output from storage module)"
  type        = string
}

variable "subnet_id" {
  description = "Subnet where EC2 will be deployed"
  type        = string
}

variable "web_sg_id" {
  description = "Security group ID of the ALB — passed to compute_ecs to allow ingress on port 8080"
  type        = string
}

variable "aws_lb_target_group_arn" {
  description = "ARN of the ALB target group — passed to the compute module for ECS service registration"
  type        = string
}

variable "table_arn" {
  description = "ARN of the DynamoDB table — passed to the compute module for IAM policy"
  type        = string
}

variable "table_name" {
  description = "The name of the DynamoDB table"
  type        = string
}