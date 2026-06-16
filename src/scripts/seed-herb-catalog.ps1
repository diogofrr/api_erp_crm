# Popula o catalogo de ervas a partir de prisma/herbs-data.json
Write-Host "Populando catalogo de ervas..." -ForegroundColor Green

if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js/npx nao encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate

    Write-Host "Executando seed do catalogo..." -ForegroundColor Yellow
    npx tsx ./prisma/seed-herbarium.ts

    Write-Host "Seed concluido!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao popular catalogo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
