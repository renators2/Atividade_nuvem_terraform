variable "aws_region" {
  description = "Região AWS onde os recursos serão criados"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefixo para nomear os recursos AWS"
  type        = string
  default     = "chat-ia"
}

variable "openai_api_key" {
  description = "Chave de API da OpenAI (GPT-4o)"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "Usuário administrador do PostgreSQL"
  type        = string
  default     = "chatiaadmin"
}

variable "db_password" {
  description = "Senha do banco de dados PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Nome do banco de dados"
  type        = string
  default     = "chatia"
}

variable "app_port" {
  description = "Porta em que a aplicação escuta"
  type        = number
  default     = 3000
}
