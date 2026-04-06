const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';
const W6_ID = 'hhFMx49xvO5WSxW9';

function getWorkflow(id) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      path: `/api/v1/workflows/${id}`,
      method: 'GET',
      headers: { 'X-N8N-API-KEY': API_KEY }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data));
        else reject({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function putWorkflow(id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: HOST,
      path: `/api/v1/workflows/${id}`,
      method: 'PATCH',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) resolve(JSON.parse(data));
        else reject({ status: res.statusCode, body: data.substring(0, 800) });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // 1. Get live W6 from n8n (has valid Trigger node)
  console.log('Buscando W6 atual do n8n...');
  const liveW6 = await getWorkflow(W6_ID);
  console.log('✅ W6 obtido:', liveW6.name);
  console.log('   Nodes:', liveW6.nodes.map(n => n.name).join(', '));

  // 2. Load local W6 (has our updated Montar Payload code)
  const localW6 = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json'), 'utf8'));
  const localMontarPayload = localW6.nodes.find(n => n.name === 'Montar Payload');
  console.log('\nMontar Payload local encontrado:', !!localMontarPayload);

  // 3. Merge: use live W6 structure but replace Montar Payload with our updated code
  const mergedNodes = liveW6.nodes.map(node => {
    if (node.name === 'Montar Payload' && localMontarPayload) {
      console.log('  → Substituindo Montar Payload com versão atualizada');
      return { ...node, parameters: { ...node.parameters, jsCode: localMontarPayload.parameters.jsCode } };
    }
    return node;
  });

  // 4. PUT merged workflow
  const payload = {
    name: liveW6.name,
    nodes: mergedNodes,
    connections: liveW6.connections,
    settings: { executionOrder: liveW6.settings?.executionOrder || 'v1' },
    staticData: liveW6.staticData || null
  };

  console.log('\nEnviando W6 mesclado para o n8n...');
  const result = await putWorkflow(W6_ID, payload);
  console.log('✅ W6 atualizado com sucesso! ID:', result.id, '| Nome:', result.name);

  // 5. Save merged version locally too
  fs.writeFileSync(
    path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json'),
    JSON.stringify({ ...liveW6, nodes: mergedNodes }, null, 2)
  );
  console.log('✅ Arquivo local W6 atualizado com versão mesclada');
}

main().catch(err => {
  console.error('ERRO:', err.body || err.message || err);
});
