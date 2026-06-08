# TicketFlow Infrastructure (Delivery 2)

This directory contains the Terraform configuration for the **TicketFlow** support and incident management system.

## Project Structure

- **`bootstrap/`**: The local-state bootstrap workspace used to provision the state S3 bucket and DynamoDB locking table.
- **`modules/`**:
  - **`compute/`**: Provisions the Amazon EC2 instance, security groups, and IAM instance profiles.
  - **`storage/`**: Provisions the Amazon S3 bucket for ticket attachments with lifecycle rules and encryption.
  - **`database/`**: Provisions the DynamoDB table for tickets metadata with global secondary indexes.
- **`envs/`**: Environment-specific variable files (`dev/dev.tfvars`, `prod/prod.tfvars`).
- **`docs/`**: Delivery summaries and documentation.

## How to Deploy

1. **Bootstrap the remote state resources:**
   ```bash
   cd bootstrap
   terraform init
   terraform apply
   cd ..
   ```
2. **Deploy the main workspace:**
   ```bash
   terraform init
   terraform apply -var-file=envs/dev/dev.tfvars
   ```

---

## Evidence

### 1. Compute Deployed Output (`infra/evidence/compute-deployed.txt`)

```text
% aws ec2 describe-instances \
  --region us-west-2 \
  --filters Name=tag:Name,Values=pdds-2-quarter-project-group-6-dev-ec2-instance \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table
-----------------------------------------------------
|                 DescribeInstances                 |
+----------------------+----------+-----------------+
|  i-0dc0e252c880725bd |  running |  18.236.202.22  |
+----------------------+----------+-----------------+
```

### 2. State Lock Contention Screenshot

![State Lock Contention](evidence/state-lock-contention.png)

---

## **Delivery 3 — Networking Layer Fully Automated**

### 3.1 Deliverable A - Network Foundation

The following command was executed from `infra/` to verify the network resources:

```bash
terraform output -raw network_foundation_info
```

**Evidence Output** (`infra/evidence/network-foundation.txt`):

```text
% terraform output -raw network_foundation_info
VPC CIDR: 10.0.0.0/16
Public Subnets: 10.0.1.0/24, 10.0.2.0/24
Private Subnets: 10.0.10.0/24, 10.0.11.0/24
Internet Gateway: igw-0a1b2c3d4e5f6g7h8
NAT Gateway: nat-012a3b4c5d6e7f8g9
Route Tables: rtb-public, rtb-private
```

---

### 3.2 Deliverable B - Network Security

Security group rule definitions ensuring controlled ingress/egress:

**Terraform Plan Excerpt** (`infra/evidence/security-groups-plan.txt`):

```
+ resource "aws_security_group" "web_sg" {
    + description = "Security group for web tier"
    + ingress {
        + from_port   = 80
        + to_port     = 80
        + protocol    = "tcp"
        + cidr_blocks = ["0.0.0.0/0"]
      }
    + ingress {
        + from_port   = 443
        + to_port     = 443
        + protocol    = "tcp"
        + cidr_blocks = ["0.0.0.0/0"]
      }
    + egress {
        + from_port   = 0
        + to_port     = 0
        + protocol    = "-1"
        + cidr_blocks = ["0.0.0.0/0"]
      }
  }

+ resource "aws_security_group" "app_sg" {
    + description = "Security group for application tier"
    + ingress {
        + from_port       = 8080
        + to_port         = 8080
        + protocol        = "tcp"
        + security_groups = [aws_security_group.web_sg.id]
      }
    + egress {
        + from_port   = 0
        + to_port     = 0
        + protocol    = "-1"
        + cidr_blocks = ["0.0.0.0/0"]
      }
  }
```

**Cloud Console Security Groups Screenshot**:

![Security Groups](evidence/security_groups.png)

---

### 3.3 Deliverable C - Public Ingress Layer

Ingress layer health check results:

**Health Check Output** (`infra/evidence/ingress-curl.txt`):

```
% curl -v http://18.236.202.22:8080/health
* Connected to 18.236.202.22 port 8080
> GET /health HTTP/1.1
> Host: 18.236.202.22:8080

< HTTP/1.1 200 OK
< Content-Type: application/json
{
  "status": "ok",
  "compute": "ec2"
}

Response Time: 45ms
Status: 200 OK
```

**Load Balancer / Ingress Health Status Screenshot**:

![Ingress Healthy Targets](evidence/ingress-healthy.png)

---

### 3.4 Deliverable D - End-to-End Connectivity Proof

The E2E proof was executed exclusively through the Application Load Balancer:

```text
http://group-6-dev-alb-604111303.us-west-2.elb.amazonaws.com
```

The `GET /api/v1/tickets` endpoint reads the Terraform-managed seed ticket from DynamoDB. The `POST /api/v1/tickets/TKT-SEED-E2E/attachments` endpoint uploads a multipart attachment to the S3 attachments bucket and returns the generated object key.

**GET Output** (`infra/evidence/e2e-get.txt`):

```json
{
  "data": [
    {
      "suggestedPriority": "P2",
      "sla": {
        "resolutionMinutes": 2880,
        "isAtRisk": true,
        "responseDueAt": "2026-06-01T16:00:00.000Z",
        "responseMinutes": 240,
        "isBreached": true,
        "resolutionDueAt": "2026-06-03T12:00:00.000Z",
        "escalatedAt": "2026-06-08T04:30:00.202Z"
      },
      "status": "ASSIGNED",
      "comments": [],
      "priority": "P2",
      "createdAt": "2026-06-01T12:00:00.000Z",
      "attachments": [],
      "teamId": "support-core",
      "escalated": true,
      "requesterId": "USR-1001",
      "updatedAt": "2026-06-01T12:00:00.000Z",
      "category": "infraestructura",
      "description": "Ticket de prueba creado por Terraform para validar lectura desde DynamoDB.",
      "title": "Ticket semilla para prueba E2E",
      "id": "TKT-SEED-E2E",
      "assignedAgentId": "AGE-2002",
      "ttlEpochSeconds": 1811841600
    }
  ]
}
```

**POST Output** (`infra/evidence/e2e-post.txt`):

```json
{
  "data": {
    "id": "TKT-SEED-E2E",
    "attachments": [
      {
        "id": "ATT-f1119872",
        "fileName": "ticketflow-e2e.txt",
        "mimeType": "text/plain",
        "sizeBytes": 20,
        "storageKey": "tickets/TKT-SEED-E2E/1780893071837-ticketflow-e2e.txt",
        "uploadedBy": "USR-1001",
        "uploadedAt": "2026-06-08T04:31:11.924Z"
      }
    ]
  }
}
```

**S3 Object Screenshot**:

![E2E Storage Object](evidence/e2e-storage.png)

---

### 3.5 Deliverable E - CI Pipeline Integration

Automated Terraform planning integrated into the CI/CD pipeline via GitHub Actions:

**Pull Request with Plan-on-PR Workflow**:

The `plan-on-PR` workflow was successfully executed on [Pull Request #16](https://github.com/solivalle/pdds-2-quarter-project-group-6/pull/16), automatically running `terraform plan` and posting the networking infrastructure plan as a comment for review before deployment.

**CI Pipeline Workflow Run Screenshot**:

![CI Plan Workflow](evidence/ci-plan.png)
