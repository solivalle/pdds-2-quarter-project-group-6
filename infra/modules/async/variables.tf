variable "queue_name" {
  description = "Name prefix for the queue and its dead-letter queue"
  type        = string
}


variable "max_receive_count" {
  description = "Maximum receive count before a message is sent to the DLQ"
  type        = number
}


variable "message_retention_seconds" {
  description = "Seconds a message is retained in the DLQ"
  type        = number
}


variable "visibility_timeout_seconds" {
  description = "Visibility timeout for the main queue in seconds"
  type        = number
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}