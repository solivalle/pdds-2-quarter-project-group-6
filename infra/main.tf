module "storage" {
  source = "./modules/storage"

  bucket_name            = var.bucket_name
  environment            = var.environment
  lifecycle_ia_days      = 30
  lifecycle_glacier_days = 90
  lifecycle_expire_days  = 365
}

module "compute" {
  source = "./modules/compute"

  vpc_id              = var.vpc_id
  environment         = var.environment
  project_name        = var.project_name
  ami_id              = var.ami_id
  instance_type       = var.instance_type
  allowed_cidr_blocks = var.allowed_cidr_blocks
}

module "database" {
  source = "./modules/database"

  environment  = var.environment
  project_name = var.project_name
}

resource "time_sleep" "lock_demo" {
  create_duration = "20s"
}