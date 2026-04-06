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

// O código corrigido do nó "Processar Contexto"
// Problema: quando o Switch roteia para "GET Buffer por Conversa" (branch 1),
// o nó "GET Buffer por Tecnico+OS" nunca executa. O n8n lança erro mesmo
// com optional chaining (?.) se o nó nunca rodou. Solução: try-catch em cada acesso.
const fixedCode = `// Consolida todos os dados disponíveis em um contexto estruturado
const params = $('Validar Params').first().json;

// ── Buffer (nova chave ou legado) com try-catch para nós que podem não ter executado
let bufA = {};
let bufB = {};
let ctx = {};
let itensRaw = [];

try { bufA = $('GET Buffer por Tecnico+OS').first()?.json || {}; } catch(e) { bufA = {}; }
try { bufB = $('GET Buffer por Conversa').first()?.json || {}; } catch(e) { bufB = {}; }
// Prioriza o buffer por tecnico_id+os_id se existir
const buf = (bufA.os_id || bufA.tecnico_id) ? bufA : bufB;

// ── Contexto ativo (W11 tecnico_contexto_ativo) ──────────────────────
try { ctx = $('GET Contexto Ativo').first()?.json || {}; } catch(e) { ctx = {}; }

// ── Itens (produtos e serviços) ──────────────────────────────────────
try { itensRaw = $('GET Itens Buffer').all(); } catch(e) { itensRaw = []; }
const itens    = itensRaw.map(i => i.json).filter(i => i && (i.conversa_id || i.tecnico_id));
const produtos = itens.filter(i => i.tipo === 'produto');
const servicos = itens.filter(i => i.tipo === 'servico');

// ── OS ID resolvido ──────────────────────────────────────────────────
// Prioridade: ctx (W11) > buf > params
const osIdResolvido     = ctx.os_id      || buf.os_id      || params.os_id      || null;
const osCodigoResolvido = ctx.os_codigo  || buf.os_codigo  || null;

// ── Campos obrigatórios para fechar ─────────────────────────────────
const OBRIGATORIOS = ['equipamento','defeito','causa','solucao','relatorio_tecnico','tipo_servico'];
const problemas = [];

if (!osIdResolvido)      problemas.push('os_id não registrado');
if (!buf.cliente_id)     problemas.push('cliente_id não confirmado');
if (!buf.em_garantia) {
  if (!buf.forma_pagamento_id && !buf.tipo_pagamento)
    problemas.push('forma de pagamento não informada');
}
if (servicos.length === 0) problemas.push('nenhum serviço confirmado');

OBRIGATORIOS.forEach(c => {
  if (!buf[c] || String(buf[c]).trim() === '') {
    problemas.push(\`campo '\${c}' não preenchido\`);
  }
});

const prontoParaFechar = problemas.length === 0;

// ── Timestamp checkin/checkout ────────────────────────────────────────
const checkinAt  = ctx.checkin_at  || buf.hora_entrada || null;
const checkoutAt = ctx.checkout_at || buf.hora_saida   || null;

return [{ json: {
  pronto_para_fechar:    prontoParaFechar,
  problemas_encontrados: problemas,
  contexto_ativo: {
    os_id:         osIdResolvido,
    os_codigo:     osCodigoResolvido,
    tecnico_id:    ctx.tecnico_id   || buf.tecnico_id   || params.tecnico_id  || null,
    tecnico_nome:  ctx.tecnico_nome || buf.tecnico_nome || null,
    cliente_id:    ctx.cliente_id   || buf.cliente_id   || null,
    cliente_nome:  ctx.cliente_nome || buf.cliente_nome || null,
    fase:          ctx.fase         || buf.fase         || 'identificacao',
    checkin_at:    checkinAt,
    checkout_at:   checkoutAt
  },
  buffer: {
    equipamento:            buf.equipamento             || '',
    marca:                  buf.marca                   || '',
    modelo:                 buf.modelo                  || '',
    defeito:                buf.defeito                 || '',
    causa:                  buf.causa                   || '',
    solucao:                buf.solucao                 || '',
    relatorio_tecnico:      buf.relatorio_tecnico        || '',
    tipo_servico:           buf.tipo_servico             || '',
    em_garantia:            buf.em_garantia              || false,
    tipo_pagamento:         buf.tipo_pagamento           || '',
    forma_pagamento_id:     buf.forma_pagamento_id       || null,
    observacoes_orientacao: buf.observacoes_orientacao   || '',
    link_drive:             buf.link_drive               || ''
  },
  itens_confirmados: itens,
  produtos,
  servicos,
  resumo: {
    cliente:        buf.cliente_nome || ctx.cliente_nome || '—',
    os_codigo:      osCodigoResolvido || '—',
    os_id:          osIdResolvido,
    em_garantia:    buf.em_garantia || false,
    n_produtos:     produtos.length,
    n_servicos:     servicos.length,
    total_estimado: itens
      .reduce((s, i) => s + (parseFloat(i.valor_venda || 0) * parseFloat(i.quantidade || 1)), 0)
      .toFixed(2)
  }
}}];
`;

(async () => {
  const w9Res = await req('GET', '/workflows/euPVASK7Ycfi6zWk');
  let w9 = JSON.parse(w9Res.body);

  let changed = false;
  w9.nodes.forEach(n => {
    if (n.name === 'Processar Contexto') {
      n.parameters.jsCode = fixedCode;
      changed = true;
      console.log('✅ Processar Contexto code updated');
    }
  });

  if (!changed) {
    console.log('❌ Node "Processar Contexto" not found!');
    console.log('Nodes:', w9.nodes.map(n => n.name).join(', '));
    return;
  }

  const putBody = {
    name: w9.name, nodes: w9.nodes, connections: w9.connections,
    settings: w9.settings?.executionOrder ? { executionOrder: w9.settings.executionOrder } : {},
    staticData: w9.staticData || null
  };

  const r = await req('PUT', '/workflows/euPVASK7Ycfi6zWk', putBody);
  console.log('PUT W9:', r.status);
  if (r.status !== 200) {
    console.log('Error:', r.body.substring(0, 400));
  } else {
    await req('POST', '/workflows/euPVASK7Ycfi6zWk/activate');
    console.log('✅ W9 ativado!');
  }
})();
