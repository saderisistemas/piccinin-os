const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';

function putWorkflow(id, filePath) {
  return new Promise((resolve, reject) => {
    const rawBody = fs.readFileSync(filePath, 'utf8');
    const workflow = JSON.parse(rawBody);

    // n8n PUT /api/v1/workflows/:id expects the workflow object
    // Keep only the fields n8n accepts for update
    const payload = JSON.stringify({
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || null
    });

    const options = {
      hostname: HOST,
      path: `/api/v1/workflows/${id}`,
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const json = JSON.parse(data);
          resolve({ status: 'OK', id: json.id, name: json.name });
        } else {
          reject({ status: res.statusCode, body: data.substring(0, 500) });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const workflows = [
    { id: 'cecf2wY4MQsp4mr8', file: 'W1 - Protek OS - Agente Principal.json', label: 'W1 - Vanda Agent' },
    { id: 'hhFMx49xvO5WSxW9', file: 'W6 - Tool - Atualizar OS.json', label: 'W6 - Atualizar OS' }
  ];

  for (const wf of workflows) {
    const filePath = path.join(__dirname, 'workflows', wf.file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${wf.file}`);
      continue;
    }
    process.stdout.write(`Enviando ${wf.label}... `);
    try {
      const result = await putWorkflow(wf.id, filePath);
      console.log(`✅ OK — ID: ${result.id} | Nome: ${result.name}`);
    } catch (err) {
      console.log(`❌ ERRO`);
      console.log(`   HTTP ${err.status}`);
      console.log(`   ${err.body || err.message || err}`);
    }
  }
  console.log('\nConcluído.');
}

main();
