# 🎫 CRM API - Sistema de Gerenciamento de Eventos e Ingressos

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

## 📋 Descrição

API REST robusta e escalável para gerenciamento de eventos e ingressos, desenvolvida com NestJS, TypeScript e PostgreSQL. Sistema completo de CRM para controle de usuários, eventos, ingressos, autenticação JWT e **geração de PDFs com armazenamento em Cloudflare R2**.

**Desenvolvido por:** Diogo Henrique Ferreira

## ✨ Funcionalidades

### 🔐 Autenticação & Autorização

- Registro e login de usuários
- Autenticação JWT com tokens seguros
- Sistema de roles e permissões (ADMIN, EVENT_MANAGER, TICKET_MANAGER, USER, HERBMASTER)
- Logout e refresh de tokens
- Hash seguro de senhas com bcrypt

### 🎉 Gerenciamento de Eventos

- CRUD completo de eventos
- Status de eventos (PENDING, ACTIVE, CANCELLED, COMPLETED)
- Controle de organizadores
- Limitação de ingressos por evento
- Preços e localização

### 🎫 Sistema de Ingressos

- Geração automática de QR Codes únicos
- Status de ingressos (PENDING, CONFIRMED, CANCELLED)
- Busca avançada por CPF e nome
- Paginação de resultados
- Confirmação de entrada em eventos
- Validação de dados pessoais

### 📄 **Geração de PDFs (NOVO!)**

- **Geração automática** de PDFs de ingressos
- **Armazenamento gratuito** no Cloudflare R2
- **QR Codes integrados** nos PDFs
- **Design profissional** e responsivo
- **Envio por email** com template HTML
- **URLs públicas** para download

### 🌿 Herbarium - Mapa de Ervas

- Mapa interativo de marcadores de ervas
- Catálogo com 68 ervas (classificação, temperatura energética, risco alérgico, saintTags, propriedades)
- Filtros por busca, status (pouca/muita) e classificação (flor/erva/arvore)
- CRUD de marcadores com geolocalização (lat/lng)
- Controle de acesso por role (ADMIN, HERBMASTER)

### 👤 Gestão de Usuários

- Perfis de usuário com avatar, telefone e endereço
- Sistema hierárquico de permissões
- Controle de usuários ativos/inativos
- Histórico de tokens de autenticação

## 🚀 Tecnologias Utilizadas

- **Backend:** NestJS 11.x
- **Linguagem:** TypeScript 5.x
- **Banco de Dados:** PostgreSQL 16
- **ORM:** Prisma 6.x
- **Autenticação:** JWT + Passport
- **Validação:** Class Validator & Class Transformer
- **Containerização:** Docker & Docker Compose
- **Testes:** Jest (Unit & E2E)
- **Linting:** ESLint + Prettier
- **PDF:** Puppeteer + QRCode
- **Storage:** Cloudflare R2 (gratuito)
- **Email:** Nodemailer

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker & Docker Compose
- PowerShell (para scripts de automação)
- Conta Cloudflare (gratuita)

### 1. Clone o repositório

```bash
git clone <repository-url>
cd api-crm
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Application
NODE_ENV="development"
PORT=3000

# Cloudflare R2 Storage (GRATUITO!)
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="crm-tickets"
R2_PUBLIC_URL="https://your-bucket.your-domain.com"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 4. Configure o Cloudflare R2 (GRATUITO!)

Siga o guia completo em: [docs/R2_SETUP.md](docs/R2_SETUP.md)

**Resumo rápido:**

1. Crie conta no Cloudflare (gratuito)
2. Crie bucket R2: `crm-tickets`
3. Gere API tokens
4. Configure as variáveis no `.env`

### 5. Inicialize o banco de dados

```bash
# Inicia o PostgreSQL via Docker, aplica migracoes, cria roles e popula catalogo de ervas
npm run db:init
```

O `db:init` executa automaticamente:
1. Sobe o PostgreSQL via Docker
2. Aplica migracoes do Prisma
3. Cria roles padrao (ADMIN, EVENT_MANAGER, TICKET_MANAGER, USER, HERBMASTER)
4. Popula catalogo de ervas (68 ervas)

### 6. Execute a aplicação

```bash
# Modo desenvolvimento (com reload automático)
npm run start:dev

