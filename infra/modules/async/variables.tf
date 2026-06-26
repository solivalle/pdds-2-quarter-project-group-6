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

variable "environment" {
  description = "Deployment environment (dev, staging)"
  type        = string
}
