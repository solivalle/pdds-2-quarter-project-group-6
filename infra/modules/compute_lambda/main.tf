data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/index.py"
  output_path = "${path.module}/lambda/tmp/lambda.zip"
}

resource "aws_lambda_function" "lambda_health_check" {
  function_name    = "lambda-${var.environment}"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  handler          = "index.lambda_handler"
  runtime          = "python3.12"
  architectures    = [var.architecture]
  memory_size      = var.memory_size
  role             = var.lambda_role_arn

  environment {
    variables = {
      COMPUTE_TYPE = "lambda"
      HEALTH_URL   = var.health_check_url
    }
  }
}
