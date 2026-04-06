$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY"
$baseUrl = "https://piccininsecurity-n8n.cloudfy.live"
$headers = @{ "X-N8N-API-KEY" = $apiKey; "Content-Type" = "application/json" }

$response = Invoke-RestMethod -Uri "$baseUrl/api/v1/workflows?limit=100" -Headers $headers -Method GET
$response.data | Select-Object id, name | Format-Table -AutoSize
