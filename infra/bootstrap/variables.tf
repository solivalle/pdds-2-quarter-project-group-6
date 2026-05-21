variable "project_name" {
  type        = string
  default     = "pdds-2-quarter-project-group-6"
  description = "Project name"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Deployment environment"
}

variable "region" {
  type        = string
  default     = "us-west-2"
  description = "AWS region"
}
