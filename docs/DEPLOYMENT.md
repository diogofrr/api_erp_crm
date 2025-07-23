# Guia de Deploy - CRM API

## Problema: Tabela User não existe

Se você receber o erro `The table 'public.User' does not exist in the current database`, significa que as migrações do Prisma não foram executadas no banco de dados de produção.

## Solução

### 1. Verificar Status do Banco (Primeiro Passo)

Antes de tudo, verifique o status do banco:

```bash
# Usando npm
npm run db:check

# Ou usando o script diretamente
pwsh ./src/scripts/check-db.ps1
```

### 2. Executar Migrações (Recomendado)

Use o script de migração:

```bash
# Usando npm
npm run db:migrate

# Ou usando o script diretamente
pwsh ./src/scripts/run-migrations.ps1
```

Ou execute manualmente:

```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrações
npx prisma migrate deploy
```

### 3. Deploy Completo

Para um deploy completo incluindo inicialização de roles:

```bash
# Usando npm
npm run deploy:prod

# Ou usando o script diretamente
pwsh ./src/scripts/deploy-production.ps1
```

### 4. Verificar Status das Migrações

Para verificar se as migrações foram aplicadas:

```bash
# Usando npm
npm run prisma:status

# Ou diretamente
npx prisma migrate status
```

## Estrutura do Banco de Dados

Após executar as migrações, as seguintes tabelas serão criadas:

- **User** - Usuários do sistema
- **Profile** - Perfis dos usuários
- **AuthToken** - Tokens de autenticação
- **Role** - Roles/perfis de acesso
- **Permission** - Permissões do sistema
- **Event** - Eventos
- **EventOrganizer** - Organizadores de eventos
- **EventTicket** - Ingressos de eventos
- **Ticket** - Dados dos ingressos

## Roles Padrão

O sistema inicializa automaticamente as seguintes roles:

- **ADMIN** - Administrador do sistema com acesso total
- **EVENT_MANAGER** - Gerente de eventos
- **TICKET_MANAGER** - Gerente de ingressos
- **USER** - Usuário comum

## Variáveis de Ambiente

Certifique-se de que a variável `DATABASE_URL` está configurada corretamente:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

## Troubleshooting

### Erro: "migration failed"

- Verifique se o banco de dados está acessível
- Confirme se as credenciais estão corretas
- Verifique se há conflitos de migração

### Erro: "database does not exist"

- Crie o banco de dados primeiro
- Verifique se a URL do banco está correta

### Erro: "permission denied"

- Verifique se o usuário tem permissões para criar tabelas
- Confirme se o usuário tem acesso ao banco de dados

## Comandos NPM Úteis

```bash
# Verificar status do banco
npm run db:check

# Executar migrações
npm run db:migrate

# Deploy completo
npm run deploy:prod

# Gerar cliente Prisma
npm run prisma:generate

# Verificar status das migrações
npm run prisma:status

# Inicializar banco local
npm run db:init

# Resetar banco local
npm run db:reset

# Inicializar roles
npm run roles:init
```

## Comandos Prisma Úteis

```bash
# Resetar banco de dados (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Ver histórico de migrações
npx prisma migrate status

# Gerar novo cliente Prisma
npx prisma generate

# Abrir Prisma Studio (interface visual)
npx prisma studio

# Aplicar migrações
npx prisma migrate deploy
```
