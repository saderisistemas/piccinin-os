const fs = require('fs');

async function push() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  const r = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/cecf2wY4MQsp4mr8', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const w = await r.json();
  
  const w1Local = JSON.parse(fs.readFileSync('./workflows/W1 - Protek OS - Agente Principal.json', 'utf8'));

  const bodyStr = JSON.stringify({
    name: w.name,
    nodes: w1Local.nodes,
    connections: w1Local.connections,
    settings: { executionOrder: "v1" }
  });

  const putReq = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/cecf2wY4MQsp4mr8', {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: bodyStr
  });
  
  const putRes = await putReq.json();
  console.log('OK, W1 nodes:', putRes.nodes?.length, putRes.message || 'sucesso');
}

push().catch(console.error);
