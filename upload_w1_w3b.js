const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';

const TARGETS = [
  { id: 'cecf2wY4MQsp4mr8', file: 'W1 - Protek OS - Agente Principal.json',  label: 'W1 - Vanda Agent' },
  { id: 'Pbj7zwqjbeHtvodF', file: 'W3b - Tool - Criar OS.json',               label: 'W3b - Criar OS (com validacao)' }
];

function apiGet(id) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: HOST, path: `/api/v1/workflows/${id}`, method: 'GET', headers: { 'X-N8N-API-KEY': API_KEY } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(d)) : reject({ status: res.statusCode, body: d.slice(0,300) }));
    });
    req.on('error', reject); req.end();
  });
}

function apiPut(id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: HOST, path: `/api/v1/workflows/${id}`, method: 'PUT',
      headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => (res.statusCode >= 200 && res.statusCode < 300) ? resolve(JSON.parse(d)) : reject({ status: res.statusCode, body: d.slice(0,600) }));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function apiPost(urlPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: HOST, path: urlPath, method: 'POST', headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Length': 0 } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
    req.on('error', reject); req.end();
  });
}

async function upload(wf) {
  process.stdout.write(`Enviando ${wf.label}... `);

  const live = await apiGet(wf.id);
  const local = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflows', wf.file), 'utf8'));

  // Preserve live trigger node
  const liveTrigger = live.nodes.find(n =>
    n.type === 'n8n-nodes-base.executeWorkflowTrigger' ||
    n.type === 'n8n-nodes-base.chatTrigger'
  );
  const localNonTrigger = local.nodes.filter(n =>
    n.type !== 'n8n-nodes-base.executeWorkflowTrigger' &&
    n.type !== 'n8n-nodes-base.chatTrigger'
  );

  const mergedNodes = liveTrigger ? [liveTrigger, ...localNonTrigger] : local.nodes;

  const payload = {
    name: local.name,
    nodes: mergedNodes,
    connections: local.connections,
    settings: { executionOrder: live.settings?.executionOrder || 'v1' },
    staticData: null
  };

  try {
    const result = await apiPut(wf.id, payload);
    console.log(`OK — ${result.name}`);
    return;
  } catch (err) {
    console.log(`ERRO PUT: ${err.body}`);
  }

  // Fallback: deactivate → put → activate
  console.log(`  Tentando deactivate → PUT → activate...`);
  try {
    await apiPost(`/api/v1/workflows/${wf.id}/deactivate`);
    const result2 = await apiPut(wf.id, payload);
    console.log(`  OK apos deactivate — ${result2.name}`);
    try { await apiPost(`/api/v1/workflows/${wf.id}/activate`); console.log('  Reativado OK'); }
    catch(e) { console.log('  Reativação manual necessária'); }
  } catch (err2) {
    console.log(`  FALHOU: ${err2.body || err2.message}`);
  }
}

async function main() {
  for (const wf of TARGETS) await upload(wf);
  console.log('\nConcluido.');
}
main().catch(e => console.error('Fatal:', e));
