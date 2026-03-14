#!/bin/bash

# Script para executar migrações do Prisma
echo "🗄️ Executando migrações do Prisma..."

# Verificar se o Node.js/npx está instalado
if ! command -v npx &> /dev/null; then
    echo "❌ Node.js/npx não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se o Prisma está instalado
if ! npx prisma --version &> /dev/null; then
    echo "❌ Prisma não encontrado. Instale o Prisma primeiro."
    exit 1
fi

echo "📦 Gerando cliente Prisma..."
if ! npx prisma generate; then
    echo "❌ Erro ao gerar cliente Prisma"
    exit 1
fi

echo "🗄️ Aplicando migrações do banco de dados..."
if npx prisma migrate deploy; then
    echo "✅ Migrações aplicadas com sucesso!"
    echo ""
    echo "📋 Tabelas criadas/atualizadas:"
    echo "  • User"
    echo "  • Profile"
    echo "  • AuthToken"
    echo "  • Role"
    echo "  • Permission"
    echo "  • Event"
    echo "  • EventOrganizer"
    echo "  • EventTicket"
    echo "  • Ticket"
    echo ""
    echo "🎉 Banco de dados está pronto!"
else
    echo "❌ Erro ao aplicar migrações"
    exit 1
fi
