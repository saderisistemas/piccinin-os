const https = require('https');
const url = require('url');
const N8N_API_URL = 'https://piccininsecurity-n8n.cloudfy.live';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const parsedUrl = new url.URL(N8N_API_URL);

async function req(method, path, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: parsedUrl.hostname, port: 443,
      path: '/api/v1' + path, method,
      headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': N8N_API_KEY }
    };
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const r = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

(async () => {
  const w8Res = await req('GET', '/workflows/cYIrVtfY8qfkwj38');
  let w8 = JSON.parse(w8Res.body);

  // ─── Fix 1: Mudar "Definir Estrategia Busca" para SEMPRE priorizar tecnico_id + os_id ───
  w8.nodes.forEach(n => {
    if (n.name === 'Definir Estrategia Busca') {
      n.parameters.jsCode = `// Estratégia de busca:
// SEMPRE priorizar tecnico_id + os_id (chave composta no banco)
// Fallback: conversa_id (legado)
const p = $('Validar Params').first().json;

const temChaveNova = !!(p.tecnico_id && p.os_id);

return [{ json: { ...p, _busca_por: temChaveNova ? 'tecnico_os' : 'conversa_id' } }];`;
    }

    // ─── Fix 2: "GET por Tecnico+OS" - busca por tecnico_id + os_id (chave composta) ───
    if (n.name === 'GET por Tecnico+OS') {
      n.parameters = {
        operation: 'getAll',
        tableId: 'os_buffer',
        limit: 1,
        filters: {
          conditions: [
            { keyName: 'tecnico_id', condition: 'eq', keyValue: "={{ $json.tecnico_id }}" },
            { keyName: 'os_id', condition: 'eq', keyValue: "={{ $json.os_id }}" }
          ]
        }
      };
      n.alwaysOutputData = true;
      n.credentials = { supabaseApi: { id: '3TZFb8LBSmrd137a', name: 'Supabase Vanda OS' } };
      n.onError = 'continueRegularOutput';
    }

    // ─── Fix 3: "GET por Conversa ID" - garantir credentials ───
    if (n.name === 'GET por Conversa ID') {
      n.credentials = { supabaseApi: { id: '3TZFb8LBSmrd137a', name: 'Supabase Vanda OS' } };
      n.onError = 'continueRegularOutput';
    }

    // ─── Fix 4: "Update Contexto" - filtrar por tecnico_id + os_id ao invés de conversa_id ───
    if (n.name === 'Update Contexto') {
      n.parameters.filters = {
        conditions: [
          { keyName: 'tecnico_id', condition: 'eq', keyValue: "={{ $json.tecnico_id }}" },
          { keyName: 'os_id', condition: 'eq', keyValue: "={{ $json.os_id }}" }
        ]
      };
      n.credentials = { supabaseApi: { id: '3TZFb8LBSmrd137a', name: 'Supabase Vanda OS' } };
      n.onError = 'continueRegularOutput';
    }

    // ─── Fix 5: "Insert Contexto" - garantir credentials ───
    if (n.name === 'Insert Contexto') {
      n.credentials = { supabaseApi: { id: '3TZFb8LBSmrd137a', name: 'Supabase Vanda OS' } };
      n.onError = 'continueRegularOutput';
    }
  });

  const putBody = {
    name: w8.name, nodes: w8.nodes, connections: w8.connections,
    settings: w8.settings?.executionOrder ? { executionOrder: w8.settings.executionOrder } : {},
    staticData: w8.staticData || null
  };

  const r = await req('PUT', '/workflows/cYIrVtfY8qfkwj38', putBody);
  console.log('PUT fix W8 multi-OS:', r.status);
  if (r.status !== 200) {
    console.log('Error:', r.body.substring(0, 500));
  } else {
    await req('POST', '/workflows/cYIrVtfY8qfkwj38/activate');
    console.log('✅ W8 ativado!');
  }

  // Verify
  const { body: v } = await req('GET', '/workflows/cYIrVtfY8qfkwj38');
  const vw = JSON.parse(v);
  console.log('\n=== VERIFICAÇÃO W8 ===');
  vw.nodes.filter(n => n.type === 'n8n-nodes-base.supabase').forEach(n => {
    const op = n.parameters.operation || 'create';
    const cred = n.credentials?.supabaseApi?.id || '❌ SEM CREDENCIAL';
    console.log(`  ${n.name} | op: ${op} | cred: ${cred}`);
  });
})();
