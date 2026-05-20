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

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitted to reach port 8080 on the instance"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID where the EC2 instance will be deployed"
  type = string
}