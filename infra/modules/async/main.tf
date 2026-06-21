resource "aws_sqs_queue" "dlq" {
  name                      = "${var.queue_name}-dlq-${var.environment}"
  message_retention_seconds = var.message_retention_seconds
}

resource "aws_sqs_queue" "main" {
  name                       = "${var.queue_name}-queue-${var.environment}"
  visibility_timeout_seconds = var.visibility_timeout_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })
}