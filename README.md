# Optimizaciones y Desempeño, Seccion A
Group # 6
Francisco Magdiel Asicona Mateo 26006399
Sergio Geovany García Smith     25008130 
Sergio Rolando Oliva del Valle  26005694

# Terraform Infrastructure Workspace

This directory contains the Terraform workspace and infrastructure configuration for the project.

---

## Prerequisites

Before working with this workspace, ensure the following tools are installed:

- Terraform `~> 1.8`
- AWS CLI (optional but recommended)
- Git

Verify Terraform installation:

```bash
terraform version
```

---

## Workspace Initialization

Initialize the Terraform workspace and download the required providers:

```bash
cd infra

terraform init
```

Initialize Terraform without backend configuration:

```bash
terraform init -backend=false
```

---

## Required AWS Credentials

The workspace uses AWS credentials provided through environment variables.

The following credentials are required:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### Linux / macOS

Export the credentials in your terminal:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-west-1"
```

### Windows PowerShell

```powershell
$env:AWS_ACCESS_KEY_ID="your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY="your-secret-access-key"
$env:AWS_REGION="us-west-1"
```

### Verify Credentials

Verify the active AWS identity:

```bash
aws sts get-caller-identity
```

---

## Terraform Variables

This project uses environment-specific variable files.

Development environment variables are located at:

```text
infra/envs/dev/dev.tfvars
```

---

## Terraform Format Validation

Check Terraform formatting:

```bash
terraform fmt --check -recursive
```

Automatically format Terraform files:

```bash
terraform fmt -recursive
```

---

## Terraform Validation

Validate the Terraform configuration:

```bash
terraform validate
```

---

## Terraform Plan

Generate an execution plan using the development variables file:

```bash
terraform plan -var-file=envs/dev/dev.tfvars
```

Generate a saved execution plan:

```bash
terraform plan -var-file=envs/dev/dev.tfvars -out=tfplan
```

---

## Terraform Apply

Apply the infrastructure changes locally:

```bash
terraform apply -var-file=envs/dev/dev.tfvars
```

Apply a previously generated execution plan:

```bash
terraform apply tfplan
```

---

## Terraform Destroy

Destroy all managed infrastructure resources:

```bash
terraform destroy -var-file=envs/dev/dev.tfvars
```

---

## Repository Structure

```text
infra/
├── main.tf
├── provider.tf
├── variables.tf
├── outputs.tf
├── README.md
├── envs/
│   ├── dev/
│   │   └── dev.tfvars
│   └── prod/
├── modules/
├── docs/
│   └── README.md
```

---