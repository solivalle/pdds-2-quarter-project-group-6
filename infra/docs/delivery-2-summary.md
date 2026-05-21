# Delivery 2 Summary Report – Compute, Storage, Database, and Remote State

## 1. Compute Target and Rationale

For the compute component of the **TicketFlow** system, we selected **Amazon EC2** using a Launch Template and an managed instance (`t4g.nano` with ARM64 architecture, optimized for low cost and high energy efficiency).

### Technical Justification and Trade-offs
*   **Alternative Considered:** We evaluated using **AWS Lambda** (serverless architecture). Lambda offers outstanding automatic scaling to zero and removes the need for operating system patching.
*   **Trade-off:** We decided to opt for **EC2** instead of Lambda due to the persistent nature of our API server and the need to keep the server running continuously without the penalty of cold starts that Lambda presents when handling sporadic traffic. In addition, EC2 provides us with direct control over the VPC networking configuration and the base operating system (Amazon Linux 2023), which simplifies debugging for the WebSocket/socket server needed to push real-time support updates to the agent dashboard.
*   **Recognized Disadvantage:** The disadvantage of the EC2 approach is the minimum monthly cost for running the server (mitigated by using low-cost `t4g.nano` instances) and the added operational overhead of configuring security groups, OS patching, and SSM Agent integrations for secure remote access.

---

## 2. Module Design and Composition

The infrastructure is organized into three decoupled, reusable modules under the `infra/modules/` directory:

### Module Interfaces and Variables

1.  **Compute Module (`infra/modules/compute/`):**
    *   **Inputs:** `environment`, `project_name`, `vpc_id`, `ami_id`, `instance_type`, `allowed_cidr_blocks`.
    *   **Outputs:** `instance_id`, `public_ip`, `instance_arn`.
    *   **Details:** Provisions the EC2 instance, an IAM instance profile with `AmazonSSMManagedInstanceCore` policy for secure passwordless terminal access via AWS Systems Manager, and a Security Group restricting incoming traffic to port `8080` (TicketFlow API).
2.  **Storage Module (`infra/modules/storage/`):**
    *   **Inputs:** `bucket_name`, `environment`, `lifecycle_ia_days`, `lifecycle_glacier_days`, `lifecycle_expire_days`.
    *   **Outputs:** `bucket_id`, `bucket_arn`, `bucket_domain_name`.
    *   **Details:** Provisions the S3 bucket with versioning enabled, default SSE-S3 (AES256) encryption, an SSL-only bucket policy enforcing encrypted transit, and tiered lifecycle rules to transition and expire attachments.
3.  **Database Module (`infra/modules/database/`):**
    *   **Inputs:** `environment`, `project_name`, `billing_mode` (default: `"PAY_PER_REQUEST"`).
    *   **Outputs:** `table_name`, `table_arn`.
    *   **Details:** Provisions a DynamoDB table for ticket metadata. It features server-side encryption enabled by default (`server_side_encryption { enabled = true }`), TTL enabled on the `TimeToExist` attribute, and a Global Secondary Index (GSI) to optimize queries.

### Root Module Wiring (`infra/main.tf`)
The root module invokes and connects all three modules by passing variables supplied from the environment-specific `.tfvars` files:

```hcl
module "storage" {
  source      = "./modules/storage"
  bucket_name = var.bucket_name
  environment = var.environment
}

module "compute" {
  source              = "./modules/compute"
  vpc_id              = var.vpc_id
  environment         = var.environment
  project_name        = var.project_name
  ami_id              = var.ami_id
  instance_type       = var.instance_type
  allowed_cidr_blocks = var.allowed_cidr_blocks
}

module "database" {
  source       = "./modules/database"
  environment  = var.environment
  project_name = var.project_name
}
```

### Design Decision in the Module Interface
Within the storage module, we chose to apply the S3 lifecycle rules with a **specific prefix filter** (`prefix = "tickets/"`) rather than applying the rules globally to the entire bucket. This guarantees that only temporary attachments uploaded to the `tickets/` namespace are transitioned to cheaper storage and automatically expired after 365 days, protecting static web assets or system-level configuration files stored elsewhere in the bucket from accidental deletion.

