data "tls_certificate" "github_actions" {
  url = var.github_oidc_provider_url
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = var.github_oidc_provider_url
  client_id_list  = [var.github_oidc_audience]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]
}

locals {
  name_prefix         = "${var.project_name}-${var.environment}"
  storage_objects_arn = "${var.storage_bucket_arn}/*"
  app_objects_arn     = "${var.app_bucket_arn}/*"
  github_main_subject = "repo:${var.github_repository}:ref:refs/heads/main"
  backend_log_streams = "${var.backend_log_group_arn}:log-stream:*"
  lambda_log_streams  = "${var.lambda_log_group_arn}:log-stream:*"
  ci_resource_arns    = concat(var.ci_managed_resource_arns, [var.storage_bucket_arn, local.storage_objects_arn, var.app_bucket_arn, local.app_objects_arn])
}

resource "aws_iam_role" "compute" {
  name = "${local.name_prefix}-compute-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_instance_profile" "compute" {
  name = "${local.name_prefix}-compute-profile"
  role = aws_iam_role.compute.name
}

resource "aws_iam_policy" "compute" {
  name = "${local.name_prefix}-compute-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadWriteTicketsTable"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DeleteItem"
        ]
        Resource = var.database_table_arn
      },
      {
        Sid    = "ReadWriteAttachments"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = local.storage_objects_arn
      },
      {
        Sid      = "ListAttachmentsBucket"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = var.storage_bucket_arn
      },
      {
        Sid      = "ReadApplicationArtifact"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = local.app_objects_arn
      },
      {
        Sid    = "SendAsyncMessages"
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.queue_arn
      },
      {
        Sid    = "WriteBackendLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = local.backend_log_streams
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "compute" {
  role       = aws_iam_role.compute.name
  policy_arn = aws_iam_policy.compute.arn
}

resource "aws_iam_role" "async_consumer" {
  name = "${local.name_prefix}-async-consumer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "async_consumer" {
  name = "${local.name_prefix}-async-consumer-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ConsumeQueue"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.queue_arn
      },
      {
        Sid      = "WriteSnapshots"
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = local.storage_objects_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "async_consumer" {
  role       = aws_iam_role.async_consumer.name
  policy_arn = aws_iam_policy.async_consumer.arn
}

resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "lambda" {
  name = "${local.name_prefix}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "WriteLambdaLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = local.lambda_log_streams
      },
      {
        Sid    = "ConsumeFromSQS"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.queue_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda.arn
}

resource "aws_iam_role" "scheduler" {
  name = "${local.name_prefix}-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "scheduler" {
  name = "${local.name_prefix}-scheduler-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "InvokeScheduledLambda"
      Effect   = "Allow"
      Action   = ["lambda:InvokeFunction"]
      Resource = var.scheduler_target_lambda_arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "scheduler" {
  role       = aws_iam_role.scheduler.name
  policy_arn = aws_iam_policy.scheduler.arn
}

resource "aws_iam_role" "ci_runner" {
  name = "${local.name_prefix}-ci-runner-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = var.github_oidc_audience
          "token.actions.githubusercontent.com:sub" = local.github_main_subject
        }
      }
    }]
  })
}

