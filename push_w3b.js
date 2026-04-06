const fs = require('fs');

async function push() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  
  // First find the actual W3b workflow ID in n8n
  const listRes = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows?limit=50', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const list = await listRes.json();
  const w3b = list.data.find(w => w.name.includes('Criar OS'));
  if (!w3b) { console.log('W3b not found! Workflows:', list.data.map(w => w.name).join(', ')); return; }
  console.log('Found W3b:', w3b.id, w3b.name);

  const w3bLocal = JSON.parse(fs.readFileSync('./workflows/W3b - Tool - Criar OS.json', 'utf8'));

  const putRes = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/${w3b.id}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: w3b.name,
      nodes: w3bLocal.nodes,
      connections: w3bLocal.connections,
      settings: { executionOrder: 'v1' }
    })
  });
  
  const result = await putRes.json();
  console.log('OK, nodes:', result.nodes?.length, result.message || 'sucesso');
}

push().catch(console.error);
