# 🚀 Configuração do Cloudflare R2 para PDFs

## 📋 Pré-requisitos

1. **Conta Cloudflare** (gratuita)
2. **Bucket R2** criado
3. **API Tokens** configurados

## 🔧 Configuração do R2

### 1. Criar Bucket R2

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá para **R2 Object Storage**
3. Clique em **Create bucket**
4. Nome: `crm-tickets`
5. Região: escolha a mais próxima

### 2. Configurar API Tokens

1. Vá para **My Profile** > **API Tokens**
2. Clique em **Create Token**
3. Use template: **Custom token**
4. Permissões:
   - **Object Read** (Read)
   - **Object Write** (Edit)
   - **Bucket Read** (Read)

### 3. Configurar Domínio Customizado (Opcional)

1. Vá para **R2** > **Settings** > **Custom Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

## 🔑 Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
# Cloudflare R2 Storage
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="crm-tickets"
R2_PUBLIC_URL="https://your-bucket.your-domain.com"

# Email Configuration (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## 📧 Configuração do Email

### Gmail (Recomendado)

1. Ative **2-Factor Authentication**
2. Gere **App Password**:
   - Google Account > Security > App passwords
   - Selecione "Mail"
   - Use a senha gerada em `SMTP_PASS`

### Outros Provedores

- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Provedor próprio**: Configure conforme documentação

## 🧪 Testando a Configuração

### 1. Teste R2

```bash
# Gerar PDF de teste
curl -X POST http://localhost:3000/pdf/generate-ticket \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "ticket-uuid-here"}'
```

### 2. Teste Email

```bash
# Enviar email com PDF
curl -X POST http://localhost:3000/pdf/send-ticket-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "ticket-uuid-here",
    "email": "test@example.com",
    "ticketName": "João Silva",
    "eventName": "Show de Rock"
  }'
```

## 💰 Custos

### R2 Free Tier:

- **1GB** de armazenamento
- **10GB** de transferência
- **Sem cobrança** por requisições
- **CDN global** incluído

### Após Free Tier:

- **$0.015/GB** por mês (armazenamento)
- **$0.40/GB** de transferência
- **Sem cobrança** por requisições

## 🔒 Segurança

### Recomendações:

1. **Rotacione** as chaves API regularmente
2. **Use HTTPS** para todas as URLs
3. **Configure CORS** se necessário
4. **Monitore** o uso via Cloudflare Dashboard

## 🚨 Troubleshooting

### Erro: "Access Denied"

- Verifique as permissões do API Token
- Confirme se o bucket existe

### Erro: "Invalid Endpoint"

- Verifique o formato da URL do endpoint
- Confirme o Account ID

### Erro: "Email não enviado"

- Verifique as credenciais SMTP
- Teste com Gmail App Password
- Confirme se 2FA está ativo

## 📚 Recursos Adicionais

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 Compatibility](https://developers.cloudflare.com/r2/api/s3/)
- [Pricing Calculator](https://www.cloudflare.com/products/r2/)
