/**
 * FIX DEFINITIVO — Tirar IDs numéricos da responsabilidade da LLM
 * 
 * 1. Modelo gpt-4.1 → gpt-4.1-mini
 * 2. criarOS: LLM passa NOME do cliente, W3b resolve o ID real via API
 * 3. atualizarOS: os_id vem do W11 contexto (Supabase), não da LLM
 * 4. cancelarOS: os_id vem do W11 contexto (Supabase), não da LLM
 * 5. produtos/servicos: LLM passa NOMES e quantidades, W6 resolve IDs
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'workflows');

// ═══════════════════════════════════════════════════════════════
// 1. CHANGES TO W1 (Agente Principal)
// ═══════════════════════════════════════════════════════════════
const w1Path = path.join(DIR, 'W1 - Protek OS - Agente Principal.json');
let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

w1.nodes.forEach(node => {
  // 1a. Change model gpt-4.1 → gpt-4.1-mini
  if (node.name === 'gpt-4.1 Vanda') {
    node.parameters.model.value = 'gpt-4.1-mini';
    node.name = 'gpt-4.1-mini Vanda';
    console.log('✅ Model changed to gpt-4.1-mini');
  }

  // 1b. criarOS: add cliente_nome, make cliente_id optional
  if (node.name === 'criarOS') {
    const val = node.parameters.workflowInputs.value;
    val.cliente_id = "={{ $fromAI('cliente_id', 'ID numerico do cliente se voce souber. Se nao souber, envie string vazia.', 'string') }}";
    val.cliente_nome = "={{ $fromAI('cliente_nome', 'OBRIGATORIO: Nome EXATO do cliente que foi confirmado pelo tecnico. Copie o nome exatamente como retornado pelo buscarCliente.', 'string') }}";
    
    // Add cliente_nome to schema
    const schema = node.parameters.workflowInputs.schema;
    if (!schema.find(s => s.id === 'cliente_nome')) {
      schema.push({
        id: 'cliente_nome',
        displayName: 'cliente_nome',
        required: false,
        defaultMatch: false,
        display: true,
        type: 'string',
        canBeUsedToMatch: true,
        removed: false
      });
    }
    
    node.parameters.description = `Abre nova OS no Bom Saldo.
REGRAS:
1. Voce DEVE ter chamado buscarCliente ANTES nesta conversa.
2. Passe o NOME EXATO do cliente em cliente_nome (copie do retorno do buscarCliente).
3. O sistema vai resolver o ID automaticamente pelo nome. Nao se preocupe com o ID numerico.`;
    
    console.log('✅ criarOS: cliente_nome added, cliente_id made optional');
  }

  // 1c. atualizarOS: os_id from W11 context
  if (node.name === 'atualizarOS') {
    const val = node.parameters.workflowInputs.value;
    // os_id: prefer W11 context, fallback to $fromAI
    val.os_id = "={{ $('W11 Get Contexto OS').first()?.json?.contexto?.os_id || $fromAI('os_id', 'ID interno da OS se o contexto estiver vazio', 'string') }}";
    
    // produtos_json: change to accept names instead of IDs
    val.produtos_json = "={{ $fromAI('produtos_json', 'JSON array de produtos. Use NOME do produto (campo nome retornado pelo buscarProdutos), quantidade e valor_venda. Exemplo: [{\"nome\":\"Camera HDCVI 1080p\",\"quantidade\":\"1\",\"valor_venda\":\"350.00\"}]. Se nao houver produtos, envie string vazia.', 'string') }}";
    
    // servicos_json: change to accept names instead of IDs
    val.servicos_json = "={{ $fromAI('servicos_json', 'JSON array de servicos. Use NOME do servico (campo nome retornado pelo buscarServicos), quantidade e valor_venda. Exemplo: [{\"nome\":\"Manutencao preventiva CFTV\",\"quantidade\":\"1\",\"valor_venda\":\"200.00\"}]. Se nao houver servicos, envie string vazia.', 'string') }}";
    
    console.log('✅ atualizarOS: os_id from W11 context, produtos/servicos by NAME');
  }

  // 1d. cancelarOS: os_id from W11 context, fix .item → .first()
  if (node.name === 'cancelarOS') {
    const val = node.parameters.workflowInputs.value;
    val.os_id = "={{ $('W11 Get Contexto OS').first()?.json?.contexto?.os_id || $fromAI('os_id', 'ID interno da OS se o contexto estiver vazio', 'string') }}";
    val.tecnico_responsavel = "={{ $('setarInfo').first().json.nomeTecnico }}";
    console.log('✅ cancelarOS: os_id from W11 context');
  }
});

// Fix connections for renamed model node
if (w1.connections['gpt-4.1 Vanda']) {
  w1.connections['gpt-4.1-mini Vanda'] = w1.connections['gpt-4.1 Vanda'];
  delete w1.connections['gpt-4.1 Vanda'];
  console.log('✅ W1 connections updated for model rename');
}

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
console.log('💾 W1 saved\n');


// ═══════════════════════════════════════════════════════════════
// 2. CHANGES TO W3b (Criar OS) — Add name-based client resolution
// ═══════════════════════════════════════════════════════════════
const w3bPath = path.join(DIR, 'W3b - Tool - Criar OS.json');
let w3b = JSON.parse(fs.readFileSync(w3bPath, 'utf8'));

// 2a. Add cliente_nome to Trigger inputs
const triggerNode = w3b.nodes.find(n => n.name === 'Trigger');
if (!triggerNode.parameters.workflowInputs.values.find(v => v.name === 'cliente_nome')) {
  triggerNode.parameters.workflowInputs.values.push({ name: 'cliente_nome' });
  console.log('✅ W3b Trigger: cliente_nome input added');
}

// 2b. Add "Resolver Cliente" HTTP node
const resolverClienteNode = {
  parameters: {
    method: 'GET',
    url: "=https://bomsaldo.com/api/clientes/?nome={{ encodeURIComponent($json.cliente_nome || '') }}&ativo=1&limit=5",
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'access-token', value: '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8' },
        { name: 'secret-access-token', value: '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a' }
      ]
    },
    options: {
      redirect: {
        redirect: { followRedirects: true, maxRedirects: 5 }
      }
    }
  },
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [-700, 400],
  id: 'w3b-resolver-cliente',
  name: 'Resolver Cliente',
  onError: 'continueRegularOutput'
};

// Shift existing nodes to the right to make room
w3b.nodes.forEach(n => {
  if (n.name !== 'Trigger') {
    n.position[0] += 400; // shift right
  }
});

// Add the new node
w3b.nodes.push(resolverClienteNode);
console.log('✅ W3b: "Resolver Cliente" HTTP node added');

// 2c. Modify "Validar Parametros" to use resolved client ID
const validarNode = w3b.nodes.find(n => n.name === 'Validar Parametros');
validarNode.parameters.jsCode = `
// ─── RESOLVER CLIENTE ID REAL ─────────────────────────────────
const triggerParams = $('Trigger').first().json;
const apiResp = $input.first().json;
const clientes = apiResp.data || [];

let clienteIdReal = null;
let clienteNomeReal = null;

if (clientes.length > 0) {
  const nomeInput = (triggerParams.cliente_nome || '').toLowerCase().trim();
  
  // Match exato pelo nome
  let match = clientes.find(c =>
    (c.nome || '').toLowerCase().trim() === nomeInput ||
    (c.razao_social || '').toLowerCase().trim() === nomeInput
  );
  
  // Match parcial (contém)
  if (!match) {
    match = clientes.find(c =>
      (c.nome || '').toLowerCase().includes(nomeInput) ||
      nomeInput.includes((c.nome || '').toLowerCase()) ||
      (c.razao_social || '').toLowerCase().includes(nomeInput) ||
      nomeInput.includes((c.razao_social || '').toLowerCase())
    );
  }
  
  // Fallback: primeiro resultado (mais relevante da API)
  if (!match) match = clientes[0];
  
  clienteIdReal = String(match.id);
  clienteNomeReal = match.nome;
}

// Se não achou pela API, tenta o ID que a LLM mandou (última chance)
if (!clienteIdReal && triggerParams.cliente_id && /^[0-9]+$/.test(String(triggerParams.cliente_id).trim())) {
  clienteIdReal = String(triggerParams.cliente_id).trim();
}

if (!clienteIdReal) {
  return [{ json: { error: "VANDA FATAL: Nao foi possivel encontrar o cliente '" + (triggerParams.cliente_nome || '???') + "' na API do Bom Saldo. Pergunte o nome correto ao tecnico." } }];
}

return [{ json: {
  ...triggerParams,
  cliente_id: clienteIdReal,
  cliente_nome_validado: clienteNomeReal || triggerParams.cliente_nome
} }];
`;
console.log('✅ W3b: Validar Parametros rewritten with API-based client resolution');

// 2d. Rewire connections: Trigger → Resolver Cliente → Validar Parametros
w3b.connections['Trigger'] = {
  main: [[{ node: 'Resolver Cliente', type: 'main', index: 0 }]]
};
w3b.connections['Resolver Cliente'] = {
  main: [[{ node: 'Validar Parametros', type: 'main', index: 0 }]]
};
// Validar Parametros → POST Criar OS stays the same
console.log('✅ W3b: Connections rewired');

fs.writeFileSync(w3bPath, JSON.stringify(w3b, null, 2));
console.log('💾 W3b saved\n');

console.log('═══════════════════════════════════════════');
console.log('RESUMO:');
console.log('  W1: modelo → gpt-4.1-mini');
console.log('  W1: criarOS usa cliente_nome (LLM) → W3b resolve ID via API');
console.log('  W1: atualizarOS/cancelarOS → os_id do W11 contexto');
console.log('  W1: produtos/servicos → LLM passa NOMES, não IDs');
console.log('  W3b: novo nó Resolver Cliente (HTTP) antes de Validar');
console.log('═══════════════════════════════════════════');
