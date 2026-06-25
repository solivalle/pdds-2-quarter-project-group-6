data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  kms_alias                = "alias/${var.kms_alias_name}"
  key_admin_principal_arns = distinct(concat([var.ci_runner_role_arn], var.terraform_admin_principal_arns))
}

resource "aws_kms_key" "this" {
  description             = "TicketFlow ${var.environment} customer-managed key for storage, database, and secrets"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIamUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCiKeyAdministration"
        Effect = "Allow"
        Principal = {
          AWS = local.key_admin_principal_arns
        }
        Action = [
          "kms:CreateAlias",
          "kms:DeleteAlias",
          "kms:DescribeKey",
          "kms:EnableKeyRotation",
          "kms:GetKeyRotationStatus",
          "kms:GetKeyPolicy",
          "kms:PutKeyPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:TagResource",
          "kms:UntagResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowComputeRuntimeUse"
        Effect = "Allow"
        Principal = {
          AWS = var.compute_role_arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowSecretsManagerUse"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService"    = "secretsmanager.${data.aws_region.current.name}.amazonaws.com"
            "kms:CallerAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AllowDynamoDbUse"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService"    = "dynamodb.${data.aws_region.current.name}.amazonaws.com"
            "kms:CallerAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AllowS3Use"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService"    = "s3.${data.aws_region.current.name}.amazonaws.com"
            "kms:CallerAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_kms_alias" "this" {
  name          = local.kms_alias
  target_key_id = aws_kms_key.this.key_id
}

resource "aws_secretsmanager_secret" "runtime" {
  name        = var.runtime_secret_name
  description = "TicketFlow ${var.environment} backend runtime secret"
  kms_key_id  = aws_kms_key.this.arn

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_secretsmanager_secret_version" "runtime" {
  secret_id     = aws_secretsmanager_secret.runtime.id
  secret_string = var.runtime_secret_value
}
