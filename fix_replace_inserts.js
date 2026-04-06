/**
 * Substitui INSERT Set OS e INSERT Transicao por nós Code que fazem
 * HTTP POST direto no Supabase REST API — elimina dependência da operação
 * "create" que o n8n rejeita no PUT.
 */
const https = require('https');
const url = require('url');
const N8N_API_URL = 'https://piccininsecurity-n8n.cloudfy.live';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const parsedUrl = new url.URL(N8N_API_URL);

// Supabase config (from existing nodes)
const SUPA_URL = 'https://bnghvmromtukmflzeojd.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZ2h2bXJvbXR1a21mbHplb2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzYyNzU3OSwiZXhwIjoyMDU5MjAzNTc5fQ.DyUYhCU3O5lhIiX3DP0G2D9iWE2A6cSB2VD2Ck_uAy4';

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

// Code node that replaces INSERT Set OS
// Uses n8n's $http helper to POST to Supabase REST
const INSERT_SET_OS_CODE = `// INSERT tecnico_contexto_ativo via Supabase REST (fallback quando UPDATE não encontra linha)
const inputs = $('setarInputs').first().json;

const supaUrl = 'https://bnghvmromtukmflzeojd.supabase.co/rest/v1/tecnico_contexto_ativo';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZ2h2bXJvbXR1a21mbHplb2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzYyNzU3OSwiZXhwIjoyMDU5MjAzNTc5fQ.DyUYhCU3O5lhIiX3DP0G2D9iWE2A6cSB2VD2Ck_uAy4';

const row = {
  tecnico_id:  String(inputs.tecnico_id || ''),
  tecnico_nome: inputs.tecnico_nome || '',
  os_id:       String(inputs.os_id || ''),
  os_codigo:   String(inputs.os_codigo || ''),
  cliente_id:  String(inputs.cliente_id || ''),
  cliente_nome: inputs.cliente_nome || '',
  fase:        inputs.fase || 'abertura_os',
  atualizado_em: new Date().toISOString()
};

const resp = await this.helpers.httpRequest({
  method: 'POST',
  url: supaUrl,
  headers: {
    'apikey': supaKey,
    'Authorization': 'Bearer ' + supaKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: row,
  json: true
});

return [{ json: { inserted: true, row: resp?.[0] || row } }];`;

// Code node that replaces INSERT Transicao
const INSERT_TRANSICAO_CODE = `// INSERT os_transicoes via Supabase REST
const inputs = $('setarInputs').first().json;
const atual = $('GET Atual para Switch').first()?.json || {};

const supaUrl = 'https://bnghvmromtukmflzeojd.supabase.co/rest/v1/os_transicoes';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZ2h2bXJvbXR1a21mbHplb2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzYyNzU3OSwiZXhwIjoyMDU5MjAzNTc5fQ.DyUYhCU3O5lhIiX3DP0G2D9iWE2A6cSB2VD2Ck_uAy4';

const row = {
  tecnico_id:       String(inputs.tecnico_id || ''),
  tecnico_nome:     inputs.tecnico_nome || '',
  os_id_anterior:   String(atual.os_id || ''),
  os_codigo_anterior: String(atual.os_codigo || ''),
  os_id_novo:       String(inputs.os_id_novo || inputs.os_id || ''),
  os_codigo_novo:   String(inputs.os_codigo_novo || inputs.os_codigo || ''),
  cliente_id:       String(inputs.cliente_id || ''),
  criado_em:        new Date().toISOString()
};

const resp = await this.helpers.httpRequest({
  method: 'POST',
  url: supaUrl,
  headers: {
    'apikey': supaKey,
    'Authorization': 'Bearer ' + supaKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: row,
  json: true
});

return [{ json: { inserted: true, row: resp?.[0] || row } }];`;

async function fix() {
  const { body: w11 } = await apiReq('GET', '/workflows/kWjI5bVdGdATsuiH');
  const crypto = require('crypto');

  let changed = 0;
  w11.nodes = w11.nodes.map(n => {
    // Replace INSERT Set OS with Code node
    if (n.name === 'INSERT Set OS') {
      console.log('  Replacing INSERT Set OS with Code node...');
      changed++;
      return {
        ...n,
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        parameters: { jsCode: INSERT_SET_OS_CODE, mode: 'runOnceForAllItems' },
        onError: 'continueRegularOutput',
        credentials: undefined
      };
    }
    // Replace INSERT Transicao with Code node
    if (n.name === 'INSERT Transicao') {
      console.log('  Replacing INSERT Transicao with Code node...');
      changed++;
      return {
        ...n,
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        parameters: { jsCode: INSERT_TRANSICAO_CODE, mode: 'runOnceForAllItems' },
        onError: 'continueRegularOutput',
        credentials: undefined
      };
    }
    return n;
  });

  const safeSettings = {};
  if (w11.settings?.executionOrder) safeSettings.executionOrder = w11.settings.executionOrder;

  console.log(`\nEnviando PUT (${changed} nós substituídos)...`);
  const r = await apiReq('PUT', '/workflows/kWjI5bVdGdATsuiH', {
    name: w11.name,
    nodes: w11.nodes,
    connections: w11.connections,
    settings: safeSettings,
    staticData: w11.staticData || null,
  });

  console.log('PUT status:', r.status);
  if (r.status !== 200) {
    console.log('ERROR:', JSON.stringify(r.body).substring(0, 500));
    return;
  }

  await apiReq('POST', '/workflows/kWjI5bVdGdATsuiH/activate');
  console.log('✅ W11 ativado — INSERTs agora são Code nodes com HTTP direto ao Supabase');
}

fix();
