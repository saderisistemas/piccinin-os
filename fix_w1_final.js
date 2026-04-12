/**
 * fix_w1_final.js
 * Corrige o W1 - Agente Principal:
 * 1. Remove conexão fantasma "W11 Get Contexto OS" da lista de conexões do setarInfo
 * 2. Corrige encoding quebrado nos prompts (Ã© → é, etc.)
 */

const { getWorkflow, putWorkflow } = require('./lib/n8n_api');

const W1_ID = 'BZ429y5KhQxWZ76O';

// Mapa de caracteres quebrados (latin1 mal interpretado como UTF-8)
function fixEncoding(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ã®/g, 'î')
    .replace(/Ã³/g, 'ó').replace(/Ã²/g, 'ò').replace(/Ã´/g, 'ô')
    .replace(/Ã¡/g, 'á').replace(/Ã /g, 'à').replace(/Ã¢/g, 'â')
    .replace(/Ã£/g, 'ã').replace(/Ã§/g, 'ç').replace(/Ã­/g, 'í')
    .replace(/Ãº/g, 'ú').replace(/Ã¼/g, 'ü')
    .replace(/Ã‰/g, 'É').replace(/ÃŠ/g, 'Ê').replace(/Ã"/g, 'Ó')
    .replace(/Ã"/g, 'Ô').replace(/Ã/g, 'Á').replace(/Ã‡/g, 'Ç')
    .replace(/Ã•/g, 'Õ').replace(/Ãœ/g, 'Ü').replace(/ÃŒ/g, 'Î')
    .replace(/Ã€/g, 'À').replace(/Ã‚/g, 'Â').replace(/Ã„/g, 'Ä')
    // Caracteres especiais de pontuação
    .replace(/â€"/g, '—').replace(/â€™/g, "'").replace(/â€œ/g, '"')
    .replace(/â€/g, '"').replace(/â€¦/g, '…').replace(/â€¢/g, '•')
    .replace(/â›"/g, '⛔').replace(/âš /g, '⚠').replace(/â€/g, '—')
    .replace(/Â /g, ' ').replace(/Â·/g, '·');
}

// Percorre recursivamente um objeto e corrige strings
function fixObjectEncoding(obj) {
  if (typeof obj === 'string') return fixEncoding(obj);
  if (Array.isArray(obj)) return obj.map(fixObjectEncoding);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) {
      out[key] = fixObjectEncoding(obj[key]);
    }
    return out;
  }
  return obj;
}

async function main() {
  console.log('🔍 Buscando W1...');
  const wf = await getWorkflow(W1_ID);
  const data = wf.data || wf;

  // ── 1. Remover conexão fantasma ──────────────────────────────────────
  const conn = data.connections;
  if (conn.setarInfo && conn.setarInfo.main && conn.setarInfo.main[0]) {
    const before = JSON.stringify(conn.setarInfo.main[0]);
    // Filtrar itens que NÃO sejam o nó fantasma "W11 Get Contexto OS"
    conn.setarInfo.main[0] = conn.setarInfo.main[0].filter(
      c => c.node !== 'W11 Get Contexto OS'
    );
    const after = JSON.stringify(conn.setarInfo.main[0]);
    if (before !== after) {
      console.log('✅ Conexão fantasma "W11 Get Contexto OS" removida do setarInfo');
    } else {
      console.log('ℹ️  Nenhuma conexão fantasma encontrada (já estava limpo)');
    }
  }

  // ── 2. Corrigir encoding em todos os nós ─────────────────────────────
  const nodesBefore = JSON.stringify(data.nodes);
  data.nodes = fixObjectEncoding(data.nodes);
  const nodesAfter = JSON.stringify(data.nodes);
  const encodingFixed = nodesBefore !== nodesAfter;
  console.log(encodingFixed
    ? '✅ Encoding corrigido nos nós (prompts, parâmetros, etc.)'
    : 'ℹ️  Nenhum problema de encoding encontrado');

  // ── 3. Salvar no n8n ─────────────────────────────────────────────────
  console.log('💾 Salvando W1 no n8n...');
  const result = await putWorkflow(W1_ID, {
    name: data.name,
    nodes: data.nodes,
    connections: data.connections,
    settings: data.settings
  });

  if (result.ok) {
    console.log('🎉 W1 corrigido com sucesso!');
  } else {
    console.error('❌ Erro ao salvar:', result.status, result.body);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
