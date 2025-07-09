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
    $initScript = @"
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initRoles() {
  try {
    console.log('🎭 Inicializando roles padrão...');

    // Criar roles padrão
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
        description: 'Usuário comum - pode visualizar eventos e ingressos'
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
        console.log('✅ Role ' + role.name + ' criada');
      } else {
        console.log('ℹ️ Role ' + role.name + ' já existe');
      }
    }

    console.log('🎉 Roles inicializadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initRoles();
"@

    # Salvar script temporário
    $initScript | Out-File -FilePath "temp-init-roles.js" -Encoding UTF8

    # Executar script
    node temp-init-roles.js

    # Limpar arquivo temporário
    Remove-Item "temp-init-roles.js" -ErrorAction SilentlyContinue

    Write-Host "✅ Roles inicializadas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Roles criadas:" -ForegroundColor Cyan
    Write-Host "  • ADMIN - Administrador do sistema" -ForegroundColor White
    Write-Host "  • EVENT_MANAGER - Gerente de eventos" -ForegroundColor White
    Write-Host "  • TICKET_MANAGER - Gerente de ingressos" -ForegroundColor White
    Write-Host "  • USER - Usuário comum" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Para atribuir roles aos usuários, use o endpoint de gerenciamento de usuários." -ForegroundColor Yellow

} catch {
    Write-Host "❌ Erro ao inicializar roles: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
