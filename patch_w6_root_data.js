const fs = require('fs');

async function patchW6OsData() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  const res = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/hhFMx49xvO5WSxW9', { headers: { 'X-N8N-API-KEY': apiKey } });
  const w6 = await res.json();
  
  const mpNode = w6.nodes.find(n => n.name === 'Montar Payload');
  if (mpNode) {
    let code = mpNode.parameters.jsCode;
    // Fix: extract just "yyyy-MM-dd" from whatever data is passed, whether it is from osAtual or triggerParams
    code = code.replace(
      "data: triggerParams.data || osAtual.data,",
      "data: (triggerParams.data || osAtual.data || '').split(' ')[0],"
    );
    // Let's also drop data_entrada and data_saida just to be completely safe and avoid other API rejections, as we are already appending to observacoes_interna!
    code = code.replace(
      "payload.data_entrada = currentDate;\n  payload.hora_entrada = hs;",
      "// data_entrada removed to avoid API rejection, time is already in observacoes_interna"
    );
    code = code.replace(
      "payload.data_saida = currentDate;\n  payload.hora_saida = hs;",
      "// data_saida removed to avoid API rejection, time is already in observacoes_interna"
    );
    mpNode.parameters.jsCode = code;
  }
  
  const putRes = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/hhFMx49xvO5WSxW9`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: w6.name, nodes: w6.nodes, connections: w6.connections, settings: { executionOrder: 'v1' } })
  });
  
  const result = await putRes.json();
  console.log('OK W6 Root Data Fixed:', result.nodes?.length, result.message || 'sucesso');
}
patchW6OsData().catch(console.error);
