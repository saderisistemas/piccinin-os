const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const vanda = w1.nodes.find(n => n.name === 'Vanda');
if (!vanda) { console.error('Vanda node not found'); process.exit(1); }

let msg = vanda.parameters.options.systemMessage;

// 1. Replace ETAPA 1 with the new smart client search logic
msg = msg.replace(
  `### ETAPA 1 — Identificação do cliente
- Pergunte: *"Nome do cliente?"*
- Use \`buscarCliente\`. Confirme com o técnico qual é o correto`,
  `### ETAPA 1 — Identificação do cliente
- Pergunte: *"Nome do cliente?"*
- Use \`buscarCliente\` com o nome informado pelo técnico
- O sistema retorna um **status** que você deve interpretar:

  **status: \`single_match\`** — encontrou 1 candidato provável
  → Confirme rapidamente: *"É [nome]? Confirma?"*
  → Se sim: prossiga. Se não: peça mais detalhes

  **status: \`multiple_matches\`** — encontrou vários parecidos
  → Apresente a lista numerada ao técnico: *"Encontrei estes clientes, qual é?"*
  → Aguarde ele responder o número ou o nome

  **status: \`not_found\`** — não encontrou nada
  → Peça UM dado complementar (cidade, endereço, trecho do nome, OS anterior)
  → Faça nova busca com o dado refinado
  → Se ainda não encontrar: **não invente cliente** — informe e pergunte se quer abrir novo cadastro

- **Nunca assuma** que sabe qual é o cliente certo sem confirmação do técnico
- **Nunca invente** um cliente que não existe no sistema`
);

// 2. Update buscarCliente tool description
const buscarClienteNode = w1.nodes.find(n => n.name === 'buscarCliente');
if (buscarClienteNode) {
  buscarClienteNode.parameters.description =
    'Busca cliente no Bom Saldo por nome. Faz busca em camadas (direta + parcial + por token) e retorna resultado com campo "status": single_match (1 candidato provável), multiple_matches (lista para confirmar) ou not_found (não encontrou). Sempre use o "status" para decidir como apresentar o resultado ao técnico.';
  console.log('✅ W1: buscarCliente tool description updated');
}

// 3. Also improve the system rules section if not already updated
if (!msg.includes('single_match')) {
  console.log('⚠️  ETAPA 1 replacement may have failed — check manually');
} else {
  console.log('✅ W1: Vanda ETAPA 1 updated with smart client search logic');
}

vanda.parameters.options.systemMessage = msg;

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('✅ W1 saved');
