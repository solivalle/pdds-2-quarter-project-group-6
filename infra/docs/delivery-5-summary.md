# Delivery 5 Summary - Security, Observability & One-Click Deployment

## 1. IAM and secrets design

Delivery 5 replaces ad-hoc IAM role definitions with `infra/modules/iam/`.

Defined roles:

| Role | Purpose | Key actions | Resource scope |
|---|---|---|---|
| Compute role | EC2 backend runtime | `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:Query`, `dynamodb:Scan`, `dynamodb:DeleteItem`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `sqs:SendMessage`, `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `logs:PutLogEvents` | Tickets table ARN, attachments bucket ARN, app artifact bucket ARN, queue ARN and backend log group ARN |
| Async consumer role | Dedicated least-privilege role for a future separated async worker | `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`, `s3:PutObject` | Main SQS queue ARN and attachments bucket object ARN |
| Lambda role | Scheduled health check Lambda | `logs:CreateLogStream`, `logs:PutLogEvents`, `logs:DescribeLogStreams` | Lambda log group ARN |
| Scheduler role | EventBridge Scheduler invocation role | `lambda:InvokeFunction` | Health check Lambda ARN |
| CI runner role | GitHub Actions OIDC role | Terraform plan/apply permissions for project resources | Project resource ARNs passed into the IAM module |

The current backend runs the API and async consumer in the same EC2 process, so the active EC2 instance profile uses the compute role. The async consumer role is still defined as a separate least-privilege role to satisfy the intended separation and to support a future split into a dedicated worker.

Secrets are now provisioned with `infra/modules/security/`. Because the project uses DynamoDB, there is no database password to migrate. Instead, the backend runtime signing secret (`JWT_SECRET`) is stored in AWS Secrets Manager as `runtime_secret_name`. Terraform injects only the secret ARN into EC2 as `runtime_secret_arn`. During EC2 bootstrap, user data calls:

```bash
aws secretsmanager get-secret-value --secret-id "<runtime_secret_arn>"
```

The returned secret string is written to `/etc/ticketflow.env` with mode `0600`, and the systemd service loads it with `EnvironmentFile=/etc/ticketflow.env`. This retires the pattern of passing long-lived sensitive runtime values directly as plaintext environment variables in the workflow.

## 2. KMS key management

The `infra/modules/security/` module creates one customer-managed KMS key per environment.

| Item | Value |
|---|---|
| Alias variable | `kms_alias_name` |
| Dev alias | `alias/ticketflow-dev-cmk` |
| Prod alias | `alias/ticketflow-prod-cmk` |
| Encrypted resources | S3 attachments bucket, S3 app artifact bucket, DynamoDB tickets table, Secrets Manager runtime secret |

The key policy grants use to:

- the compute role for runtime decrypt operations;
- AWS Secrets Manager through the service principal and `kms:ViaService` condition;
- DynamoDB through the service principal and `kms:ViaService` condition;
- S3 through the service principal and `kms:ViaService` condition;
- the CI role for key administration during Terraform operations.
- optional bootstrap principals passed through `terraform_admin_principal_arns` when the first apply must be run before OIDC is active.

The bootstrap principal value is intentionally not hardcoded because it depends on the AWS account identity used by the team for the first apply.

After deployment, capture the actual key ARN with:

```bash
terraform output kms_key_arn
```

## 3. OIDC federation

The IAM module provisions a GitHub Actions OIDC provider using:

- Issuer URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`
- Subject condition: `repo:solivalle/pdds-2-quarter-project-group-6:ref:refs/heads/main`

The CI runner role is exposed as:

```bash
terraform output ci_runner_role_arn
```

Workflows now use:

```yaml
role-to-assume: ${{ vars.AWS_CI_ROLE_ARN }}
```

Privileged Terraform plan/apply jobs run on push to `main`, matching the OIDC subject condition. Pull requests run local validation without assuming the deployment role.

Long-lived GitHub secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` must be removed from repository and environment secrets after the OIDC role is applied. Keep `TICKETFLOW_RUNTIME_SECRET` as an application secret, not as a cloud provider credential.

## 4. Observability design

The `infra/modules/observability/` module provisions:

- CloudWatch log group for the backend.
- CloudWatch log group for the health check Lambda.
- SNS topic and email subscription for notifications.
- ALB 5XX alarm.
- Lambda error alarm.
- CloudWatch dashboard.
- AWS monthly cost budget with an 80% actual-cost notification.

Default alarm values:

| Alarm | Metric | Threshold | Reason |
|---|---|---:|---|
| ALB 5XX | `HTTPCode_ELB_5XX_Count` | `>= 1` | Any load balancer 5XX in this low-traffic project is worth investigating |
| Lambda errors | `Errors` | `>= 1` | The scheduled health check should not fail under normal operation |

The dashboard includes:

- ALB request count.
- Lambda error count.
- SQS visible messages.

The monthly budget defaults to `25 USD` with a notification at 80%.

## 5. Architectural trade-offs

### Shared CMK versus per-service CMKs

The implementation uses one environment-scoped CMK shared by S3, DynamoDB and Secrets Manager. A per-service key design would provide stricter separation, but would add more policy management and more operational overhead. For this project, a single CMK with a restrictive key policy gives enough control while keeping the infrastructure understandable.

### OIDC scoped to main branch only versus all branches

The CI role trust policy is scoped to `refs/heads/main`. This means pull requests and feature branches cannot directly assume the deployment role. The trade-off is that PR workflows cannot run privileged cloud plans or applies, but this is intentional: only main should deploy infrastructure. Pull requests still run local validation without cloud credentials.

## TLS domain configuration

TLS is implemented in `infra/modules/ingress/` but currently disabled in `dev.tfvars` and `prod.tfvars` until the team has a controlled domain and Route53 hosted zone.

To enable TLS:

```hcl
enable_tls     = true
domain_name    = "ticketflow.<team-domain>"
hosted_zone_id = "<route53-hosted-zone-id>"
```

The domain must be owned by the team or delegated by the instructors. ACM cannot issue certificates for AWS-owned names such as `*.elb.amazonaws.com`.

Public-facing endpoints:

| Endpoint | Source | TLS coverage |
|---|---|---|
| `https://<domain_name>` | ALB alias record in Route53 | Covered by the ACM certificate when `enable_tls=true` |
| `http://<domain_name>` | ALB HTTP listener | Redirects to HTTPS with `HTTP_301` when `enable_tls=true` |
| `http://<alb_dns_name>` | Temporary ALB DNS endpoint | Only used while TLS is disabled before the team configures a controlled domain |

## One-click deployment

The `terraform-ci.yml` workflow builds frontend and backend artifacts through:

```bash
npm run deploy:prepare
```

On push to `main`, the workflow runs Terraform plan and then Terraform apply using the saved plan artifact. This is the path used for the clean-state deployment proof and the idempotency evidence.
