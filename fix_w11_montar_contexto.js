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

const NEW_MONTAR_CONTEXTO_CODE = `// Montar contexto estruturado - safe access com try-catch
let ctx = {};
let buf = {};

try { ctx = $('GET Contexto Ativo').first()?.json || {}; } catch(e) { ctx = {}; }
try { buf = $('GET Buffer OS').first()?.json || {}; } catch(e) { buf = {}; }

const temOS = !!(ctx.os_id || buf.os_id);
const CAMPOS_OBRIGATORIOS = ['equipamento','defeito','causa','solucao','relatorio_tecnico','tipo_servico'];
const faltando = CAMPOS_OBRIGATORIOS.filter(c => !buf[c] || String(buf[c]).trim() === '');
const prontoParaFechar = temOS && faltando.length === 0;

return [{ json: {
  sucesso: true,
  tem_os_ativa: temOS,
  contexto: {
    tecnico_id:         ctx.tecnico_id   || '',
    tecnico_nome:       ctx.tecnico_nome || '',
    os_id:              ctx.os_id        || buf.os_id     || '',
    os_codigo:          ctx.os_codigo    || buf.os_codigo || '',
    cliente_id:         ctx.cliente_id   || buf.cliente_id  || '',
    cliente_nome:       ctx.cliente_nome || buf.cliente_nome || '',
    fase:               ctx.fase         || buf.fase || 'identificacao',
    checkin_at:         ctx.checkin_at   || null,
    checkout_at:        ctx.checkout_at  || null,
    aguardando_switch:  ctx.aguardando_switch || null
  },
  buffer: {
    equipamento:            buf.equipamento   || '',
    marca:                  buf.marca         || '',
    modelo:                 buf.modelo        || '',
    defeito:                buf.defeito       || '',
    causa:                  buf.causa         || '',
    solucao:                buf.solucao       || '',
    relatorio_tecnico:      buf.relatorio_tecnico || '',
    tipo_servico:           buf.tipo_servico  || '',
    em_garantia:            buf.em_garantia   || false,
    tipo_pagamento:         buf.tipo_pagamento || '',
    observacoes_orientacao: buf.observacoes_orientacao || ''
  },
  pronto_para_fechar: prontoParaFechar,
  campos_faltando: faltando
}}];`;

async function fix() {
  const { body: w11 } = await apiReq('GET', '/workflows/kWjI5bVdGdATsuiH');

  let changed = 0;
  w11.nodes.forEach(n => {
    if (n.type !== 'n8n-nodes-base.supabase') return;

    const op = n.parameters.operation;

    // GET / getAll → sempre continuar mesmo com 0 linhas
    if (!op || op === 'getAll' || op === 'get') {
      n.onError = 'continueRegularOutput';  // não travar no erro
      // alwaysOutputData faz o nó emitir [] mesmo sem resultado
      if (!n.parameters.options) n.parameters.options = {};
      // n8n Supabase node v1 usa esta flag no parameters
      n.parameters.allowUnauthorized = false;
      console.log(`  GETs: ${n.name} → onError=continueRegularOutput`);
      changed++;
    }

    // UPDATE → continuar se não achar linha (já estava assim, mas garantir)
    if (op === 'update') {
      n.onError = 'continueRegularOutput';
      console.log(`  UPDATE: ${n.name} → onError=continueRegularOutput`);
      changed++;
    }

    // INSERT/create → continuar se falhar
    if (op === 'create' || op === 'insert') {
      n.parameters.operation = 'create';
      n.onError = 'continueRegularOutput';
      console.log(`  INSERT: ${n.name} → op=create, onError=continueRegularOutput`);
      changed++;
    }
  });

  // Fix Montar Contexto with try-catch
  const mc = w11.nodes.find(n => n.name === 'Montar Contexto');
  if (mc) {
    mc.parameters.jsCode = NEW_MONTAR_CONTEXTO_CODE;
    console.log('  Montar Contexto → try-catch adicionado');
    changed++;
  }

  // Fix GET Buffer OS: remover filtro os_id (que pode estar vazio)
  const gbuf = w11.nodes.find(n => n.name === 'GET Buffer OS');
  if (gbuf) {
    gbuf.parameters.filters = {
      conditions: [{
        keyName: 'tecnico_id',
        condition: 'eq',
        keyValue: "={{ $('setarInputs').first().json.tecnico_id }}"
      }]
    };
    gbuf.parameters.limit = 1;
    console.log('  GET Buffer OS → filtro simplificado (só tecnico_id)');
    changed++;
  }

  const safeSettings = {};
  if (w11.settings?.executionOrder) safeSettings.executionOrder = w11.settings.executionOrder;

  console.log(`\nEnviando PUT com ${changed} alterações...`);
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
  console.log('✅ W11 ativado com todas as correções');

  // Verificação final
  const { body: v } = await apiReq('GET', '/workflows/kWjI5bVdGdATsuiH');
  console.log('\n=== VERIFICAÇÃO FINAL ===');
  v.nodes.filter(n => n.type === 'n8n-nodes-base.supabase').forEach(n => {
    const op = n.parameters.operation || 'UNDEFINED';
    const onErr = n.onError || 'default(para)';
    const icon = op === 'UNDEFINED' ? '❌' : '✅';
    console.log(`${icon} ${n.name} | op: ${op} | onError: ${onErr}`);
  });
}

fix();
