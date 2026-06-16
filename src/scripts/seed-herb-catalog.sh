#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "Populando catalogo de ervas..."

if ! command -v npx >/dev/null 2>&1; then
  echo "Node.js/npx nao encontrado. Instale o Node.js primeiro."
  exit 1
fi

echo "Gerando cliente Prisma..."
npx prisma generate

echo "Executando seed do catalogo de ervas..."
npx tsx ./prisma/seed-herbarium.ts

echo "Seed concluido!"
