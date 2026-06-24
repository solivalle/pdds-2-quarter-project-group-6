data "archive_file" "app" {
  type        = "zip"
  output_path = "${path.module}/../../tmp/project.zip"

  source {
    content  = file("${local.backend_dir}/package.json")
    filename = "package.json"
  }

  source {
    content  = file("${local.backend_dir}/package-lock.json")
    filename = "package-lock.json"
  }

  dynamic "source" {
    for_each = fileset(local.backend_dist_dir, "**")

    content {
      content  = file("${local.backend_dist_dir}/${source.value}")
      filename = "dist/${source.value}"
    }
  }

  dynamic "source" {
    for_each = local.frontend_dist_files

    content {
      content  = file("${local.frontend_dist_dir}/${source.value}")
      filename = "public/${source.value}"
    }
  }
}

locals {
  backend_dir         = abspath("${path.module}/../../../backend")
  backend_dist_dir    = "${local.backend_dir}/dist"
  frontend_dir        = abspath("${path.module}/../../../frontend")
  frontend_dist_dir   = "${local.frontend_dir}/dist"
  frontend_dist_files = try(fileset(local.frontend_dist_dir, "**"), [])
}

resource "aws_s3_object" "project" {
  bucket      = var.app_bucket_id
  key         = "project.zip"
  source      = data.archive_file.app.output_path
  source_hash = data.archive_file.app.output_base64sha256

  lifecycle {
    precondition {
      condition     = fileexists("${local.backend_dist_dir}/main.js")
      error_message = "Backend build missing. Run `npm run deploy:prepare` from the repository root before terraform plan/apply."
    }

    precondition {
      condition     = contains(local.frontend_dist_files, "index.html") && length(local.frontend_dist_files) > 1
      error_message = "Frontend build missing or incomplete. Run `npm run deploy:prepare` from the repository root before terraform plan/apply."
    }
  }
}

resource "aws_instance" "this" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  iam_instance_profile   = var.iam_instance_profile_name
  vpc_security_group_ids = [var.app_sg_id]
  subnet_id              = var.subnet_id

  depends_on = [
    aws_s3_object.project
  ]

  lifecycle {
    replace_triggered_by = [aws_s3_object.project]
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
set -euxo pipefail
exec > >(tee /var/log/ticketflow-user-data.log | logger -t ticketflow-user-data -s 2>/dev/console) 2>&1

dnf install -y nodejs20 nodejs20-npm unzip awscli
dnf install -y amazon-cloudwatch-agent

rm -rf /opt/ticketflow
mkdir -p /opt/ticketflow
mkdir -p /var/log/ticketflow
aws s3 cp s3://${var.app_bucket_name}/project.zip /opt/ticketflow/project.zip
unzip -q -o /opt/ticketflow/project.zip -d /opt/ticketflow
rm -f /opt/ticketflow/project.zip

cd /opt/ticketflow
npm install --omit=dev
chown -R ec2-user:ec2-user /opt/ticketflow
chown -R ec2-user:ec2-user /var/log/ticketflow

JWT_SECRET="$(aws secretsmanager get-secret-value \
  --region ${var.aws_region} \
  --secret-id ${var.runtime_secret_arn} \
  --query SecretString \
  --output text)"

install -m 0600 /dev/null /etc/ticketflow.env
printf 'JWT_SECRET=%s\n' "$JWT_SECRET" > /etc/ticketflow.env

cat >/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CWCONFIG'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/ticketflow/backend.log",
            "log_group_name": "${var.backend_log_group_name}",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
CWCONFIG

cat >/etc/systemd/system/ticketflow.service <<'SERVICE'
[Unit]
Description=TicketFlow backend API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/ticketflow
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/ticketflow/backend.log
StandardError=append:/var/log/ticketflow/backend.log
Environment=NODE_ENV=production
Environment=PORT=8080
Environment=AWS_REGION=${var.aws_region}
EnvironmentFile=/etc/ticketflow.env
Environment=DATA_STORE=dynamodb
Environment=ATTACHMENT_STORE=s3
Environment=SLA_POLICY_PRESET=demo
Environment=SLA_JOB_CRON=* * * * *
Environment=DYNAMODB_TICKETS_TABLE=${var.table_name}
Environment=S3_ATTACHMENTS_BUCKET=${var.storage_bucket_name}
Environment=QUEUE_URL=${var.queue_url}
Environment=DLQ_URL=${var.dlq_url}
Environment=ASYNC_QUEUE_URL=${var.queue_url}
Environment=ASYNC_BUCKET_NAME=${var.storage_bucket_name}
Environment=ASYNC_POLLING_ENABLED=true
Environment=ASYNC_POLL_BATCH_SIZE=${var.polling_batch_size}
Environment=ASYNC_POLL_WAIT_TIME_SECONDS=10

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now ticketflow.service
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s
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
  port             = var.default_port
}
