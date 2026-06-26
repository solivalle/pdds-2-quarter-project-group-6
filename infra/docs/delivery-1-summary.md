# Delivery 1 Summary – IaC Workspace Bootstrap & CI Pipeline

## 1. Cloud Provider and Region Selection

For this project, we selected Amazon Web Services (AWS) as our cloud provider and chose the `us-west-2` region (Oregon). We selected AWS because it is one of the most widely adopted cloud providers in the industry and provides a large ecosystem of services that can support all the requirements of this course project, including compute, networking, storage, IAM, observability, and asynchronous messaging.

We selected the `us-west-2` region because it is commonly used during the course exercises and demonstrations provided by the instructor. Since many examples, labs, and supporting materials are already based on this region, we decided to use the same one to simplify troubleshooting and maintain consistency with the classroom environment. This decision allows us to better reuse the resources and examples discussed during class sessions while reducing the risk of region-specific issues during development.

Our Terraform provider configuration is the following:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.6.0"
}

provider "aws" {
  region = var.region
}
```

The provider version was pinned using the `~> 5.0` constraint to ensure compatibility and predictable behavior while still allowing minor updates and security fixes.

---

# 2. Provisioned Resource

The first provisioned resource selected for this delivery was an Amazon S3 bucket. We decided to use an S3 bucket because it is one of the simplest and safest AWS resources to provision during the initial setup stage of the project.

An empty S3 bucket generates little to no operational cost as long as no objects are stored and no requests are made against it. Because of this, we considered it an ideal proof-of-concept resource to validate that our Terraform workspace, AWS credentials, variables, and CI pipeline were correctly configured without introducing unnecessary infrastructure complexity or costs.

The bucket also serves as a good starting point because S3 is frequently used in cloud architectures for storing application assets, Terraform remote state, logs, backups, and static files. This makes the resource realistic and useful for future project deliveries.

The Terraform outputs we defined are:

```hcl
output "bucket_name" {
  description = "Bucket name"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "Bucket ARN"
  value       = aws_s3_bucket.main.arn
}
```

The `bucket_name` output could be used by downstream modules or deployment scripts that need to upload files or reference the bucket directly. The `bucket_arn` output could later be used when creating IAM policies, bucket permissions, logging integrations, or services that require access to the bucket through AWS resource identifiers.

Example Terraform plan excerpt:

```text
# aws_s3_bucket.main will be created
+ resource "aws_s3_bucket" "main" {
    + arn           = (known after apply)
    + bucket        = "example-project-dev-bucket"
    + force_destroy = false
    + id            = (known after apply)

    + tags_all      = (known after apply)
  }

Plan: 1 to add, 0 to change, 0 to destroy.
```

---

# 3. CI Pipeline Architecture

Our CI pipeline was implemented using GitHub Actions and is automatically triggered on every pull request targeting the `main` branch.

The pipeline is composed of the following stages:

## Checkout Code

```yaml
- name: Checkout code
  uses: actions/checkout@v4
```

This step downloads the repository contents into the GitHub Actions runner so the workflow can access the Terraform configuration files.

## Set Up Terraform

```yaml
- name: Set up Terraform
  uses: hashicorp/setup-terraform@v3
```

This stage installs the Terraform CLI inside the runner environment and configures the Terraform version used by the workflow.

## Terraform Init

```yaml
terraform init -backend=false
```

This step initializes the Terraform workspace and downloads the required providers without configuring a remote backend. Since Delivery 1 uses local state, the `-backend=false` option was required.

## Terraform Format Check

```yaml
terraform fmt --check -recursive
```

This stage validates that all Terraform files follow the canonical Terraform formatting style. The pipeline fails if any file requires formatting changes.

## Terraform Validate

```yaml
terraform validate
```

This step performs static validation of the Terraform configuration and checks for syntax errors, invalid resource arguments, or missing variables.

## Configure AWS Credentials

```yaml
uses: aws-actions/configure-aws-credentials@v4
```

This stage injects AWS credentials into the runner environment using encrypted GitHub repository secrets.

The following GitHub Secrets were configured:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

We intentionally avoided hardcoding credentials inside Terraform files or workflow YAML files in order to follow security best practices and comply with the project requirements.

## Terraform Plan

```yaml
terraform plan -var-file=envs/dev/dev.tfvars
```

This stage generates an execution plan using the development environment variables file. The generated plan is also stored in `plan.txt`.

## Post Plan as PR Comment

This final stage publishes the Terraform plan output as a comment inside the pull request using the GitHub API and the `actions/github-script` action.

The comment is wrapped inside a collapsible `<details>` section to improve readability and reduce clutter in the pull request conversation.

---

# 4. Variable Design

We defined four input variables in `variables.tf` to make the Terraform configuration reusable and environment-independent.

## environment

```hcl
variable "environment" {
  description = "Deployment environment"
  type        = string
}
```

This variable defines the deployment environment, such as `dev` or `staging`. In the future, we expect production environments to use stricter security settings, naming conventions, and potentially different infrastructure configurations.

## project_name

```hcl
variable "project_name" {
  description = "Project name"
  type        = string
}
```

This variable defines the project identifier used for naming and tagging AWS resources. The value could differ between environments or project stages if necessary.

## region

```hcl
variable "region" {
  description = "AWS region"
  type        = string
}
```

This variable allows the Terraform configuration to remain flexible and portable across AWS regions. While we currently use `us-west-2`, the configuration can easily be adapted to another region if needed.

## bucket_name

```hcl
variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}
```

This variable defines the S3 bucket name. We expect the naming convention to differ between development and production environments to avoid naming conflicts and clearly identify environment ownership.

For example:

- Development: `project-dev-bucket`
- Production: `project-staging-bucket`

Using variables improves maintainability, scalability, and environment isolation while reducing duplicated configuration code.

---

# 5. Decisions and Trade-offs

## Workspace Structure Separation

One important decision we made was separating the Terraform configuration into multiple files instead of creating a single monolithic `main.tf`.

We created independent files such as:

- `provider.tf`
- `variables.tf`
- `outputs.tf`
- `main.tf`

We also separated environment-specific variables under the `envs/` directory.

This structure improves readability, maintainability, and scalability as the project grows throughout future deliveries. By organizing the code according to responsibilities, we can more easily locate providers, variables, outputs, and resources without navigating through a large file. We believe this approach will simplify collaboration between team members and reduce merge conflicts during development.

## Provider Version Pinning Strategy

Another important decision was pinning both the Terraform version and AWS provider version instead of allowing unrestricted upgrades.

We used:

```hcl
required_version = ">= 1.6.0"
version = "~> 5.0"
```

This strategy provides a balance between stability and flexibility. Pinning versions helps prevent unexpected breaking changes caused by major provider upgrades while still allowing compatible minor updates and patches. Since Terraform providers evolve frequently, controlling versions reduces the risk of inconsistent behavior between local environments and CI runners.

## GitHub Secrets for Credential Management

We decided to store AWS credentials using GitHub encrypted repository secrets instead of embedding them directly inside Terraform files or workflow definitions.

This approach improves security by preventing accidental credential exposure inside the repository history. It also aligns with infrastructure-as-code best practices and the assignment requirements. Additionally, using secrets simplifies credential rotation because credentials can be updated directly in the GitHub repository settings without modifying the codebase.