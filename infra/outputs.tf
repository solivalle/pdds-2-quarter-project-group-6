output "bucket_name" {
  description = "Bucket name"
  value       = module.storage.bucket_id
}

output "bucket_arn" {
  description = "Bucket ARN"
  value       = module.storage.bucket_arn
}

output "compute_ec2_instance_id" {
  description = "The ID of the EC2 instance created by the compute_ec2 module."
  value       = module.compute.instance_id
}

output "compute_ec2_public_ip" {
  description = "The public IP address of the EC2 instance created by the compute_ec2 module."
  value       = module.compute.public_ip
}

output "instance_arn" {
  description = "EC2 instance ARN"
  value       = module.compute.instance_arn
}