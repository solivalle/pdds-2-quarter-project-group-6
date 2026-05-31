variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "name" {
  description = "Base name applied to all ingress resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the ALB and its security group will be created"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB — minimum 2 across different AZs"
  type        = list(string)
}

variable "web_sg_id" {
  description = "Security group ID of the ALB — passed to compute_ecs to allow ingress on port 8080"
  type        = string
}