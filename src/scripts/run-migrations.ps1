# Script para executar migrações do Prisma
Write-Host "🗄️ Executando migrações do Prisma..." -ForegroundColor Green

# Verificar se o Prisma está instalado
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js/npx não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

try {
    Write-Host "📦 Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate

    Write-Host "🗄️ Aplicando migrações do banco de dados..." -ForegroundColor Yellow
    npx prisma migrate deploy

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrações aplicadas com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Tabelas criadas/atualizadas:" -ForegroundColor Cyan
        Write-Host "  • User" -ForegroundColor White
        Write-Host "  • Profile" -ForegroundColor White
        Write-Host "  • AuthToken" -ForegroundColor White
        Write-Host "  • Role" -ForegroundColor White
        Write-Host "  • Permission" -ForegroundColor White
        Write-Host "  • Event" -ForegroundColor White
        Write-Host "  • EventOrganizer" -ForegroundColor White
        Write-Host "  • EventTicket" -ForegroundColor White
        Write-Host "  • Ticket" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Banco de dados está pronto!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao aplicar migrações" -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Erro ao executar migrações: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
