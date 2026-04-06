/**
 * Copia a estrutura exata do nó Supabase "Insert Contexto" do W8
 * (que funciona no PUT com operation: create) e usa como template
 * para corrigir INSERT Set OS e INSERT Transicao do W11.
 */
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
      res.on('data', c => data += c);
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
  // 1. Get W8 to find the working INSERT template
  const { body: w8 } = await apiReq('GET', '/workflows/cYIrVtfY8qfkwj38');
  const templateNode = w8.nodes.find(n => n.name === 'Insert Contexto');
  if (!templateNode) {
    console.log('❌ Template node not found in W8!');
    return;
  }
  console.log('✅ Template found: Insert Contexto (W8)');
  console.log('   operation:', templateNode.parameters.operation);
  console.log('   typeVersion:', templateNode.typeVersion);
  console.log('   id:', templateNode.id);

  // 2. Get current W11
  const { body: w11 } = await apiReq('GET', '/workflows/kWjI5bVdGdATsuiH');

  // 3. Build INSERT Set OS using exact same structure as W8's working node
  const insertSetOsFields = [
    { fieldId: 'tecnico_id',    fieldValue: "={{ $('setarInputs').first().json.tecnico_id }}" },
    { fieldId: 'tecnico_nome',  fieldValue: "={{ $('setarInputs').first().json.tecnico_nome }}" },
    { fieldId: 'os_id',         fieldValue: "={{ $('setarInputs').first().json.os_id }}" },
    { fieldId: 'os_codigo',     fieldValue: "={{ $('setarInputs').first().json.os_codigo }}" },
    { fieldId: 'cliente_id',    fieldValue: "={{ $('setarInputs').first().json.cliente_id }}" },
    { fieldId: 'cliente_nome',  fieldValue: "={{ $('setarInputs').first().json.cliente_nome }}" },
    { fieldId: 'fase',          fieldValue: "={{ $('setarInputs').first().json.fase || 'abertura_os' }}" },
    { fieldId: 'atualizado_em', fieldValue: "={{ $now }}" },
  ];

  // Build INSERT Transicao fields
  const insertTransicaoFields = [
    { fieldId: 'tecnico_id',         fieldValue: "={{ $('setarInputs').first().json.tecnico_id }}" },
    { fieldId: 'tecnico_nome',       fieldValue: "={{ $('setarInputs').first().json.tecnico_nome }}" },
    { fieldId: 'os_id_anterior',     fieldValue: "={{ $('GET Atual para Switch').first()?.json?.os_id || '' }}" },
    { fieldId: 'os_codigo_anterior', fieldValue: "={{ $('GET Atual para Switch').first()?.json?.os_codigo || '' }}" },
    { fieldId: 'os_id_novo',         fieldValue: "={{ $('setarInputs').first().json.os_id_novo || $('setarInputs').first().json.os_id }}" },
    { fieldId: 'os_codigo_novo',     fieldValue: "={{ $('setarInputs').first().json.os_codigo_novo || $('setarInputs').first().json.os_codigo }}" },
    { fieldId: 'cliente_id',         fieldValue: "={{ $('setarInputs').first().json.cliente_id }}" },
  ];

  // 4. Replace nodes using exact W8 template structure
  w11.nodes = w11.nodes.map(n => {
    if (n.name === 'INSERT Set OS') {
      console.log('\n  Rebuilding INSERT Set OS with W8 template structure...');
      return {
        // Keep position and connections info
        position: n.position,
        id: n.id,
        name: n.name,
        // Copy EXACT structure from W8 working node
        type: templateNode.type,
        typeVersion: templateNode.typeVersion,
        // Override only parameters
        parameters: {
          operation: 'create',
          tableId: 'tecnico_contexto_ativo',
          fieldsUi: { fieldValues: insertSetOsFields }
        },
        credentials: templateNode.credentials, // Same credentials as W8
        onError: 'continueRegularOutput',
      };
    }

    if (n.name === 'INSERT Transicao') {
      console.log('  Rebuilding INSERT Transicao with W8 template structure...');
      return {
        position: n.position,
        id: n.id,
        name: n.name,
        type: templateNode.type,
        typeVersion: templateNode.typeVersion,
        parameters: {
          operation: 'create',
          tableId: 'os_transicoes',
          fieldsUi: { fieldValues: insertTransicaoFields }
        },
        credentials: templateNode.credentials,
        onError: 'continueRegularOutput',
      };
    }
    return n;
  });

  const safeSettings = {};
  if (w11.settings?.executionOrder) safeSettings.executionOrder = w11.settings.executionOrder;

  console.log('\nEnviando PUT...');
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

  // 5. Verify
  const { body: v } = await apiReq('GET', '/workflows/kWjI5bVdGdATsuiH');
  console.log('\n=== VERIFICAÇÃO FINAL ===');
  v.nodes.filter(n => n.type === 'n8n-nodes-base.supabase').forEach(n => {
    const op = n.parameters.operation || '❌ UNDEFINED';
    const onErr = n.onError || 'default';
    const ok = n.parameters.operation === 'create' || n.parameters.operation === 'update' || n.parameters.operation === 'getAll' || n.parameters.operation === 'get';
    console.log(`${ok ? '✅' : '❌'} ${n.name} | op: ${op} | onError: ${onErr}`);
  });
}

fix();
