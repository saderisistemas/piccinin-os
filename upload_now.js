const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';

const TARGETS = [
  { id: 'cecf2wY4MQsp4mr8', file: 'W1 - Protek OS - Agente Principal.json',  label: 'W1' },
  { id: 'cdirQ2Av9MVLrDIK', file: 'W2 - Tool - Buscar Cliente.json',          label: 'W2' }
];

function apiGet(id) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: HOST, path: `/api/v1/workflows/${id}`, method: 'GET', headers: { 'X-N8N-API-KEY': API_KEY } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(d)) : reject(d));
    });
    req.on('error', reject); req.end();
  });
}

function apiPut(id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({ hostname: HOST, path: `/api/v1/workflows/${id}`, method: 'PUT',
      headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => (res.statusCode >= 200 && res.statusCode < 300) ? resolve(JSON.parse(d)) : reject(d.slice(0,400)));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function upload(wf) {
  process.stdout.write(`${wf.label}... `);
  const live = await apiGet(wf.id);
  const local = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflows', wf.file), 'utf8'));
  const liveTrigger = live.nodes.find(n => n.type === 'n8n-nodes-base.executeWorkflowTrigger' || n.type === 'n8n-nodes-base.chatTrigger');
  const localNonTrigger = local.nodes.filter(n => n.type !== 'n8n-nodes-base.executeWorkflowTrigger' && n.type !== 'n8n-nodes-base.chatTrigger');
  const mergedNodes = liveTrigger ? [liveTrigger, ...localNonTrigger] : local.nodes;
  const payload = { name: local.name, nodes: mergedNodes, connections: local.connections, settings: { executionOrder: live.settings?.executionOrder || 'v1' }, staticData: null };
  try {
    const r = await apiPut(wf.id, payload);
    console.log(`OK — ${r.name}`);
  } catch(e) {
    // try deactivate → put
    const deact = () => new Promise(res => {
      const req = https.request({ hostname: HOST, path: `/api/v1/workflows/${wf.id}/deactivate`, method: 'POST', headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Length': 0 } }, resp => { resp.resume(); resp.on('end', res); });
      req.on('error', res); req.end();
    });
    try { await deact(); const r2 = await apiPut(wf.id, payload); console.log(`OK (deact) — ${r2.name}`); }
    catch(e2) { console.log(`ERRO: ${e2}`); }
  }
}

(async () => { for (const wf of TARGETS) await upload(wf); console.log('Concluido.'); })();
