resource "aws_dynamodb_table" "tickets" {
  name         = "${var.project_name}-${var.environment}-tickets"
  billing_mode = var.billing_mode
  hash_key     = "TicketID"

  attribute {
    name = "TicketID"
    type = "S"
  }

  attribute {
    name = "AgentID"
    type = "S"
  }

  attribute {
    name = "CreatedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "AgentTicketsIndex"
    hash_key        = "AgentID"
    range_key       = "CreatedAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "TimeToExist"
    enabled        = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-tickets-table"
    Environment = var.environment
  }
}
