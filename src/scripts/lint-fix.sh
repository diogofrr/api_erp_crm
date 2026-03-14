#!/usr/bin/env bash

set -euo pipefail

echo "=== Verificador de Lint ==="

echo "Verificando ESLint..."
if ! npm list eslint --depth=0 >/dev/null 2>&1; then
  echo "Instalando ESLint..."
  npm install eslint --save-dev
fi

echo "Executando verificacao de lint..."
npm run lint:check

echo "Aplicando correcoes automaticas de lint..."
npm run lint

echo "Verificando problemas de tipagem..."
npm run typecheck

echo "Verificacao de lint concluida."
