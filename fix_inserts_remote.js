const https = require('https');
const url = require('url');
const N8N_API_URL = 'https://piccininsecurity-n8n.cloudfy.live';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const parsedUrl = new url.URL(N8N_API_URL);

function apiReq(method, path, body) {
  return new Promise((resolve) => {
    const options = { 
      hostname: parsedUrl.hostname, port: 443, 
      path: '/api/v1' + path, method,
      headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': N8N_API_KEY }
    };
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { 
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } 
        catch { resolve({ status: res.statusCode, body: data }); } 
      });
    }); 
    if (bodyStr) req.write(bodyStr); 
    req.end();
  });
}

async function fix() {
  // 1. Get current remote W11
  const { body: w11 } = await apiReq('GET', '/workflows/kWjI5bVdGdATsuiH');
  
  console.log('Before fix:');
  w11.nodes.filter(n => n.name === 'INSERT Set OS' || n.name === 'INSERT Transicao').forEach(n => {
    console.log('  ', n.name, '→ operation:', n.parameters.operation || 'UNDEFINED');
  });
  
  // 2. Fix INSERT nodes
  w11.nodes.forEach(n => {
    if ((n.name === 'INSERT Set OS' || n.name === 'INSERT Transicao') && n.type === 'n8n-nodes-base.supabase') {
      n.parameters.operation = 'create';
    }
  });
  
  // 3. Clean settings
  const safeSettings = {};
  if (w11.settings?.executionOrder) safeSettings.executionOrder = w11.settings.executionOrder;
  
  // 4. PUT
  const putBody = {
    name: w11.name,
    nodes: w11.nodes,
    connections: w11.connections,
    settings: safeSettings,
    staticData: w11.staticData || null,
  };
  
  const r = await apiReq('PUT', '/workflows/kWjI5bVdGdATsuiH', putBody);
  console.log('\nPUT status:', r.status);
  
  if (r.status !== 200) {
    console.log('ERROR:', JSON.stringify(r.body).substring(0, 500));
    return;
  }
  
  // 5. Activate
  await apiReq('POST', '/workflows/kWjI5bVdGdATsuiH/activate');
  
  // 6. Verify
  const { body: verify } = await apiReq('GET', '/workflows/kWjI5bVdGdATsuiH');
  console.log('\nAfter fix:');
  verify.nodes.filter(n => n.name === 'INSERT Set OS' || n.name === 'INSERT Transicao').forEach(n => {
    const op = n.parameters.operation || 'UNDEFINED';
    console.log('  ', n.name, '→ operation:', op, op === 'create' ? '✅' : '❌');
  });
}

fix();
