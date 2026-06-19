# Chat IA — GPT-4o

Aplicação de chat com Inteligência Artificial utilizando o modelo **GPT-4o** da OpenAI. O histórico das conversas é persistido em um banco **PostgreSQL**.

---

## Arquitetura

### Produção (AWS)

```
Internet
   │
   ▼
[Application Load Balancer]  ← subnet pública
   │
   ▼
[ECS Fargate — Node.js App]  ← subnet privada
   │
   ▼
[RDS PostgreSQL]              ← subnet privada
```

### Local (Docker Compose)

```
Navegador → localhost:3000 → [Node.js + Express] → [PostgreSQL]
```

---

## Tecnologias

| Camada       | Tecnologia                     |
|--------------|--------------------------------|
| Frontend     | HTML + CSS + JavaScript vanilla |
| Backend      | Node.js 20 + Express           |
| IA           | OpenAI GPT-4o                  |
| Banco        | PostgreSQL 15                  |
| Infra (AWS)  | VPC, ECS Fargate, RDS, ALB, ECR, CloudWatch |
| IaC          | Terraform >= 1.5               |
| Container    | Docker + Docker Compose        |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- Chave de API da OpenAI (GPT-4o habilitado)

Para deploy na AWS, adicionalmente:
- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- [AWS CLI](https://aws.amazon.com/cli/) configurado (`aws configure`)

---

## Rodando localmente com Docker

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2. Configure a variável de ambiente

```bash
cp .env.example .env
# Edite o .env e insira sua chave da OpenAI
```

```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

### 3. Suba os containers

```bash
docker-compose up --build
```

### 4. Acesse a aplicação

Abra o navegador em: **http://localhost:3000**

Para parar:
```bash
docker-compose down
```

Para parar e apagar os dados do banco:
```bash
docker-compose down -v
```

---

## Deploy na AWS com Terraform

### 1. Crie o arquivo de variáveis

```bash
cp terraform/variables.tf terraform/terraform.tfvars
```

Crie o arquivo `terraform/terraform.tfvars`:

```hcl
aws_region     = "us-east-1"
openai_api_key = "sk-sua-chave-aqui"
db_password    = "SenhaForte123!"
```

### 2. Crie o repositório ECR primeiro

```bash
cd terraform
terraform init
terraform apply -target=aws_ecr_repository.app
```

### 3. Faça o build e push da imagem Docker

```bash
# Obtenha a URL do ECR gerada
ECR_URL=$(terraform output -raw ecr_repository_url)
AWS_REGION="us-east-1"

# Login no ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URL

# Build e push
cd ..
docker build -t chat-ia ./backend
docker tag chat-ia:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

### 4. Aplique a infraestrutura completa

```bash
cd terraform
terraform apply
```

### 5. Acesse a aplicação

Ao final do `terraform apply`, a URL pública será exibida:

```
app_url = "http://chat-ia-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com"
```

### 6. Destruir os recursos (evitar cobranças)

```bash
terraform destroy
```

---

## Endpoints da API

| Método | Rota            | Descrição                            |
|--------|-----------------|--------------------------------------|
| GET    | `/`             | Interface web do chat                |
| GET    | `/health`       | Health check (usado pelo ALB)        |
| GET    | `/api/messages` | Retorna o histórico de mensagens     |
| POST   | `/api/chat`     | Envia mensagem e recebe resposta IA  |
| DELETE | `/api/messages` | Limpa o histórico de mensagens       |

**POST /api/chat — body:**
```json
{ "message": "Olá, como você pode me ajudar?" }
```

**Resposta:**
```json
{ "reply": "Olá! Posso ajudar com..." }
```

---

## Infraestrutura AWS

| Recurso            | Descrição                                      |
|--------------------|------------------------------------------------|
| VPC                | `10.0.0.0/16` com DNS habilitado               |
| Subnets públicas   | 2 subnets em AZs diferentes (ALB)              |
| Subnets privadas   | 2 subnets em AZs diferentes (ECS + RDS)        |
| Internet Gateway   | Saída para internet nas subnets públicas       |
| NAT Gateway        | Saída para internet nas subnets privadas       |
| Security Groups    | ALB → ECS → RDS (princípio do menor privilégio)|
| ALB                | Load balancer público, porta 80                |
| ECS Fargate        | Container da aplicação (256 CPU / 512 MB RAM)  |
| ECR                | Repositório privado da imagem Docker           |
| RDS PostgreSQL 15  | `db.t3.micro`, 20 GB, em subnet privada        |
| CloudWatch Logs    | Logs do container com retenção de 7 dias       |

---

## Estrutura do projeto

```
.
├── backend/
│   ├── src/
│   │   └── server.js        # API Express + OpenAI + PostgreSQL
│   ├── public/
│   │   └── index.html       # Interface do chat (frontend)
│   ├── package.json
│   └── Dockerfile
├── terraform/
│   ├── main.tf              # Provider AWS
│   ├── variables.tf         # Variáveis configuráveis
│   ├── vpc.tf               # VPC, subnets, IGW, NAT, rotas
│   ├── security_groups.tf   # SGs para ALB, ECS e RDS
│   ├── rds.tf               # RDS PostgreSQL
│   ├── ecr.tf               # Repositório de imagem Docker
│   ├── ecs.tf               # Cluster, Task Definition e Service
│   ├── alb.tf               # Load Balancer e Target Group
│   └── outputs.tf           # URL do app, ECR URL, etc.
├── docker-compose.yml       # Ambiente local completo
├── .env.example             # Modelo de variáveis de ambiente
├── .gitignore
└── README.md
```
