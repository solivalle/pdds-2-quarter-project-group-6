variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Base project name applied to all resources in this module"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer — the public endpoint for the service"
  type        = string
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

variable "health_check_path" {
  description = "HTTP path for ALB health checks"
  type        = string
  default     = "/health"
}