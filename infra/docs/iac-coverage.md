# Delivery 5 IaC Coverage

This document maps every TicketFlow cloud component to Terraform-managed infrastructure.

## Component-to-IaC mapping

| Application Component | Cloud Service Used | Terraform Resource Type | Module Path |
|---|---|---|---|
| Public network | Amazon VPC | `aws_vpc` | `infra/modules/network` |
| Public subnets | Amazon VPC | `aws_subnet` | `infra/modules/network` |
| Private subnets | Amazon VPC | `aws_subnet` | `infra/modules/network` |
| Internet gateway | Amazon VPC | `aws_internet_gateway` | `infra/modules/network` |
| NAT gateway | Amazon VPC | `aws_nat_gateway` | `infra/modules/network` |
| ALB security group | Amazon EC2 Security Groups | `aws_security_group` | `infra/modules/network` |
| App security group | Amazon EC2 Security Groups | `aws_security_group` | `infra/modules/network` |
| Public ingress | Application Load Balancer | `aws_lb` | `infra/modules/ingress` |
| HTTP listener | Application Load Balancer | `aws_lb_listener` | `infra/modules/ingress` |
| HTTPS listener | Application Load Balancer | `aws_lb_listener` | `infra/modules/ingress` |
| TLS certificate | AWS ACM | `aws_acm_certificate` | `infra/modules/ingress` |
| Backend compute | Amazon EC2 | `aws_instance` | `infra/modules/compute` |
| Backend artifact | Amazon S3 Object | `aws_s3_object` | `infra/modules/compute` |
| Tickets table | Amazon DynamoDB | `aws_dynamodb_table` | `infra/modules/database` |
| Seed ticket | Amazon DynamoDB | `aws_dynamodb_table_item` | `infra/modules/database` |
| Attachments storage | Amazon S3 | `aws_s3_bucket` | `infra/modules/storage` |
| App artifact bucket | Amazon S3 | `aws_s3_bucket` | `infra/modules/storage` |
| Async queue | Amazon SQS | `aws_sqs_queue` | `infra/modules/async` |
| Dead-letter queue | Amazon SQS | `aws_sqs_queue` | `infra/modules/async` |
| Health check function | AWS Lambda | `aws_lambda_function` | `infra/modules/compute_lambda` |
| Scheduled health check | EventBridge Scheduler | `aws_scheduler_schedule` | `infra/modules/scheduler` |
| Compute role | AWS IAM | `aws_iam_role` | `infra/modules/iam` |
| Async consumer role | AWS IAM | `aws_iam_role` | `infra/modules/iam` |
| Lambda role | AWS IAM | `aws_iam_role` | `infra/modules/iam` |
| Scheduler role | AWS IAM | `aws_iam_role` | `infra/modules/iam` |
| CI runner role | AWS IAM | `aws_iam_role` | `infra/modules/iam` |
| GitHub OIDC provider | AWS IAM | `aws_iam_openid_connect_provider` | `infra/modules/iam` |
| Runtime secret | AWS Secrets Manager | `aws_secretsmanager_secret` | `infra/modules/security` |
| Customer-managed key | AWS KMS | `aws_kms_key` | `infra/modules/security` |
| Backend logs | Amazon CloudWatch Logs | `aws_cloudwatch_log_group` | `infra/modules/observability` |
| Lambda logs | Amazon CloudWatch Logs | `aws_cloudwatch_log_group` | `infra/modules/observability` |
| Alert notifications | Amazon SNS | `aws_sns_topic` | `infra/modules/observability` |
| ALB error alarm | Amazon CloudWatch | `aws_cloudwatch_metric_alarm` | `infra/modules/observability` |
| Lambda error alarm | Amazon CloudWatch | `aws_cloudwatch_metric_alarm` | `infra/modules/observability` |
| Operations dashboard | Amazon CloudWatch | `aws_cloudwatch_dashboard` | `infra/modules/observability` |
| Monthly budget | AWS Budgets | `aws_budgets_budget` | `infra/modules/observability` |

## Manual resource confirmation

The intended Delivery 5 target state is that all running TicketFlow cloud resources are managed by Terraform. No application resource should be created manually through the AWS console.

If any resource was created manually during earlier deliveries, import it into Terraform state and document it below before submission.

## Imported resources

No imports are documented yet.

## Required state audit

Before tagging the delivery, run:

```bash
cd infra
terraform state list > evidence/state-list.txt
```

Then confirm that `infra/evidence/state-list.txt` contains at least one resource from each category: compute, storage, database, networking, async, security/IAM, and observability.
