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

resource "aws_dynamodb_table_item" "seed_ticket" {
  table_name = aws_dynamodb_table.tickets.name
  hash_key   = aws_dynamodb_table.tickets.hash_key

  item = jsonencode({
    TicketID = { S = "TKT-SEED-E2E" }
    AgentID  = { S = "AGE-2001" }
    CreatedAt = {
      S = "2026-06-01T12:00:00.000Z"
    }
    title = {
      S = "Ticket semilla para prueba E2E"
    }
    description = {
      S = "Ticket de prueba creado por Terraform para validar lectura desde DynamoDB."
    }
    category = {
      S = "infraestructura"
    }
    priority = {
      S = "P2"
    }
    suggestedPriority = {
      S = "P2"
    }
    status = {
      S = "ASSIGNED"
    }
    requesterId = {
      S = "USR-1001"
    }
    teamId = {
      S = "support-core"
    }
    createdAt = {
      S = "2026-06-01T12:00:00.000Z"
    }
    updatedAt = {
      S = "2026-06-01T12:00:00.000Z"
    }
    escalated = {
      BOOL = false
    }
    sla = {
      M = {
        responseDueAt = {
          S = "2026-06-01T16:00:00.000Z"
        }
        resolutionDueAt = {
          S = "2026-06-03T12:00:00.000Z"
        }
        responseMinutes = {
          N = "240"
        }
        resolutionMinutes = {
          N = "2880"
        }
        isAtRisk = {
          BOOL = false
        }
        isBreached = {
          BOOL = false
        }
      }
    }
    attachments = {
      L = []
    }
    comments = {
      L = []
    }
    auditLog = {
      L = [
        {
          M = {
            id = {
              S = "AUD-SEED-E2E"
            }
            type = {
              S = "TICKET_CREATED"
            }
            actorId = {
              S = "SYSTEM"
            }
            at = {
              S = "2026-06-01T12:00:00.000Z"
            }
            reason = {
              S = "Terraform seed for E2E validation"
            }
          }
        }
      ]
    }
    TimeToExist = {
      N = "1811841600"
    }
  })
}
