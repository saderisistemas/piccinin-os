const fs = require('fs');
const path = require('path');

// ─── Fix W2: expose cliente_id at top level ───────────────────────────────────
const w2Path = path.join(__dirname, 'workflows', 'W2 - Tool - Buscar Cliente.json');
const w2 = JSON.parse(fs.readFileSync(w2Path, 'utf8'));

const mergeNode = w2.nodes.find(n => n.name === 'Merge e Ranking');
if (!mergeNode) { console.error('Merge e Ranking not found'); process.exit(1); }

// Replace the return statements to expose cliente_id at top level
let code = mergeNode.parameters.jsCode;

// Fix single_match return: add cliente_id and cliente_nome at top level
code = code.replace(
  `return [{ json: {\n    resultado: \`Cliente encontrado: *\${c.nome}*\${c.razao_social ? ' (' + c.razao_social + ')' : ''}\${endereco ? ' — ' + endereco : ''}. Confirma?\`,\n    clientes: [{ id: c.id, nome: c.nome, razao_social: c.razao_social || '', telefone: c.telefone || c.celular || '', endereco }],\n    total_encontrado: 1,\n    status: 'single_match'\n  } }];`,
  `return [{ json: {\n    resultado: \`Achei: *\${c.nome}*\${c.razao_social ? ' (' + c.razao_social + ')' : ''}\${endereco ? ' — ' + endereco : ''}. Confirma?\`,\n    cliente_id: String(c.id),\n    cliente_nome: c.nome,\n    clientes: [{ id: c.id, nome: c.nome, razao_social: c.razao_social || '', telefone: c.telefone || c.celular || '', endereco }],\n    total_encontrado: 1,\n    status: 'single_match'\n  } }];`
);

// Fix multiple_matches: include IDs visually in the list for the LLM
code = code.replace(
  `const lista = top.map(formatar).join('\\n');
return [{ json: {\n  resultado: \`Encontrei \${top.length} cliente(s) parecidos:\n\${lista}\n\nQual é o correto? Responde o número.\`,\n  clientes: top.map(c => ({`,
  `const lista = top.map(formatar).join('\\n');\n// Build option_map so LLM can look up ID by option number\nconst option_map = {};\ntop.forEach((c, i) => { option_map[String(i+1)] = { id: String(c.id), nome: c.nome }; });\nreturn [{ json: {\n  resultado: \`Encontrei \${top.length} clientes parecidos:\\n\${lista}\\n\\nQual é o correto? Responde o número.\`,\n  option_map,\n  clientes: top.map(c => ({`
);

// Add closing for the multiple_matches return (after the existing closing)
// The original ends with: } }];
// We need to close the new fields
code = code.replace(
  `  total_encontrado: top.length,
    status: 'multiple_matches'\n} }];`,
  `  total_encontrado: top.length,\n    status: 'multiple_matches'\n} }];`
);

mergeNode.parameters.jsCode = code;
fs.writeFileSync(w2Path, JSON.stringify(w2, null, 2), 'utf8');
console.log('OK: W2 — cliente_id e option_map expostos no topo da resposta');

// ─── Fix W1: update tool descriptions for both buscarCliente and criarOS ──────
const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// Fix buscarCliente tool description
const buscarClienteNode = w1.nodes.find(n => n.name === 'buscarCliente');
if (buscarClienteNode) {
  buscarClienteNode.parameters.description =
    'Busca cliente no Bom Saldo. Retorna: "cliente_id" (ID direto do cliente confirmado), "cliente_nome" (nome), "status" (single_match/multiple_matches/not_found), "option_map" (mapa numero->id para escolha em lista). IMPORTANTE: quando o resultado for single_match, guarde "cliente_id" diretamente. Quando for multiple_matches, o usuario escolhe um numero (1,2,3) — use option_map[numero].id como cliente_id.';
  console.log('OK: buscarCliente description atualizada');
}

// Fix criarOS fromAI for cliente_id
const criarOSNode = w1.nodes.find(n => n.name === 'criarOS');
if (criarOSNode && criarOSNode.parameters.workflowInputs) {
  criarOSNode.parameters.workflowInputs.value['cliente_id'] =
    "={{ $fromAI('cliente_id', 'ID numerico do cliente. Para single_match: use o campo cliente_id retornado pelo buscarCliente. Para multiple_matches: quando o usuario escolheu a opcao N, use option_map[N].id retornado pelo buscarCliente. NUNCA deixe em branco.', 'string') }}";

  criarOSNode.parameters.description =
    'Abre nova OS. Passe cliente_id (ID do cliente — vem do campo cliente_id ou option_map do buscarCliente) e observacoes (motivo do atendimento). Nao pergunte o cliente_id ao tecnico — use o que veio do buscarCliente.';
  console.log('OK: criarOS — cliente_id fromAI descricao mais clara');
}

// Update Vanda system prompt: add explicit instruction about retaining cliente_id
const vanda = w1.nodes.find(n => n.name === 'Vanda');
let msg = vanda.parameters.options.systemMessage;

// Update ETAPA 1 to be explicit about saving cliente_id
if (msg.includes('**status: `single_match`**')) {
  msg = msg.replace(
    '**status: `single_match`** — encontrou 1 candidato provável\n  → Confirme rapidamente: *"É [nome]? Confirma?"*\n  → Se sim: prossiga. Se não: peça mais detalhes',
    '**status: `single_match`** — encontrou 1 candidato\n  → Confirme: *"É [nome]? Confirma?"*\n  → Se sim: guarde internamente o campo **cliente_id** retornado. Prossiga.\n  → Se não: peça mais detalhes'
  );
  msg = msg.replace(
    '**status: `multiple_matches`** — encontrou vários parecidos\n  → Apresente a lista numerada ao técnico: *"Encontrei estes clientes, qual é?"*\n  → Aguarde ele responder o número ou o nome',
    '**status: `multiple_matches`** — encontrou vários parecidos\n  → Apresente a lista numerada ao técnico: *"Encontrei estes clientes, qual é?"*\n  → Quando o usuário responder com um número N: use **option_map[N].id** como cliente_id confirmado\n  → Guarde internamente: cliente_id = option_map[N].id e nome = option_map[N].nome'
  );
}

vanda.parameters.options.systemMessage = msg;
fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('OK: W1 salvo');
