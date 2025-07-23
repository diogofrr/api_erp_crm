# Configurações de Segurança

Este documento descreve as configurações de segurança implementadas na API CRM.

## CORS (Cross-Origin Resource Sharing)

A aplicação está configurada com CORS para controlar quais domínios podem acessar a API:

- **Origins permitidas**: Configuradas via variável de ambiente `ALLOWED_ORIGINS`
- **Métodos permitidos**: GET, POST, PUT, DELETE, PATCH
- **Headers permitidos**: Content-Type, Authorization
- **Credentials**: Habilitado para autenticação
- **Max Age**: 24 horas

### Configuração de Ambiente

```env
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,https://yourdomain.com"
```

## Rate Limiting

Implementado rate limiting em dois níveis:

1. **Limite por minuto**: 100 requisições por minuto
2. **Limite por hora**: 1000 requisições por hora

### Configuração

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000, // 1 minuto
    limit: 100, // 100 requisições por minuto
  },
  {
    ttl: 3600000, // 1 hora
    limit: 1000, // 1000 requisições por hora
  },
]);
```

## Headers de Segurança (Helmet)

O Helmet adiciona automaticamente headers de segurança:

- **X-Content-Type-Options**: Previne MIME type sniffing
- **X-Frame-Options**: Previne clickjacking
- **X-XSS-Protection**: Proteção contra XSS
- **Strict-Transport-Security**: Força HTTPS
- **Content-Security-Policy**: Política de segurança de conteúdo

## Validação de Dados

O ValidationPipe está configurado com:

- **whitelist**: Remove propriedades não decoradas
- **forbidNonWhitelisted**: Rejeita requisições com propriedades não permitidas
- **transform**: Transforma automaticamente os dados

## Variáveis de Ambiente Recomendadas

```env
# Configurações de Segurança
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,https://yourdomain.com"
PORT=8080

# Configurações JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# Configurações do Banco de Dados
DATABASE_URL="postgresql://username:password@localhost:5432/crm_db"
```

## Monitoramento

Para monitorar ataques e uso excessivo:

1. Configure logs para registrar requisições rejeitadas pelo rate limiting
2. Monitore headers de segurança
3. Configure alertas para padrões suspeitos de acesso

## Próximos Passos

- Implementar autenticação de dois fatores (2FA)
- Adicionar logging de auditoria
- Configurar WAF (Web Application Firewall)
- Implementar rate limiting específico por rota
- Adicionar validação de IP para endpoints sensíveis
