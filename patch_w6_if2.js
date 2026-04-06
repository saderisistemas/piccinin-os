const fs = require('fs');

async function fixW6If() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  
  const res = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/hhFMx49xvO5WSxW9', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const w6 = await res.json();
  
  // Find IF node
  const ifNode = w6.nodes.find(n => n.name === 'Verificar Erro');
  if (ifNode) {
    ifNode.parameters = {
      conditions: {
        string: [
          {
            value1: "={{ $json.error }}",
            operation: 'isEmpty'
          }
        ]
      }
    };
  }
  
  // Upload W6
  const putRes = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/hhFMx49xvO5WSxW9`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: w6.name,
      nodes: w6.nodes,
      connections: w6.connections,
      settings: { executionOrder: 'v1' }
    })
  });
  
  const result = await putRes.json();
  console.log('OK W6 IF Fixed:', result.nodes?.length, result.message || 'sucesso');
}

fixW6If().catch(console.error);
