const fs = require('fs');

async function fixAndPush() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  
  const res = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/Pbj7zwqjbeHtvodF', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const w3b = await res.json();
  
  w3b.nodes.forEach(n => {
    if (n.name === 'POST Criar OS') {
      n.parameters.jsonBody = "={{ JSON.stringify({ cliente_id: parseInt($json.cliente_id), situacao_id: parseInt($json.situacao_id) || 6237497, data: $now.format('yyyy-MM-dd'), observacoes: $json.observacoes || 'OS aberta via Assistente Vanda - Piccinin Security', vendedor_id: 906858 }) }}";
      if (!n.parameters.options) n.parameters.options = {};
      n.parameters.options.ignoreResponseCode = true;
    }
  });

  const putRes = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/Pbj7zwqjbeHtvodF`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: w3b.name,
      nodes: w3b.nodes,
      connections: w3b.connections,
      settings: { executionOrder: 'v1' }
    })
  });
  
  const result = await putRes.json();
  console.log('OK, nodes:', result.nodes?.length, result.message || 'sucesso');
}

fixAndPush().catch(console.error);
