terraform {
  backend "s3" {
    bucket         = "group-6-tfstate"
    key            = "infra/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "group-6-locks"
    encrypt        = true
  }
}
