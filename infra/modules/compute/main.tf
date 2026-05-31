resource "aws_iam_role" "instance" {
  name = "${var.project_name}-${var.environment}-instance-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "archive_file" "app" {
  type        = "zip"
  source_dir  = "${path.module}/../../app"
  output_path = "${path.module}/../../tmp/project.zip"
}

resource "aws_s3_object" "project" {
  bucket      = var.app_bucket_id
  key         = "project.zip"
  source      = data.archive_file.app.output_path
  source_hash = data.archive_file.app.output_base64sha256
}

resource "aws_iam_role_policy" "s3_read" {
  name = "read-app-binary"
  role = aws_iam_role.instance.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject"]
      Resource = "arn:aws:s3:::${var.app_bucket_name}/*"
    }]
  })
}

resource "aws_iam_role_policy" "storage_data_access" {
  name = "storage-data-access"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"

      Action = [
        "s3:ListBucket"
      ]

      Resource = "arn:aws:s3:::${var.storage_bucket_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::${var.storage_bucket_name}/*"
    }]
  })
}

resource "aws_iam_instance_profile" "this" {
  name = "${var.project_name}-${var.environment}-profile"
  role = aws_iam_role.instance.name
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "dynamodb-access"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ]
      Resource = var.table_arn
    }]
  })
}

resource "aws_security_group" "instance" {
  name        = "${var.project_name}-${var.environment}-sg"
  description = "Security group for EC2 instances"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [var.web_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "this" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  iam_instance_profile   = aws_iam_instance_profile.this.name
  vpc_security_group_ids = [aws_security_group.instance.id]
  subnet_id              = var.subnet_id

  depends_on = [
    aws_s3_object.project
  ]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    dnf install -y nodejs unzip  # Install Node.js
    mkdir -p /opt/app
    aws s3 cp s3://${var.app_bucket_name}/project.zip /opt/project.zip
    unzip -o /opt/project.zip -d /opt/app
    export STORAGE_BUCKET=${var.storage_bucket_name}
    export DYNAMODB_TABLE=${var.table_name}
    COMPUTE_TYPE=ec2 nohup node /opt/app/index.js &  
  EOF
  )

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-instance"
    Environment = var.environment
  }
}

resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = var.aws_lb_target_group_arn
  target_id        = aws_instance.this.id
  port             = 8080
}