---

## 3. Remote State Migration

To achieve a clean state deployment and avoid circular dependencies, we implemented an independent bootstrapping workspace in `infra/bootstrap/`.

### Bootstrap Process and Migration Steps
1.  **Bootstrap Execution:**
    The `infra/bootstrap/` workspace runs Terraform using a local state backend (no `backend` block). It provisions the S3 bucket (`pdds-2-quarter-project-group-6-tfstate`) and the DynamoDB lock table (`pdds-2-quarter-project-group-6-locks`) that will store the state for the main workspace.
2.  **Backend Configuration:**
    Once created, the bucket and table are configured in `infra/backend.tf` in the root workspace:
    ```hcl
    terraform {
      backend "s3" {
        bucket         = "pdds-2-quarter-project-group-6-tfstate"
        key            = "infra/terraform.tfstate"
        region         = "us-west-2"
        dynamodb_table = "pdds-2-quarter-project-group-6-locks"
        encrypt        = true
      }
    }
    ```
3.  **State Migration:**
    We executed `terraform init -migrate-state` in the `infra/` root directory. Terraform detected the backend change and copied the state automatically to the remote storage:

```text
% terraform init -migrate-state

Initializing the backend...
Do you want to copy existing state to the new backend?
  Pre-existing state was found while migrating the previous "local" backend to the
  new "s3" backend. No existing state was found in the newly configured "s3" backend.
  Do you want to copy this state to the new "s3" backend? Enter "yes" to copy and "no"
  to start with an empty state.

  Enter a value: yes

Releasing state lock. This may take a few moments...

Successfully configured the backend "s3"! Terraform will now
use this backend for the newly created device.
```

### Remote Backend Resource Details
*   **S3 Bucket:** `pdds-2-quarter-project-group-6-tfstate`
*   **DynamoDB Lock Table:** `pdds-2-quarter-project-group-6-locks`
*   **Region:** `us-west-2`

---

## 4. Database Security

By leveraging **Amazon DynamoDB** (a fully managed NoSQL database service), we eliminate the need for static database credentials, connection strings, or passwords.

### Authentication and Access Control
*   **IAM-based Access Control:** All operations to the DynamoDB table are authenticated and authorized via AWS Identity and Access Management (IAM). 
*   **Principle of Least Privilege:** The EC2 compute instance runs under an IAM Instance Profile linked to an execution role. This role contains a scoped inline policy granting permissions only to read and write items on the specific DynamoDB table ARN (`pdds-2-quarter-project-group-6-dev-tickets` and its GSI). The EC2 instance is blocked from executing destructive operations (like deleting the table) or reading from other tables in the AWS account.
*   **Network Isolation:** All traffic is encrypted in transit using HTTPS. In the next delivery, we will configure a VPC Gateway Endpoint to keep all database query traffic routed privately within the AWS internal backbone without exiting to the public internet.

---

## 5. Two Architectural Trade-offs

### A. DynamoDB Billing Mode Selection (PAY_PER_REQUEST vs. PROVISIONED)
*   **Decision:** We configured `billing_mode = "PAY_PER_REQUEST"` (on-demand capacity) rather than provisioned throughput.
*   **Justification:** TicketFlow is tailored for medium-sized teams where support query traffic is sporadic and irregular (surges during working hours and near-zero traffic at night and on weekends). On-demand billing charges us per request, resulting in near-zero idle cost. In contrast, provisioned capacity would require us to pay a constant hourly rate for reserved write/read capacity units regardless of actual consumption, leading to unnecessary expenditures during off-hours.

### B. Use of prevent_destroy = true on Bootstrap Resources
*   **Decision:** We enabled `prevent_destroy = true` within the lifecycle configurations of the remote state S3 Bucket and DynamoDB Lock Table in the bootstrap workspace.
*   **Justification:** This introduces a safety guardrail preventing accidental data loss. If a team member runs `terraform destroy` in the bootstrap workspace or attempts to delete the state files, Terraform will raise an error at the planning phase and refuse to execute. To delete these critical assets, developers must explicitly modify the code to disable the lifecycle check, preventing accidental destruction of state histories and current resource locks.
