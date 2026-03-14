#!/usr/bin/env bash

set -euo pipefail

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
elif command -v docker >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
else
  echo "Docker nao encontrado. Instale o Docker primeiro."
  exit 1
fi

echo "Parando e removendo containers existentes..."
"${COMPOSE_CMD[@]}" down -v

echo "Removendo volumes do Docker..."
docker volume prune -f

echo "Iniciando containers novamente..."
"${COMPOSE_CMD[@]}" up -d

echo "Aguardando PostgreSQL ficar disponivel..."
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

echo "Resetando migracoes do Prisma..."
npx prisma migrate reset --force

echo "Banco de dados resetado e inicializado com sucesso!"
