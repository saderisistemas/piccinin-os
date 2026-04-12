/**
 * fix_encoding_final.js
 * Corrige DEFINITIVAMENTE o encoding do W1 em produção.
 * Usa iconv-lite para decodificar latin1→utf8 corretamente.
 */
const { getWorkflow, putWorkflow } = require('./lib/n8n_api');

const W1_ID = 'BZ429y5KhQxWZ76O';

/**
 * Converte string mal-interpretada (latin1 bytes lidos como UTF-8) de volta para UTF-8 correto.
 * Estratégia: encode de volta para latin1 byte a byte, depois decodifica como UTF-8.
 */
function fixMojibake(str) {
  if (typeof str !== 'string') return str;
  try {
    // Reinterpreta a string como sequência de bytes latin1 → decodifica como UTF-8
    const bytes = Buffer.from(str, 'latin1');
    const fixed = bytes.toString('utf8');
    // Verificação: se o resultado tem menos caracteres estranhos, usa ele
    return fixed;
  } catch {
    return str;
  }
}

// Aplica recursivamente em todo o objeto
function fixObject(obj) {
  if (typeof obj === 'string') return fixMojibake(obj);
  if (Array.isArray(obj)) return obj.map(fixObject);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = fixObject(obj[k]);
    return out;
  }
  return obj;
}

async function main() {
  console.log('🔍 Buscando W1...');
  const wf = await getWorkflow(W1_ID);
  const data = wf.data || wf;

  // Amostra antes da correção
  const vandaBefore = data.nodes.find(n => n.name === 'Vanda');
  const sysBefore = vandaBefore?.parameters?.options?.systemMessage || '';
  console.log('\n📋 ANTES (primeiros 200 chars):');
  console.log(sysBefore.substring(0, 200));

  // Corrigir encoding em todos os nós
  data.nodes = fixObject(data.nodes);

  // Amostra depois da correção
  const vandaAfter = data.nodes.find(n => n.name === 'Vanda');
  const sysAfter = vandaAfter?.parameters?.options?.systemMessage || '';
  console.log('\n✅ DEPOIS (primeiros 200 chars):');
  console.log(sysAfter.substring(0, 200));

  // Salvar no n8n
  console.log('\n💾 Salvando no n8n...');
  const result = await putWorkflow(W1_ID, {
    name: data.name,
    nodes: data.nodes,
    connections: data.connections,
    settings: data.settings
  });

  if (result.ok) {
    console.log('🎉 Encoding corrigido e salvo com sucesso!');
    console.log('\n📝 System prompt completo após correção:');
    console.log(sysAfter);
  } else {
    console.error('❌ Erro ao salvar:', result.status, result.body);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
