/**
 * compare_prompts.js
 * Compara o system prompt da Vanda (n8n produção) com o arquivo local de referência.
 */
const fs = require('fs');
const { getWorkflow } = require('./lib/n8n_api');

const W1_ID = 'BZ429y5KhQxWZ76O';

function fixEncoding(s) {
  if (!s) return '';
  return s
    .replace(/Ã©/g,'é').replace(/Ã£/g,'ã').replace(/Ã§/g,'ç').replace(/Ã­/g,'í')
    .replace(/Ã³/g,'ó').replace(/Ã¡/g,'á').replace(/Ã‰/g,'É').replace(/Ã"/g,'Ô')
    .replace(/Ã¼/g,'ü').replace(/Ã¨/g,'è').replace(/Ãº/g,'ú').replace(/Ã•/g,'Õ')
    .replace(/Ã‚/g,'Â').replace(/Ã'/g,'Ó').replace(/Ã"/g,'Ô').replace(/Ã„/g,'Ä')
    .replace(/Ã€/g,'À').replace(/Ã/g,'Á').replace(/Ã‡/g,'Ç').replace(/Ã˜/g,'Ø')
    .replace(/â€"/g,'—').replace(/â€™/g,"'").replace(/â€œ/g,'"').replace(/â€/g,'"')
    .replace(/â€¦/g,'…').replace(/â€¢/g,'•')
    .replace(/â›"/g,'⛔').replace(/âš /g,'⚠')
    .replace(/Â /g,' ').replace(/Â·/g,'·');
}

async function main() {
  // 1. Buscar do n8n (produção)
  console.log('🔍 Buscando W1 do n8n produção...');
  const wf = await getWorkflow(W1_ID);
  const data = wf.data || wf;
  const vandaN8N = data.nodes.find(n => n.name === 'Vanda');
  const sysN8N   = vandaN8N?.parameters?.options?.systemMessage || '';
  const textN8N  = vandaN8N?.parameters?.text || '';
  const modelN8N = vandaN8N?.parameters?.options?.model?.value || vandaN8N?.typeVersion || '?';

  // 2. Ler arquivo local de referência
  console.log('📂 Lendo arquivo local de referência...');
  const localPath = './workflows/W1 - Protek OS - Agente Principal.json';
  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  const vandaLocal  = local.nodes.find(n => n.name === 'Vanda');
  const sysLocal    = fixEncoding(vandaLocal?.parameters?.options?.systemMessage || '');
  const textLocal   = fixEncoding(vandaLocal?.parameters?.text || '');

  // 3. Comparar
  console.log('\n========== COMPARAÇÃO ==========');
  console.log(`Tamanho systemMessage n8n:   ${sysN8N.length} chars`);
  console.log(`Tamanho systemMessage local: ${sysLocal.length} chars`);
  console.log(`text n8n:   ${textN8N.substring(0,80)}`);
  console.log(`text local: ${textLocal.substring(0,80)}`);
  console.log('');

  if (sysN8N === sysLocal) {
    console.log('✅ System prompts IDÊNTICOS - está tudo certo!');
    return;
  }

  console.log('⚠️  System prompts DIFERENTES. Diferenças por linha:');
  const linesN8N   = sysN8N.split('\n');
  const linesLocal = sysLocal.split('\n');
  const maxLen = Math.max(linesN8N.length, linesLocal.length);
  let diffs = 0;

  for (let i = 0; i < maxLen; i++) {
    const a = linesN8N[i] ?? '(sem linha)';
    const b = linesLocal[i] ?? '(sem linha)';
    if (a !== b) {
      diffs++;
      console.log(`\n  Linha ${i + 1}:`);
      console.log(`  [N8N]  : ${a.substring(0, 120)}`);
      console.log(`  [LOCAL]: ${b.substring(0, 120)}`);
      if (diffs >= 25) { console.log('\n  ... (mais diferenças omitidas)'); break; }
    }
  }

  console.log(`\nTotal: ${diffs} linha(s) diferente(s) de ${maxLen} linhas totais.`);

  // 4. Mostrar o system prompt completo do n8n atual
  console.log('\n========== SYSTEM PROMPT ATUAL (n8n) ==========');
  console.log(sysN8N);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