# Modo produção
npm run start:prod
```

A API estará disponível em `http://localhost:3000`

## 🗄️ Estrutura do Banco de Dados

### Principais Entidades

- **User**: Usuários do sistema
- **Profile**: Perfis dos usuários
- **AuthToken**: Tokens de autenticação
- **Role**: Funções/roles dos usuários (ADMIN, EVENT_MANAGER, TICKET_MANAGER, USER, HERBMASTER)
- **HerbCatalog**: Catálogo de ervas (key, label, classificação, temperatura, risco, saintTags, propriedades)
- **HerbMarker**: Marcadores de ervas no mapa (herbKey, status, lat, lng, notas)
- **Permission**: Permissões do sistema
- **Event**: Eventos criados
- **Ticket**: Ingressos dos participantes
- **EventTicket**: Relacionamento entre eventos e ingressos

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Executa em modo desenvolvimento
npm run start:debug        # Executa com debug

# Build e Produção
npm run build              # Compila o projeto
npm run start:prod         # Executa em modo produção

# Banco de Dados
npm run db:init            # Setup completo: Docker + migracoes + roles + ervas
npm run db:reset           # Reseta completamente o banco
npm run db:migrate         # Aplica migracoes pendentes
npm run db:check           # Verifica status do banco
npm run roles:init         # Inicializa roles padrao (separado)
npm run herbs:seed         # Popula catalogo de ervas (separado)

# Testes
npm run test               # Testes unitários
npm run test:e2e           # Testes end-to-end
npm run test:cov           # Coverage dos testes

