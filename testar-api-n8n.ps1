$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY"
$baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows"
$headers = @{
    "X-N8N-API-KEY" = $apiKey
    "Content-Type"  = "application/json"
}

$path = "c:\Users\famil\OneDrive\Documentos\Protek OS\workflows\W2 - Tool - Buscar Cliente.json"
Write-Host "Lendo $path..."
$body = Get-Content $path -Raw -Encoding UTF8
Write-Host "Enviando para API..."

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "SUCESSO: $($response.id)"
} catch {
    $resp = $_.Exception.Response
    if ($null -ne $resp) {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "HTTP STATUS: $($resp.StatusCode)"
        Write-Host "ERRO BODY: $errBody"
    } else {
        Write-Host "ERRO DESCONHECIDO: $($_.Exception.Message)"
    }
}
