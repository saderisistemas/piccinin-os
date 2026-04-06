/**
 * FIX SEQUENCIAL - um workflow por vez, com log detalhado de erro
 */
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const BASE = 'https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows';

async function get(id) {
  const r = await fetch(`${BASE}/${id}`, { headers: { 'X-N8N-API-KEY': API_KEY } });
  const txt = await r.text();
  try { return JSON.parse(txt); }
  catch(e) { throw new Error(`GET ${id} returned non-JSON (${r.status}): ${txt.substring(0, 200)}`); }
}

async function put(id, payload) {
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const txt = await r.text();
  return { ok: r.status >= 200 && r.status < 300, status: r.status, txt };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ────────────────────────────────────────────────────────────────────────────
// PASSO 1: FIX W2 (Merge e Ranking — mostrar ID_INTERNO no resultado)
// ────────────────────────────────────────────────────────────────────────────
async function fixW2() {
  console.log('\n[1/3] Corrigindo W2 - Merge e Ranking...');
  const w2 = await get('cdirQ2Av9MVLrDIK');
  const node = w2.nodes.find(n => n.name === 'Merge e Ranking');
  if (!node) throw new Error('Nó "Merge e Ranking" não encontrado');

  // Patch mínimo: só alterar o resultado do single_match e do multiple_matches
  // para exibir o ID explicitamente
  let code = node.parameters.jsCode;

  // Substituir a linha do resultado no single_match
  code = code.replace(
    /resultado: `Achei: \*\$\{c\.nome\}\*.*?Confirma\?`/s,
    "resultado: `Achei: *${c.nome}*${c.razao_social ? ' (' + c.razao_social + ')' : ''}${endereco ? ' — ' + endereco : ''}. *ID_INTERNO: ${c.id}*. Confirma? (Ao confirmar, use cliente_id=${c.id})`"
  );

  // Substituir a linha do resultado no multiple_matches
  code = code.replace(
    /resultado: `Encontrei.*?Responde o número\.`/s,
    "resultado: `Encontrei ${top.length} clientes parecidos:\\n${lista}\\n\\nQual é o correto? Responde o número. O ID_INTERNO de cada opção está entre colchetes [ID:XXXXX] — guarde o ID do escolhido para usar no criarOS.`"
  );

  // Substituir o formatar para incluir [ID:xxx]
  code = code.replace(
    /return `\$\{i\+1\}\. \$\{c\.nome\}.*?`\s*;/s,
    "return `${i+1}. ${c.nome}${complemento}${cidade ? ' — ' + cidade : ''}${tel ? ' | ' + tel : ''} [ID:${c.id}]`;"
  );

  node.parameters.jsCode = code;

  // Também garantir que clientes.id seja String
  code = code.replace(/id: c\.id,/g, 'id: String(c.id),');
  node.parameters.jsCode = code;

  const res = await put('cdirQ2Av9MVLrDIK', {
    name: w2.name, nodes: w2.nodes, connections: w2.connections, settings: w2.settings
  });
  console.log(res.ok ? `✅ W2 OK (${res.status})` : `❌ W2 ERRO ${res.status}: ${res.txt.substring(0, 400)}`);
  return res.ok;
}

// ────────────────────────────────────────────────────────────────────────────
// PASSO 2: FIX W3b (Trigger string + parseInt no POST)
// ────────────────────────────────────────────────────────────────────────────
async function fixW3b() {
  console.log('\n[2/3] Corrigindo W3b - Trigger e POST...');
  const w3b = await get('Pbj7zwqjbeHtvodF');
  
  // Fix Trigger: cliente_id como string
  const trigger = w3b.nodes.find(n => n.name === 'Trigger');
  if (trigger) {
    trigger.parameters = {
      workflowInputs: {
        values: [
          { name: 'cliente_id', type: 'string' },
          { name: 'situacao_id', type: 'string' },
          { name: 'observacoes' },
          { name: 'tecnico_nome' }
        ]
      }
    };
  }

  // Fix POST: usar parseInt para garantir integer
  const post = w3b.nodes.find(n => n.name === 'POST Criar OS');
  if (post) {
    post.parameters.jsonBody = `={\n  "cliente_id": {{ parseInt($json.cliente_id) }},\n  "situacao_id": {{ parseInt($json.situacao_id) || 6237497 }},\n  "data_entrada": "{{ $now.format('yyyy-MM-dd') }}",\n  "observacoes": "{{ $json.observacoes || 'OS aberta via Assistente Vanda - Piccinin Security' }}",\n  "vendedor_id": 906858\n}`;
  }

  const res = await put('Pbj7zwqjbeHtvodF', {
    name: w3b.name, nodes: w3b.nodes, connections: w3b.connections, settings: w3b.settings
  });
  console.log(res.ok ? `✅ W3b OK (${res.status})` : `❌ W3b ERRO ${res.status}: ${res.txt.substring(0, 400)}`);
  return res.ok;
}

// ────────────────────────────────────────────────────────────────────────────
// PASSO 3: FIX W1 (descriptions e $fromAI do criarOS)
// ────────────────────────────────────────────────────────────────────────────
async function fixW1() {
  console.log('\n[3/3] Corrigindo W1 - descriptions...');
  const w1 = await get('cecf2wY4MQsp4mr8');

  // Atualizar description do buscarCliente
  const buscar = w1.nodes.find(n => n.name === 'buscarCliente');
  if (buscar) {
    buscar.parameters.description = `Busca cliente no Bom Saldo pelo nome. CHAME ANTES de criarOS. ` +
      `Retorna: "cliente_id" (ID real — string como "34475798"), "status" (single_match/multiple_matches/not_found), ` +
      `"option_map" (mapa N→{id,nome} para múltiplos). ` +
      `REGRA HARD: single_match → copie "cliente_id" LITERALMENTE. ` +
      `multiple_matches → técnico escolhe N → use option_map[N].id. ` +
      `O ID_INTERNO também aparece no texto de resultado entre colchetes [ID:XXXXX] e com *ID_INTERNO: XXXXX*. ` +
      `NUNCA invente um número. NUNCA use nome como cliente_id.`;
    console.log('  ✓ buscarCliente description atualizado');
  }

  // Atualizar description e $fromAI do criarOS
  const criar = w1.nodes.find(n => n.name === 'criarOS');
  if (criar) {
    criar.parameters.description = `Abre nova OS no Bom Saldo. ` +
      `OBRIGATÓRIO: ANTES chame buscarCliente e obtenha o cliente_id (número de 8 dígitos como "34475798"). ` +
      `NUNCA invente o cliente_id — copie-o LITERALMENTE do resultado de buscarCliente (campo "cliente_id" ou "[ID:XXXXX]" no texto). ` +
      `Campos: cliente_id (obrigatório), observacoes (motivo).`;

    if (criar.parameters.workflowInputs && criar.parameters.workflowInputs.value) {
      criar.parameters.workflowInputs.value.cliente_id =
        `={{ $fromAI('cliente_id', 'ID interno do cliente no Bom Saldo — copie EXATAMENTE o "cliente_id" retornado por buscarCliente (ex: "34475798"). NUNCA invente. NUNCA use nome.', 'string') }}`;
    }
    console.log('  ✓ criarOS description e $fromAI atualizados');
  }

  const res = await put('cecf2wY4MQsp4mr8', {
    name: w1.name, nodes: w1.nodes, connections: w1.connections, settings: w1.settings
  });
  console.log(res.ok ? `✅ W1 OK (${res.status})` : `❌ W1 ERRO ${res.status}: ${res.txt.substring(0, 400)}`);
  return res.ok;
}

async function main() {
  console.log('=== FIX COMPLETO cliente_id ===');
  
  const ok2 = await fixW2();
  await sleep(2000);
  const ok3b = await fixW3b();
  await sleep(2000);
  const ok1 = await fixW1();

  console.log('\n=== RESULTADO FINAL ===');
  console.log(`W2:  ${ok2  ? '✅' : '❌'}`);
  console.log(`W3b: ${ok3b ? '✅' : '❌'}`);
  console.log(`W1:  ${ok1  ? '✅' : '❌'}`);

  if (ok2 && ok3b && ok1) {
    console.log('\n✅ TUDO APLICADO! Fluxo corrigido:');
    console.log('  buscarCliente → "ID_INTERNO: 34475798" no texto → LLM captura');
    console.log('  criarOS → cliente_id="34475798" → parseInt → 34475798 (int) → API ✅');
  }
}

main().catch(e => console.error('FATAL:', e.message));
