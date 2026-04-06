const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// ─── 1. Remove nome_cliente_confirmado from criarOS ───────────────────────────
const criarOS = w1.nodes.find(n => n.name === 'criarOS');
if (criarOS && criarOS.parameters.workflowInputs) {
  delete criarOS.parameters.workflowInputs.value['nome_cliente_confirmado'];
  criarOS.parameters.workflowInputs.schema = (criarOS.parameters.workflowInputs.schema || [])
    .filter(s => s.id !== 'nome_cliente_confirmado');
  criarOS.parameters.description =
    'Abre nova OS no Bom Saldo. Passe: cliente_id (ID numerico do cliente confirmado — vem do buscarCliente) e observacoes (motivo do atendimento). Nada mais e necessario.';
  console.log('OK: criarOS — nome_cliente_confirmado REMOVIDO');
}

// ─── 2. Remove nome_cliente_confirmado from atualizarOS ───────────────────────
const atualizarOS = w1.nodes.find(n => n.name === 'atualizarOS');
if (atualizarOS && atualizarOS.parameters.workflowInputs) {
  delete atualizarOS.parameters.workflowInputs.value['nome_cliente_confirmado'];
  atualizarOS.parameters.workflowInputs.schema = (atualizarOS.parameters.workflowInputs.schema || [])
    .filter(s => s.id !== 'nome_cliente_confirmado');
  console.log('OK: atualizarOS — nome_cliente_confirmado REMOVIDO');
}

// ─── 3. Simplify the REGRA DE OURO section ─────────────────────────────────
const vanda = w1.nodes.find(n => n.name === 'Vanda');
let msg = vanda.parameters.options.systemMessage;

// Replace the checagem section with a simpler version
msg = msg.replace(
  '**Checagem INTERNA antes de chamar criarOS (nao pergunte ao tecnico):**\n1. Tenho o cliente_id do cliente que foi confirmado nesta conversa? -> Se nao: peca o nome do cliente de novo\n2. Sei o nome do cliente confirmado pelo historico da conversa? -> Use esse nome diretamente\n3. NUNCA peca ao tecnico para "confirmar o nome novamente" se ele ja confirmou\n4. NUNCA entre em loop de confirmacao — uma confirmacao basta',
  'Regra simples:\n- O tecnico confirma o cliente UMA VEZ. Guarde o cliente_id.\n- Use esse cliente_id em todas as chamadas (criarOS, atualizarOS).\n- NAO peca confirmacao do nome novamente. UMA confirmacao basta.\n- Se nao tiver o cliente_id, peca apenas o NOME do cliente para buscar de novo.'
);

// Fix ETAPA 2 to be ultra-simple
msg = msg.replace(
  '- Se nova: use `criarOS` diretamente. Passe:\n  - cliente_id: ID do cliente ja confirmado nesta conversa\n  - nome_cliente_confirmado: nome do cliente confirmado (do historico — NAO pergunte de novo)\n  - observacoes: motivo informado pelo tecnico\n  - Se o tecnico ja confirmou o cliente, abra a OS SEM pedir confirmacao adicional',
  '- Se nova: chame `criarOS` passando cliente_id e observacoes. Pronto. Nao peca mais nada.'
);

vanda.parameters.options.systemMessage = msg;
fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('OK: W1 salvo');

// Verify
const c2 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
const cr = c2.nodes.find(n => n.name === 'criarOS');
const hasNCC = !!cr?.parameters?.workflowInputs?.value?.nome_cliente_confirmado;
console.log('criarOS tem nome_cliente_confirmado:', hasNCC, '(deve ser false)');
