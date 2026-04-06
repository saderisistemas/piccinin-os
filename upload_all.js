const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';

const TARGETS = [
  { id: 'cecf2wY4MQsp4mr8', file: 'W1 - Protek OS - Agente Principal.json', label: 'W1' },
  { id: 'Pbj7zwqjbeHtvodF', file: 'W3b - Tool - Criar OS.json', label: 'W3b' },
  { id: 'iJRYEqsLzCVACG0j', file: 'W4 - Tool - Buscar Produtos.json', label: 'W4' },
  { id: 'Dhp6XByNpzhyVqza', file: 'W5 - Tool - Buscar Servicos.json', label: 'W5' },
  { id: 'hhFMx49xvO5WSxW9', file: 'W6 - Tool - Atualizar OS.json', label: 'W6' }
];

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = { hostname: HOST, path: urlPath, method, headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' } };
    if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const r = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => (res.statusCode >= 200 && res.statusCode < 300) ? resolve(JSON.parse(d)) : reject(d.slice(0,400))); });
    r.on('error', reject); if (bodyStr) r.write(bodyStr); r.end();
  });
}

async function upload(wf) {
  process.stdout.write(wf.label + '... ');
  try {
    const live = await req('GET', '/api/v1/workflows/' + wf.id);
    const local = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflows', wf.file), 'utf8'));
    const liveTrigger = live.nodes.find(n => n.type.includes('Trigger') || n.type.includes('chatTrigger'));
    const localOther = local.nodes.filter(n => !n.type.includes('Trigger') && !n.type.includes('chatTrigger'));
    const nodes = liveTrigger ? [liveTrigger, ...localOther] : local.nodes;
    const payload = { name: local.name, nodes, connections: local.connections, settings: { executionOrder: 'v1' }, staticData: null };
    await req('PUT', '/api/v1/workflows/' + wf.id, payload);
    console.log('OK — ' + local.name);
  } catch(e) {
    console.log('ERRO no PUT ' + wf.label + ': ' + e);
  }
}

(async () => {
  for (const w of TARGETS) await upload(w);
  console.log('Pronto.');
})();
