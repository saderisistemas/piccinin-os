const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';
const WORKFLOW_ID = 'cecf2wY4MQsp4mr8';

const w1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json'), 'utf8'));

// 1) Buscar o workflow live para pegar o webhook node com webhookId intacto
https.request({ hostname: HOST, path: `/api/v1/workflows/${WORKFLOW_ID}`, method: 'GET', headers: { 'X-N8N-API-KEY': API_KEY } }, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => {
    const live = JSON.parse(d);

    // Pegar o webhook node do live (preserva webhookId e credentials)
    const liveWebhook = live.nodes.find(n => n.name === 'Webhook Chatwoot');
    if (!liveWebhook) {
      console.error('❌ Webhook Chatwoot not found in live workflow!');
      return;
    }

    // Substituir o webhook local pelo do live (preserva IDs e credenciais)
    const localNodes = w1.nodes.filter(n => n.name !== 'Webhook Chatwoot');
    const finalNodes = [liveWebhook, ...localNodes];

    console.log(`📦 Uploading ${finalNodes.length} nodes (1 webhook from live + ${localNodes.length} from local)`);

    // Debug: verificar nós-chave
    const memNode = finalNodes.find(n => n.name === 'memoriaVanda');
    const llmNode = finalNodes.find(n => n.name === 'gpt-4.1 Vanda') || finalNodes.find(n => n.name === 'gpt-4.1-mini Vanda');
    console.log('  memoriaVanda sessionKey:', memNode?.parameters?.sessionKey);
    console.log('  memoriaVanda ctx:', memNode?.parameters?.contextWindowLength);
    console.log('  LLM name:', llmNode?.name);
    console.log('  LLM model:', llmNode?.parameters?.model?.value);
    console.log('  LLM temp:', llmNode?.parameters?.options?.temperature);

    const payload = JSON.stringify({
      name: w1.name,
      nodes: finalNodes,
      connections: w1.connections,
      settings: { executionOrder: 'v1' }
    });

    const r = https.request({
      hostname: HOST,
      path: `/api/v1/workflows/${WORKFLOW_ID}`,
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, r2 => {
      let rd = ''; r2.on('data', c => rd += c);
      r2.on('end', () => {
        if (r2.statusCode === 200) {
          console.log('✅ W1 uploaded successfully!');
          // Verify
          const resp = JSON.parse(rd);
          const vMem = resp.nodes.find(n => n.name === 'memoriaVanda');
          const vLlm = resp.nodes.find(n => n.name === 'gpt-4.1 Vanda');
          console.log('\n🔍 VERIFICAÇÃO PÓS-UPLOAD:');
          console.log('  memoriaVanda sessionKey:', vMem?.parameters?.sessionKey);
          console.log('  memoriaVanda ctx:', vMem?.parameters?.contextWindowLength);
          console.log('  gpt-4.1 Vanda exists:', !!vLlm);
          console.log('  LLM temp:', vLlm?.parameters?.options?.temperature);
        } else {
          console.error(`❌ Upload failed with status ${r2.statusCode}`);
          console.error(rd.substring(0, 500));
        }
      });
    });
    r.write(payload);
    r.end();
  });
}).end();