resource "aws_iam_policy" "ci_runner" {
  name = "${local.name_prefix}-ci-runner-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ManageProjectResources"
        Effect = "Allow"
        Action = [
          "acm:AddTagsToCertificate",
          "acm:DeleteCertificate",
          "acm:DescribeCertificate",
          "acm:RequestCertificate",
          "acm:ListTagsForCertificate",
          "acm:RemoveTagsFromCertificate",
          "budgets:CreateBudget",
          "budgets:DeleteBudget",
          "budgets:DescribeBudget",
          "budgets:ModifyBudget",
          "cloudwatch:DeleteAlarms",
          "cloudwatch:DeleteDashboards",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:GetDashboard",
          "cloudwatch:PutDashboard",
          "cloudwatch:PutMetricAlarm",
          "dynamodb:CreateTable",
          "dynamodb:DeleteTable",
          "dynamodb:DescribeTable",
          "dynamodb:TagResource",
          "dynamodb:UntagResource",
          "dynamodb:UpdateTable",
          "ec2:AllocateAddress",
          "ec2:AssociateRouteTable",
          "ec2:AttachInternetGateway",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:CreateInternetGateway",
          "ec2:CreateNatGateway",
          "ec2:CreateRoute",
          "ec2:CreateRouteTable",
          "ec2:CreateSecurityGroup",
          "ec2:CreateSubnet",
          "ec2:CreateTags",
          "ec2:CreateVpc",
          "ec2:DeleteInternetGateway",
          "ec2:DeleteNatGateway",
          "ec2:DeleteRoute",
          "ec2:DeleteRouteTable",
          "ec2:DeleteSecurityGroup",
          "ec2:DeleteSubnet",
          "ec2:DeleteVpc",
          "ec2:DescribeAddresses",
          "ec2:DescribeInstances",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeNatGateways",
          "ec2:DescribeRouteTables",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "ec2:ModifyVpcAttribute",
          "ec2:ReleaseAddress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:CreateTargetGroup",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:DeleteRule",
          "elasticloadbalancing:DeleteTargetGroup",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:ModifyRule",
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:RemoveTags",
          "elasticloadbalancing:SetSecurityGroups",
          "iam:CreateInstanceProfile",
          "iam:CreateOpenIDConnectProvider",
          "iam:CreatePolicy",
          "iam:CreateRole",
          "iam:DeleteInstanceProfile",
          "iam:DeleteOpenIDConnectProvider",
          "iam:DeletePolicy",
          "iam:DeleteRole",
          "iam:GetInstanceProfile",
          "iam:GetOpenIDConnectProvider",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRole",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfilesForRole",
          "iam:PassRole",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:UpdateAssumeRolePolicy",
          "kms:CreateAlias",
          "kms:CreateKey",
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:EnableKeyRotation",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:GetKeyPolicy",
          "kms:PutKeyPolicy",
          "kms:ScheduleKeyDeletion",
          "lambda:AddPermission",
          "lambda:CreateEventSourceMapping",
          "lambda:CreateFunction",
          "lambda:DeleteEventSourceMapping",
          "lambda:DeleteFunction",
          "lambda:GetEventSourceMapping",
          "lambda:GetFunction",
          "lambda:ListEventSourceMappings",
          "lambda:ListTags",
          "lambda:RemovePermission",
          "lambda:TagResource",
          "lambda:UntagResource",
          "lambda:UpdateEventSourceMapping",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "logs:CreateLogGroup",
          "logs:DeleteLogGroup",
          "logs:DescribeLogGroups",
          "logs:PutRetentionPolicy",
          "route53:ChangeResourceRecordSets",
          "route53:GetChange",
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:GetBucketPolicy",
          "s3:GetBucketVersioning",
          "s3:ListBucket",
          "s3:PutBucketPolicy",
          "s3:PutBucketVersioning",
          "scheduler:CreateSchedule",
          "scheduler:DeleteSchedule",
          "scheduler:GetSchedule",
          "scheduler:UpdateSchedule",
          "secretsmanager:CreateSecret",
          "secretsmanager:DeleteSecret",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:TagResource",
          "sns:CreateTopic",
          "sns:DeleteTopic",
          "sns:GetTopicAttributes",
          "sns:Subscribe",
          "sns:Unsubscribe",
          "sqs:CreateQueue",
          "sqs:DeleteQueue",
          "sqs:GetQueueAttributes",
          "sqs:SetQueueAttributes"
        ]
        Resource = local.ci_resource_arns
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ci_runner" {
  role       = aws_iam_role.ci_runner.name
  policy_arn = aws_iam_policy.ci_runner.arn
}
