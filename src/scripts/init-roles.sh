#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "Inicializando roles padrao..."

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

echo "Executando script de inicializacao de roles..."

node <<'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

initRoles();
EOF

echo "Roles inicializadas com sucesso!"
echo ""
echo "Roles criadas:"
echo "  - ADMIN"
echo "  - EVENT_MANAGER"
echo "  - TICKET_MANAGER"
echo "  - USER"
echo "  - HERBMASTER"
echo ""
echo "Para atribuir roles aos usuarios, use o endpoint de gerenciamento de usuarios."
