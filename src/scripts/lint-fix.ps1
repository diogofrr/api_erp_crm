# Script de verificação e correção de lint
# Este script identifica e corrige problemas comuns de lint no projeto

Write-Host "=== Verificador de Lint ===" -ForegroundColor Cyan

# Verifica se o ESLint está instalado
Write-Host "Verificando ESLint..." -ForegroundColor Yellow
$eslintExists = npm list eslint --depth=0 2>$null
if (-not $eslintExists) {
    Write-Host "Instalando ESLint..." -ForegroundColor Yellow
    npm install eslint --save-dev
}

# Executar verificação de lint
Write-Host "Executando verificação de lint..." -ForegroundColor Yellow
npm run lint:check

# Aplicar correções automáticas
Write-Host "Aplicando correções automáticas de lint..." -ForegroundColor Green
npm run lint

# Verificar problemas de tipo
Write-Host "Verificando problemas de tipagem..." -ForegroundColor Yellow
npm run typecheck

Write-Host "Verificação de lint concluída." -ForegroundColor Cyan
