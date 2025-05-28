# Script para resetar completamente o banco de dados
Write-Host "Parando e removendo containers existentes..." -ForegroundColor Yellow
docker-compose down -v

Write-Host "Removendo volumes do Docker..." -ForegroundColor Yellow
docker volume prune -f

Write-Host "Iniciando containers novamente..." -ForegroundColor Green
docker-compose up -d

# Função para verificar se o PostgreSQL está pronto
function Test-PostgreSQLConnection {
    try {
        $result = docker exec crm-db-postgres pg_isready -U postgres
        return $result -like "*accepting connections*"
    }
    catch {
        return $false
    }
}

# Aguarda até o PostgreSQL estar pronto (máximo 60 segundos)
Write-Host "Aguardando PostgreSQL ficar disponível..." -ForegroundColor Yellow
$maxWaitTime = 60
$waitTime = 0
$intervalTime = 3

while (-not (Test-PostgreSQLConnection) -and $waitTime -lt $maxWaitTime) {
    Write-Host "Aguardando PostgreSQL... ($waitTime/$maxWaitTime segundos)" -ForegroundColor Yellow
    Start-Sleep -Seconds $intervalTime
    $waitTime += $intervalTime
}

if ($waitTime -ge $maxWaitTime) {
    Write-Host "Timeout: PostgreSQL não ficou disponível em $maxWaitTime segundos" -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL está disponível!" -ForegroundColor Green

# Reset das migrações do Prisma
Write-Host "Resetando migrações do Prisma..." -ForegroundColor Cyan
npx prisma migrate reset --force

Write-Host "Banco de dados resetado e inicializado com sucesso!" -ForegroundColor Green
