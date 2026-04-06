const fs = require('fs');

async function fixW6() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  
  const res = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/hhFMx49xvO5WSxW9', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const w6 = await res.json();
  
  // 1. Add IF node
  const ifNode = {
    parameters: {
      conditions: {
        string: [
          {
            value1: "={{ $json.error ? 'sim' : 'nao' }}",
            operation: 'notEqual',
            value2: "sim"
          }
        ]
      }
    },
    id: 'w6-if-error',
    name: 'Verificar Erro',
    type: 'n8n-nodes-base.if',
    typeVersion: 1,
    position: [560, 400]
  };
  
  const existingIf = w6.nodes.find(n => n.name === 'Verificar Erro');
  if (!existingIf) {
    w6.nodes.push(ifNode);
  }
  
  // Reposition PUT Atualizar OS to the right
  const putNode = w6.nodes.find(n => n.name === 'PUT Atualizar OS');
  if (putNode) putNode.position = [800, 380];
  
  // 2. Fix Connections
  // Remove Montar Payload -> PUT Atualizar OS
  w6.connections['Montar Payload'] = {
    main: [
      [
        { node: 'Verificar Erro', type: 'main', index: 0 }
      ]
    ]
  };
  
  // Add Verificar Erro true -> PUT Atualizar OS
  // Add Verificar Erro false -> Formatar Resposta
  w6.connections['Verificar Erro'] = {
    main: [
      [
        { node: 'PUT Atualizar OS', type: 'main', index: 0 }
      ],
      [
        { node: 'Formatar Resposta', type: 'main', index: 0 }
      ]
    ]
  };
  
  // PUT Atualizar OS still connects to Formatar Resposta / logs
  
  // 3. Make sure Formatar Resposta handles it.
  const formatNode = w6.nodes.find(n => n.name === 'Formatar Resposta');
  if (formatNode) {
    formatNode.parameters.jsCode = `
const json = $input.first().json;
if (json.error) {
  return [{ json: { resultado: json.error, success: false } }];
}
const putResp = $('PUT Atualizar OS').first()?.json || json;
if (putResp.status === 'error' || putResp.error) {
  return [{ json: { resultado: "Erro no Bom Saldo: " + JSON.stringify(putResp), success: false } }];
}
return [{ json: { resultado: "OS atualizada e laudo inserido com sucesso!", success: true } }];
`;
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
  console.log('OK W6 IF nodes:', result.nodes?.length, result.message || 'sucesso');
}

fixW6().catch(console.error);
