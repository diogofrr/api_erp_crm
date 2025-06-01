# 🎫 CRM API - Sistema de Gerenciamento de Eventos e Ingressos

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 📋 Descrição

API REST robusta e escalável para gerenciamento de eventos e ingressos, desenvolvida com NestJS, TypeScript e PostgreSQL. Sistema completo de CRM para controle de usuários, eventos, ingressos e autenticação JWT.

**Desenvolvido por:** Diogo Henrique Ferreira

## ✨ Funcionalidades

### 🔐 Autenticação & Autorização

- Registro e login de usuários
- Autenticação JWT com tokens seguros
- Sistema de roles e permissões
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

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker & Docker Compose
- PowerShell (para scripts de automação)

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
```

### 4. Inicialize o banco de dados

```bash
# Inicia o PostgreSQL via Docker e aplica as migrações
npm run db:init
```

### 5. Execute a aplicação

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
- **Role**: Funções/roles dos usuários
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
npm run db:init            # Inicializa BD com Docker + Prisma
npm run db:reset           # Reseta completamente o banco

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

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Registro de usuário |
| POST | `/auth/login` | Login do usuário |
| POST | `/auth/logout` | Logout (requer token) |
| GET | `/auth/refresh` | Renovação de token |

### 🎉 Eventos (`/events`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/events` | Lista todos os eventos |
| GET | `/events/:id` | Busca evento por ID |
| POST | `/events` | Cria novo evento |
| PATCH | `/events/:id` | Atualiza evento |
| DELETE | `/events/:id` | Remove evento |

### 🎫 Ingressos (`/tickets`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tickets` | Lista ingressos (paginado) |
| GET | `/tickets/:id` | Busca ingresso por ID |
| GET | `/tickets/search?query=` | Busca por CPF/nome |
| GET | `/tickets/event?eventId=` | Ingressos por evento |
| POST | `/tickets` | Cria novo ingresso |
| PATCH | `/tickets/:id` | Atualiza ingresso |
| PATCH | `/tickets/:eventId/:ticketId/confirm` | Confirma entrada |
| DELETE | `/tickets/:id` | Remove ingresso |

### 📋 Exemplos de Requisições

#### Registro de Usuário

```json
POST /auth/register
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "minhasenha123"
}
```

#### Criação de Evento

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

#### Criação de Ingresso

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

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Tokens JWT com expiração configurável
- Validação rigorosa de entrada de dados
- Proteção contra ataques de injeção SQL
- Headers de segurança configurados

## 🐳 Docker

O projeto inclui configuração completa do Docker:

```bash
# Subir apenas o banco de dados
docker-compose up -d

# Parar e remover volumes
docker-compose down -v
```

## 📈 Monitoramento e Logs

- Logs estruturados com Winston
- Métricas de performance
- Health checks configurados
- Monitoramento de queries do Prisma

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença UNLICENSED. Consulte o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

### Diogo Henrique Ferreira

- GitHub: [@ddiog](https://github.com/ddiog)
- Email: <contato@diogoferreira.dev>

## 🎯 Roadmap

- [ ] Implementação de WebSockets para notificações em tempo real
- [ ] Sistema de relatórios e analytics
- [ ] Integração com gateways de pagamento
- [ ] API de envio de emails
- [ ] Sistema de cupons e promoções
- [ ] App mobile com React Native
- [ ] Dashboard administrativo com React

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela!** ⭐
