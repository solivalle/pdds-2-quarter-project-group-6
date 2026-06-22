terraform {
  backend "s3" {
    bucket               = "pdds-2-quarter-project-group-6-tfstate"
    key                  = "infra/terraform.tfstate"
    workspace_key_prefix = "infra"
    region               = "us-west-2"
    dynamodb_table       = "pdds-2-quarter-project-group-6-locks"
    encrypt              = true
  }
}
