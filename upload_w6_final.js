const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';
const W6_ID = 'hhFMx49xvO5WSxW9';

function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: HOST,
      path: urlPath,
      method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject({ status: res.statusCode, body: data.substring(0, 800) });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  // 1. Get live W6 — preserves the valid Trigger node exactly
  console.log('Buscando W6 atual do n8n...');
  const live = await apiRequest('GET', `/api/v1/workflows/${W6_ID}`);
  console.log('✅ Live W6:', live.name);
  console.log('   Nodes:', live.nodes.map(n => `${n.name}(${n.type})`).join(', '));

  // 2. Load local updated Montar Payload code
  const local = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json'), 'utf8'));
  const localMontar = local.nodes.find(n => n.name === 'Montar Payload');
  if (!localMontar) { console.error('Local Montar Payload not found'); return; }

  // 3. Replace ONLY the jsCode of Montar Payload in the live nodes
  //    Keep everything else (Trigger, connections, etc.) exactly as in live
  const mergedNodes = live.nodes.map(node => {
    if (node.name === 'Montar Payload') {
      return { ...node, parameters: { ...node.parameters, jsCode: localMontar.parameters.jsCode } };
    }
    return node;
  });

  // 4. Build minimal valid PUT payload using live settings exactly
  const payload = {
    name: live.name,
    nodes: mergedNodes,
    connections: live.connections,
    settings: { executionOrder: live.settings?.executionOrder || 'v1' },
    staticData: live.staticData || null
  };

  // Debug: print Trigger node from live (to understand why n8n rejects it)
  const triggerNode = live.nodes.find(n => n.name === 'Trigger');
  console.log('\nTrigger node type:', triggerNode?.type);
  console.log('Trigger node params keys:', Object.keys(triggerNode?.parameters || {}));

  console.log('\nEnviando payload via PUT...');
  try {
    const result = await apiRequest('PUT', `/api/v1/workflows/${W6_ID}`, payload);
    console.log('✅ W6 atualizado! ID:', result.id, '| Nome:', result.name);
  } catch (err) {
    console.log('❌ PUT falhou:', err.body || err.message);
    
    // Fallback: try deactivating first, then put, then reactivate
    console.log('\nTentando via deactivate → PUT → reactivate...');
    try {
      await apiRequest('POST', `/api/v1/workflows/${W6_ID}/deactivate`);
      console.log('  Workflow desativado');
    } catch(e) { console.log('  (deactivate falhou, continuando)'); }
    
    try {
      const result2 = await apiRequest('PUT', `/api/v1/workflows/${W6_ID}`, payload);
      console.log('✅ W6 atualizado após deactivate! ID:', result2.id);
      // Try to reactivate
      try {
        await apiRequest('POST', `/api/v1/workflows/${W6_ID}/activate`);
        console.log('✅ Workflow reativado');
      } catch(e) { console.log('⚠️  Reativação manual necessária no n8n UI'); }
    } catch (err2) {
      console.log('❌ Ainda falhou:', err2.body || err2.message);
    }
  }
}

main().catch(e => console.error('Fatal:', e));
