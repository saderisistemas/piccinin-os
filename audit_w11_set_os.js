const https = require('https');
const url = require('url');
const N8N_API_URL = 'https://piccininsecurity-n8n.cloudfy.live';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const parsedUrl = new url.URL(N8N_API_URL);

function apiReq(path) {
  return new Promise((resolve) => {
    const options = { hostname: parsedUrl.hostname, port: 443, path: '/api/v1' + path, method: 'GET', headers: { 'X-N8N-API-KEY': N8N_API_KEY } };
    https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    }).end();
  });
}

async function audit() {
  const w11 = await apiReq('/workflows/kWjI5bVdGdATsuiH');
  
  // Check EVERY node in the set_os branch
  const setOsNodes = ['UPDATE Set OS', 'Checar e Inserir Set OS', 'Precisa INSERT?', 'INSERT Set OS', 'Merge Set OS', 'Resp set_os'];
  
  setOsNodes.forEach(name => {
    const n = w11.nodes.find(n => n.name === name);
    if (!n) {
      console.log('❌ NODE MISSING:', name);
      return;
    }
    console.log('\n═══', name, '═══');
    console.log('  type:', n.type);
    console.log('  typeVersion:', n.typeVersion);
    
    if (n.type === 'n8n-nodes-base.supabase') {
      console.log('  operation:', n.parameters.operation || '❌ UNDEFINED (defaults to getAll!)');
      console.log('  tableId:', n.parameters.tableId);
      console.log('  credentials:', JSON.stringify(n.credentials));
      if (n.parameters.fieldsUi) {
        console.log('  fields:', n.parameters.fieldsUi.fieldValues.map(f => f.fieldId).join(', '));
      }
      if (n.parameters.filters) {
        console.log('  filters:', JSON.stringify(n.parameters.filters));
      }
      console.log('  onError:', n.onError || 'default');
    }
    
    if (n.type === 'n8n-nodes-base.code') {
      console.log('  code:');
      console.log(n.parameters.jsCode);
    }
    
    if (n.type === 'n8n-nodes-base.if') {
      console.log('  conditions:', JSON.stringify(n.parameters.conditions, null, 2));
    }
    
    if (n.type === 'n8n-nodes-base.merge') {
      console.log('  mode:', n.parameters.mode);
      console.log('  output:', n.parameters.output);
    }
  });
}
audit();
