const fs = require('fs');

async function pushW2() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  const r = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/cdirQ2Av9MVLrDIK', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const w = await r.json();
  
  w.nodes.forEach(n => {
    if (n.name === 'Busca Direta') {
      n.parameters.url = '=https://bomsaldo.com/api/clientes/?nome={{ encodeURIComponent($json.nome_original) }}&ativo=1&limit=10';
    }
    if (n.name === 'Busca por Token') {
      n.parameters.url = '=https://bomsaldo.com/api/clientes/?nome={{ encodeURIComponent($(\'Normalizar Nome\').item.json.token_principal) }}&ativo=1&limit=15';
    }
  });

  const bodyStr = JSON.stringify({
    name: w.name,
    nodes: w.nodes,
    connections: w.connections,
    settings: { executionOrder: "v1" }
  });

  const putReq = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/cdirQ2Av9MVLrDIK', {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: bodyStr
  });
  
  const putRes = await putReq.json();
  console.log('OK, nodes:', putRes.nodes?.length, putRes.message || 'sucesso');
}

pushW2().catch(console.error);
