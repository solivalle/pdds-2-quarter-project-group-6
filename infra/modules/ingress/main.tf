# ── Application Load Balancer ─────────────────────────────────────────────────
resource "aws_lb" "this" {
  name               = "${var.name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.web_sg_id]
  subnets            = var.public_subnet_ids
}

# ── Target group ──────────────────────────────────────────────────────────────
resource "aws_lb_target_group" "this" {
  name        = "${var.name}-${var.environment}-tg"
  port        = var.default_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = var.health_check_path
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 60
  }
}

resource "aws_acm_certificate" "this" {
  count = var.enable_tls ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Environment = var.environment
    Name        = "${var.name}-${var.environment}-cert"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "certificate_validation" {
  for_each = var.enable_tls ? {
    for option in aws_acm_certificate.this[0].domain_validation_options : option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id
}

resource "aws_acm_certificate_validation" "this" {
  count = var.enable_tls ? 1 : 0

  certificate_arn         = aws_acm_certificate.this[0].arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}

resource "aws_route53_record" "app" {
  count = var.enable_tls ? 1 : 0

  name    = var.domain_name
  type    = "A"
  zone_id = var.hosted_zone_id

  alias {
    evaluate_target_health = true
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
  }
}

resource "aws_lb_listener" "http_forward" {
  count = var.enable_tls ? 0 : 1

  load_balancer_arn = aws_lb.this.arn
  port              = var.ingress_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  count = var.enable_tls ? 1 : 0

  load_balancer_arn = aws_lb.this.arn
  port              = var.ingress_port
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = var.redirect_status_code
    }
  }
}

resource "aws_lb_listener" "https" {
  count = var.enable_tls ? 1 : 0

  certificate_arn   = aws_acm_certificate_validation.this[0].certificate_arn
  load_balancer_arn = aws_lb.this.arn
  port              = var.private_port
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy_name

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }

  depends_on = [aws_acm_certificate_validation.this]
}
