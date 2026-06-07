# Main Terraform configuration file for the project infrastructure
module "network" {
  source = "./modules/network"

  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "ingress" {
  source = "./modules/ingress"

  environment       = var.environment
  name              = var.name
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  web_sg_id         = module.network.web_sg_id
}

module "storage" {
  source = "./modules/storage"

  bucket_name            = var.bucket_name
  environment            = var.environment
  lifecycle_ia_days      = 30
  lifecycle_glacier_days = 90
  lifecycle_expire_days  = 365
}

module "app_bucket" {
  source = "./modules/storage"

  bucket_name = var.app_bucket_name
  environment = var.environment
}

module "compute" {
  source = "./modules/compute"

  vpc_id                  = module.network.vpc_id
  subnet_id               = module.network.private_subnet_ids[0]
  environment             = var.environment
  app_bucket_name         = var.app_bucket_name
  app_bucket_id           = module.app_bucket.bucket_id
  storage_bucket_name     = var.bucket_name
  project_name            = var.project_name
  ami_id                  = var.ami_id
  instance_type           = var.instance_type
  web_sg_id               = module.network.web_sg_id
  aws_lb_target_group_arn = module.ingress.aws_lb_target_group_arn
  table_arn               = module.database.table_arn
  table_name              = module.database.table_name
}

module "database" {
  source = "./modules/database"

  environment  = var.environment
  project_name = var.project_name
}

resource "time_sleep" "lock_demo" {
  create_duration = "20s"
}