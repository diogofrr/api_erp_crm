# Script para verificar status do banco de dados
Write-Host "🔍 Verificando status do banco de dados..." -ForegroundColor Green

# Verificar se o Prisma está instalado
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js/npx não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

try {
    Write-Host "📦 Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate

    Write-Host "🗄️ Verificando status das migrações..." -ForegroundColor Yellow
    npx prisma migrate status

    Write-Host ""
    Write-Host "🔍 Verificando conexão com o banco..." -ForegroundColor Yellow

    # Criar script de verificação
    $checkScript = @'
require('dotenv/config');
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkDatabase() {
  try {
    console.log('🔍 Verificando conexão com o banco...');

    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco estabelecida');

    // Verificar se as tabelas existem
    console.log('📋 Verificando tabelas...');

    try {
      const userCount = await prisma.user.count();
      console.log('✅ Tabela User existe (' + userCount + ' usuários)');
    } catch (error) {
      console.log('❌ Tabela User não existe ou não está acessível');
    }

    try {
      const roleCount = await prisma.role.count();
      console.log('✅ Tabela Role existe (' + roleCount + ' roles)');
    } catch (error) {
      console.log('❌ Tabela Role não existe ou não está acessível');
    }

    try {
      const eventCount = await prisma.event.count();
      console.log('✅ Tabela Event existe (' + eventCount + ' eventos)');
    } catch (error) {
      console.log('❌ Tabela Event não existe ou não está acessível');
    }

    try {
      const ticketCount = await prisma.ticket.count();
      console.log('✅ Tabela Ticket existe (' + ticketCount + ' ingressos)');
    } catch (error) {
      console.log('❌ Tabela Ticket não existe ou não está acessível');
    }

    console.log('');
    console.log('📊 Resumo:');
    console.log('- Se todas as tabelas existem: Banco está pronto');
    console.log('- Se alguma tabela não existe: Execute as migrações');
    console.log('- Se há erro de conexão: Verifique DATABASE_URL');

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    console.log('');
    console.log('🔧 Possíveis soluções:');
    console.log('1. Verifique se a variável DATABASE_URL está configurada');
    console.log('2. Verifique se o banco de dados está rodando');
    console.log('3. Verifique se as credenciais estão corretas');
    console.log('4. Execute: npm run db:migrate');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
'@

    # Salvar script temporário
    $checkScript | Out-File -FilePath "temp-check-db.ts" -Encoding UTF8

    # Executar script
    npx tsx temp-check-db.ts

    # Limpar arquivo temporário
    Remove-Item "temp-check-db.ts" -ErrorAction SilentlyContinue

} catch {
    Write-Host "❌ Erro ao verificar banco: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
