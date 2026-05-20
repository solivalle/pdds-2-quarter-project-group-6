environment  = "prod"
project_name = "pdds-2-quarter-project-group-6"
bucket_name  = "pdds-2-quarter-project-group-6-s3"
region       = "us-west-2"
allowed_cidr_blocks = [
  "0.0.0.0/0"
]
vpc_id = "<your-prod-vpc-id>"
ami_id        = "ami-0ddb64e71e68cf624"
instance_type = "t4g.nano"