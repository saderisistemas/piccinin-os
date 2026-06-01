$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDk5ZTk3MGQtYjUxOC00NWRjLWFlZjQtZTZlMDIxNmJhN2M3IiwiaWF0IjoxNzc3NjQ1MTAwfQ.XHD48AMIioMUropIl_JEzzvClChKo5VP9YgL6l_PaxI"
$baseUrl = "https://piccininsecurity-n8n.cloudfy.live"
$headers = @{ "X-N8N-API-KEY" = $apiKey; "Content-Type" = "application/json" }

$response = Invoke-RestMethod -Uri "$baseUrl/api/v1/workflows?limit=100" -Headers $headers -Method GET
$response.data | Select-Object id, name | Format-Table -AutoSize
