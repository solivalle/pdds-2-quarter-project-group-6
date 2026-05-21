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
