output "app_url" {
  description = "URL pública da aplicação via Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "URL do repositório ECR para push da imagem Docker"
  value       = aws_ecr_repository.app.repository_url
}

output "rds_endpoint" {
  description = "Endpoint do banco de dados RDS"
  value       = aws_db_instance.main.address
}

output "cloudwatch_log_group" {
  description = "Nome do grupo de logs no CloudWatch"
  value       = aws_cloudwatch_log_group.app.name
}
