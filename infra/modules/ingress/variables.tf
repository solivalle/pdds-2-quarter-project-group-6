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