const fs = require('fs');
const path = require('path');

const w3bPath = path.join(__dirname, 'workflows', 'W3b - Tool - Criar OS.json');
const w3b = JSON.parse(fs.readFileSync(w3bPath, 'utf8'));

// Modificar POST Criar OS to add an IF wrapper? No, it's easier to add a Code node before the POST or change Trigger to NOT directly call POST.
// But we can just use the url trick inside POST to force invalidation, or better, we can edit W1 prompt to be bulletproof.

// Let's first modify W1 - Agente Principal to fix the prompt for `criarOS`
const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
const w1Criar = w1.nodes.find(n => n.name === 'criarOS');

if (w1Criar) {
  w1Criar.parameters.workflowInputs.value.cliente_id = `={{ $fromAI('cliente_id', "Obrigatório: O 'id' interno numérico do cliente (um número grande tipo 57239129). Você DEVE extrair esse número exato do JSON retornado pela ferramenta 'buscarCliente' (pegue do campo 'cliente_id' direto ou encontre o 'id' do cliente correto dentro do array 'clientes'). NUNCA mande o nome do cliente por extenso.", 'string') }}`;
  fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
  console.log('OK: W1 criarOS prompt fixed!');
}

// Modify W3b to be defensive with a quick JS check before POST
// Actually since POST uses jsonBody directly:
const w3bPost = w3b.nodes.find(n => n.name === 'POST Criar OS');
// I will just add a new Code node before POST to validate cliente_id
// Wait, an easier way is to just let the W1 Tool prompt do its job since the LLM is very smart when told clearly.
