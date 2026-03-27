#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "Verificando status do banco de dados..."

if ! command -v npx >/dev/null 2>&1; then
  echo "Node.js/npx nao encontrado. Instale o Node.js primeiro."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js nao encontrado. Instale o Node.js primeiro."
  exit 1
fi

echo "Gerando cliente Prisma..."
npx prisma generate

echo "Verificando status das migracoes..."
npx prisma migrate status

echo ""
echo "Verificando conexao com o banco..."

npx tsx <<'EOF'
require('dotenv/config');
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkDatabase() {
  try {
    console.log('Verificando conexao com o banco...');

    await prisma.$connect();
    console.log('Conexao com o banco estabelecida');

    console.log('Verificando tabelas...');

    try {
      const userCount = await prisma.user.count();
      console.log('Tabela User existe (' + userCount + ' usuarios)');
    } catch (error) {
      console.log('Tabela User nao existe ou nao esta acessivel');
    }

    try {
      const roleCount = await prisma.role.count();
      console.log('Tabela Role existe (' + roleCount + ' roles)');
    } catch (error) {
      console.log('Tabela Role nao existe ou nao esta acessivel');
    }

    try {
      const eventCount = await prisma.event.count();
      console.log('Tabela Event existe (' + eventCount + ' eventos)');
    } catch (error) {
      console.log('Tabela Event nao existe ou nao esta acessivel');
    }

    try {
      const ticketCount = await prisma.ticket.count();
      console.log('Tabela Ticket existe (' + ticketCount + ' ingressos)');
    } catch (error) {
      console.log('Tabela Ticket nao existe ou nao esta acessivel');
    }

    console.log('');
    console.log('Resumo:');
    console.log('- Se todas as tabelas existem: Banco esta pronto');
    console.log('- Se alguma tabela nao existe: Execute as migracoes');
    console.log('- Se ha erro de conexao: Verifique DATABASE_URL');
  } catch (error) {
    console.error('Erro ao verificar banco:', error.message);
    console.log('');
    console.log('Possiveis solucoes:');
    console.log('1. Verifique se a variavel DATABASE_URL esta configurada');
    console.log('2. Verifique se o banco de dados esta rodando');
    console.log('3. Verifique se as credenciais estao corretas');
    console.log('4. Execute: npm run db:migrate');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
EOF
