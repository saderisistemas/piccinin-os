$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY"
$baseUrl = "https://piccininsecurity-n8n.cloudfy.live"
$headers = @{ "X-N8N-API-KEY" = $apiKey; "Content-Type" = "application/json" }

function Send-Workflow {
    param($id, $filePath, $label)
    Write-Host "=== Atualizando $label (ID: $id) ===" -ForegroundColor Cyan
    $raw = Get-Content -Path $filePath -Raw -Encoding UTF8
    $wf = $raw | ConvertFrom-Json
    $payload = @{
        name        = $wf.name
        nodes       = $wf.nodes
        connections = $wf.connections
        settings    = $wf.settings
        staticData  = $null
    }
    $body = $payload | ConvertTo-Json -Depth 20 -Compress
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/v1/workflows/$id" -Method PUT -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "OK: $($result.name) | nos: $($result.nodes.Count)" -ForegroundColor Green
    } catch {
        Write-Host "ERRO em $label : $_" -ForegroundColor Red
    }
}

Send-Workflow -id "cdirQ2Av9MVLrDIK" -filePath "workflows\W2 - Tool - Buscar Cliente.json" -label "W2"

Write-Host "Concluido!" -ForegroundColor Cyan
