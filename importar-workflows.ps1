$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY"
$baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows"
$headers = @{
    "X-N8N-API-KEY" = $apiKey
    "Content-Type"  = "application/json"
}

$workflows = @(
    "W2 - Tool - Buscar Cliente.json",
    "W3 - Tool - Buscar OS.json",
    "W3b - Tool - Criar OS.json",
    "W4 - Tool - Buscar Produtos.json",
    "W5 - Tool - Buscar Servicos.json",
    "W6 - Tool - Atualizar OS.json",
    "W7 - Tool - Salvar Evidencias Drive.json",
    "W1 - Protek OS - Agente Principal.json"
)

$results = @()

foreach ($wf in $workflows) {
    $path = "c:\Users\famil\OneDrive\Documentos\Protek OS\workflows\$wf"
    try {
        $body = Get-Content $path -Raw -Encoding UTF8
        $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body -ContentType "application/json"
        $results += [PSCustomObject]@{
            Nome = $wf
            ID   = $response.id
            Status = "OK"
        }
        Write-Host "✅ $wf → ID: $($response.id)"
    } catch {
        $err = $_.Exception.Message
        $results += [PSCustomObject]@{
            Nome = $wf
            ID   = "ERRO"
            Status = $err
        }
        Write-Host "❌ $wf → ERRO: $err"
    }
}

Write-Host ""
Write-Host "=== RESUMO DOS IDs IMPORTADOS ==="
$results | Format-Table -AutoSize
