# Script para inicializar roles padrão no banco de dados
Write-Host "🎭 Inicializando roles padrão..." -ForegroundColor Green

# Verificar se o Prisma está instalado
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js/npx não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Executar script de inicialização de roles
try {
    Write-Host "📦 Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate

    Write-Host "🗄️ Executando script de inicialização de roles..." -ForegroundColor Yellow

    # Criar arquivo temporário com o script de inicialização
    $initScript = @'
require('dotenv/config');
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function initRoles() {
  try {
    console.log('Inicializando roles padrao...');

    const roles = [
      {
        name: 'ADMIN',
        description: 'Administrador do sistema com acesso total'
      },
      {
        name: 'EVENT_MANAGER',
        description: 'Gerente de eventos - pode criar, editar e gerenciar eventos'
      },
      {
        name: 'TICKET_MANAGER',
        description: 'Gerente de ingressos - pode criar, editar e gerenciar ingressos'
      },
      {
        name: 'USER',
        description: 'Usuario comum - pode visualizar eventos e ingressos'
      },
      {
        name: 'HERBMASTER',
        description: 'Mestre do herbarium - pode criar, editar e remover marcadores do mapa'
      }
    ];

    for (const role of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: role.name }
      });

      if (!existingRole) {
        await prisma.role.create({
          data: role
        });
        console.log('Role ' + role.name + ' criada');
      } else {
        console.log('Role ' + role.name + ' ja existe');
      }
    }

    console.log('Roles inicializadas com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initRoles();
'@

    # Salvar script temporário
    $initScript | Out-File -FilePath "temp-init-roles.ts" -Encoding UTF8

    # Executar script
    npx tsx temp-init-roles.ts

    # Limpar arquivo temporário
    Remove-Item "temp-init-roles.ts" -ErrorAction SilentlyContinue

    Write-Host "✅ Roles inicializadas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Roles criadas:" -ForegroundColor Cyan
    Write-Host "  • ADMIN - Administrador do sistema" -ForegroundColor White
    Write-Host "  • EVENT_MANAGER - Gerente de eventos" -ForegroundColor White
    Write-Host "  • TICKET_MANAGER - Gerente de ingressos" -ForegroundColor White
    Write-Host "  • USER - Usuário comum" -ForegroundColor White
    Write-Host "  • HERBMASTER - Mestre do herbarium" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Para atribuir roles aos usuários, use o endpoint de gerenciamento de usuários." -ForegroundColor Yellow

} catch {
    Write-Host "❌ Erro ao inicializar roles: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