# Qualidade de Código
npm run lint               # Lint e correção automática
npm run format             # Formata código com Prettier
```

## 📚 Endpoints da API

### 🔐 Autenticação (`/auth`)

| Método | Endpoint         | Descrição             |
| ------ | ---------------- | --------------------- |
| POST   | `/auth/register` | Registro de usuário   |
| POST   | `/auth/login`    | Login do usuário      |
| POST   | `/auth/logout`   | Logout (requer token) |
| GET    | `/auth/refresh`  | Renovação de token    |

### 🎉 Eventos (`/events`)

| Método | Endpoint      | Descrição              | Roles                      |
| ------ | ------------- | ---------------------- | -------------------------- |
| GET    | `/events`     | Lista todos os eventos | ADMIN, EVENT_MANAGER, USER |
| GET    | `/events/:id` | Busca evento por ID    | ADMIN, EVENT_MANAGER, USER |
| POST   | `/events`     | Cria novo evento       | ADMIN, EVENT_MANAGER       |
| PATCH  | `/events/:id` | Atualiza evento        | ADMIN, EVENT_MANAGER       |
| DELETE | `/events/:id` | Remove evento          | ADMIN                      |

### 🎫 Ingressos (`/tickets`)

| Método | Endpoint           | Descrição                  | Roles                       |
| ------ | ------------------ | -------------------------- | --------------------------- |
| GET    | `/tickets`         | Lista ingressos (paginado) | ADMIN, TICKET_MANAGER, USER |
| GET    | `/tickets/:id`     | Busca ingresso por ID      | ADMIN, TICKET_MANAGER, USER |
| POST   | `/tickets`         | Cria novo ingresso         | ADMIN, TICKET_MANAGER       |
| PATCH  | `/tickets/:id`     | Atualiza ingresso          | ADMIN, TICKET_MANAGER       |
| PATCH  | `/tickets/confirm` | Confirma entrada           | ADMIN, TICKET_MANAGER       |
| DELETE | `/tickets/:id`     | Remove ingresso            | ADMIN                       |

### 🌿 Herbarium (`/herbarium`)

| Método | Endpoint          | Descrição                | Roles              |
| ------ | ----------------- | ------------------------ | ------------------ |
| GET    | `/herbarium`      | Lista marcadores (filtros: q, status, classification) | Público            |
| GET    | `/herbarium/:id`  | Busca marcador por ID    | Público            |
| POST   | `/herbarium`      | Cria marcador            | ADMIN, HERBMASTER  |
| PATCH  | `/herbarium/:id`  | Atualiza marcador        | ADMIN, HERBMASTER  |
| DELETE | `/herbarium/:id`  | Remove marcador          | ADMIN, HERBMASTER  |

### 📄 **PDFs (`/pdf`) - NOVO!**

| Método | Endpoint                 | Descrição            | Roles                 |
| ------ | ------------------------ | -------------------- | --------------------- |
| POST   | `/pdf/generate-ticket`   | Gera PDF do ingresso | ADMIN, TICKET_MANAGER |
| POST   | `/pdf/send-ticket-email` | Envia PDF por email  | ADMIN, TICKET_MANAGER |

## 📋 Exemplos de Requisições

### Registro de Usuário

```json
POST /auth/register
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "minhasenha123"
}
```

### Criação de Evento

```json
POST /events
{
  "name": "Show de Rock",
  "description": "Grande show de rock nacional",
  "date": "2024-12-31T20:00:00Z",
  "location": "Arena São Paulo",
  "totalTickets": 5000,
  "price": 89.90
}
```

### Criação de Ingresso

```json
POST /tickets
{
  "fullName": "Maria Santos",
  "email": "maria@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-05-15T00:00:00Z",
  "cpf": "12345678900",
  "eventId": "uuid-do-evento"
}
```

### **Geração de PDF (NOVO!)**

```json
POST /pdf/generate-ticket
{
  "ticketId": "uuid-do-ingresso"
}
```

### **Envio de PDF por Email (NOVO!)**

```json
POST /pdf/send-ticket-email
{
  "ticketId": "uuid-do-ingresso",
  "email": "cliente@email.com",
  "ticketName": "Maria Santos",
  "eventName": "Show de Rock"
}
```

## 🧪 Testes

O projeto conta com cobertura completa de testes:

```bash
# Executa todos os testes
npm run test

# Testes com coverage
npm run test:cov

# Testes E2E específicos
npm run test:e2e
```

### Estrutura de Testes

- **Unit Tests**: Testes dos services e controllers
- **E2E Tests**: Testes de integração completos
- **Coverage**: Relatórios de cobertura detalhados

## 💰 **Custos - 100% Gratuito!**

### Cloudflare R2 (Storage):

- **1GB** de armazenamento gratuito
- **10GB** de transferência gratuita
- **Sem cobrança** por requisições
- **CDN global** incluído

### Email:

- **Gmail**: Gratuito (15GB)
- **Outlook**: Gratuito (15GB)
- **Provedores próprios**: Conforme plano

### Aplicação:

- **Hosting**: Vercel, Railway, Heroku (free tiers)
- **Banco**: PostgreSQL gratuito em vários provedores
- **Domínio**: Conforme escolha

## 🚀 **Próximos Passos**

1. **Configure o R2** seguindo [docs/R2_SETUP.md](docs/R2_SETUP.md)
2. **Configure o email** no `.env`
3. **Teste a geração de PDFs**
4. **Implemente WhatsApp** (opcional)
5. **Deploy em produção**

## 📞 **Suporte**

- **Documentação R2**: [docs/R2_SETUP.md](docs/R2_SETUP.md)
- **Issues**: Abra uma issue no GitHub
- **Email**: Entre em contato para suporte

---

**🎉 Sistema completo e 100% gratuito para gerenciamento de eventos e ingressos!**
