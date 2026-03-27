#!/usr/bin/env bash

set -euo pipefail

echo "Iniciando o banco de dados PostgreSQL..."

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
elif command -v docker >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
else
  echo "Docker nao encontrado. Instale o Docker primeiro."
  exit 1
fi

"${COMPOSE_CMD[@]}" up -d

echo "Aguardando o PostgreSQL ficar disponivel..."

max_wait_time=60
wait_time=0
interval_time=3

while [[ "$wait_time" -lt "$max_wait_time" ]]; do
  if docker exec crm-db-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "PostgreSQL esta disponivel!"
    break
  fi

  echo "Aguardando PostgreSQL... (${wait_time}/${max_wait_time} segundos)"
  sleep "$interval_time"
  wait_time=$((wait_time + interval_time))
done

if [[ "$wait_time" -ge "$max_wait_time" ]]; then
  echo "Timeout: PostgreSQL nao ficou disponivel em ${max_wait_time} segundos"
  exit 1
fi

echo "Aplicando migracoes do Prisma..."
if ! npx prisma migrate dev --name init; then
  echo "Erro ao aplicar migracoes do Prisma"
  exit 1
fi

echo "Migracoes aplicadas com sucesso!"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "Inicializando roles padrao..."
bash "$SCRIPT_DIR/init-roles.sh"

echo ""
echo "Populando catalogo de ervas..."
bash "$SCRIPT_DIR/seed-herb-catalog.sh"

echo ""
echo "Banco de dados inicializado com sucesso!"
