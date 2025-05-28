# Inicia os containers Docker
Write-Host "Iniciando o banco de dados PostgreSQL..." -ForegroundColor Green
docker-compose up -d

# Espera o PostgreSQL ficar disponível
Write-Host "Aguardando o PostgreSQL ficar disponível..." -ForegroundColor Yellow

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

# Executa as migrações do Prisma
Write-Host "Aplicando migrações do Prisma..." -ForegroundColor Cyan
npx prisma migrate dev --name init

if ($LASTEXITCODE -eq 0) {
    Write-Host "Banco de dados inicializado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro ao aplicar migrações do Prisma" -ForegroundColor Red
    exit 1
}
