data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/index.py"
  output_path = "${path.module}/lambda/tmp/lambda.zip"
}

resource "aws_iam_role" "lambda" {
  name = "lambda-${var.environment}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "lambda_health_check" {
  function_name    = "lambda-${var.environment}"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  handler          = "index.lambda_handler"
  runtime          = "python3.12"
  architectures    = [var.architecture]
  memory_size      = var.memory_size
  role             = aws_iam_role.lambda.arn

  environment {
    variables = {
      COMPUTE_TYPE = "lambda"
      HEALTH_URL   = "http://${var.alb_dns_name}${var.health_check_path}"
    }
  }
}