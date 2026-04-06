const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';

const WORKFLOWS = [
  { id: 'cecf2wY4MQsp4mr8', file: 'W1 - Protek OS - Agente Principal.json',  label: 'W1 - Vanda Agent' },
  { id: 'cdirQ2Av9MVLrDIK', file: 'W2 - Tool - Buscar Cliente.json',          label: 'W2 - Buscar Cliente' }
];

function apiGet(id) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST, path: `/api/v1/workflows/${id}`, method: 'GET',
      headers: { 'X-N8N-API-KEY': API_KEY }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(d)) : reject({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.end();
  });
}

function apiPut(id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      hostname: HOST, path: `/api/v1/workflows/${id}`, method: 'PUT',
      headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => (res.statusCode >= 200 && res.statusCode < 300) ? resolve(JSON.parse(d)) : reject({ status: res.statusCode, body: d.substring(0, 600) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function uploadWorkflow(wf) {
  process.stdout.write(`Enviando ${wf.label}... `);
  
  // 1. Get live version (to preserve valid Trigger node)
  const live = await apiGet(wf.id);
  const local = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflows', wf.file), 'utf8'));
  
  // 2. Merge: replace all non-Trigger nodes from local, keep live Trigger as-is
  const liveTrigger = live.nodes.find(n => n.type === 'n8n-nodes-base.executeWorkflowTrigger' || n.type === 'n8n-nodes-base.chatTrigger');
  const localNonTrigger = local.nodes.filter(n => n.type !== 'n8n-nodes-base.executeWorkflowTrigger' && n.type !== 'n8n-nodes-base.chatTrigger');
  
  const mergedNodes = liveTrigger ? [liveTrigger, ...localNonTrigger] : local.nodes;
  
  // Use local connections but remap Trigger node name if different
  let connections = local.connections;
  if (liveTrigger && liveTrigger.name !== 'Trigger' && connections['Trigger']) {
    connections = { [liveTrigger.name]: connections['Trigger'], ...connections };
    delete connections['Trigger'];
  }
  
  const payload = {
    name: local.name,
    nodes: mergedNodes,
    connections: connections,
    settings: { executionOrder: live.settings?.executionOrder || 'v1' },
    staticData: null
  };
  
  try {
    const result = await apiPut(wf.id, payload);
    console.log(`✅ OK — ${result.name}`);
    return true;
  } catch(err) {
    console.log(`❌ PUT falhou: ${err.body || err.message}`);
    // Try deactivate → PUT → reactivate
    try {
      await new Promise((res, rej) => {
        const o = { hostname: HOST, path: `/api/v1/workflows/${wf.id}/deactivate`, method: 'POST', headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Length': 0 } };
        const r = https.request(o, resp => { resp.resume(); resp.on('end', res); });
        r.on('error', rej); r.end();
      });
      const result2 = await apiPut(wf.id, payload);
      console.log(`✅ OK (após deactivate) — ${result2.name}`);
      // Reactivate
      await new Promise((res, rej) => {
        const o = { hostname: HOST, path: `/api/v1/workflows/${wf.id}/activate`, method: 'POST', headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Length': 0 } };
        const r = https.request(o, resp => { resp.resume(); resp.on('end', res); });
        r.on('error', rej); r.end();
      });
      console.log(`   ↳ Reativado ✅`);
      return true;
    } catch(err2) {
      console.log(`   ↳ Ainda falhou: ${err2.body || err2.message}`);
      return false;
    }
  }
}

async function main() {
  for (const wf of WORKFLOWS) {
    await uploadWorkflow(wf);
  }
  console.log('\nConcluído.');
}

main().catch(e => console.error('Fatal:', e));
