const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// ─── 1. Fix criarOS tool: nome_cliente_confirmado must NOT be asked — extracted from context
const criarOSNode = w1.nodes.find(n => n.name === 'criarOS');
if (criarOSNode && criarOSNode.parameters.workflowInputs) {
  criarOSNode.parameters.workflowInputs.value['nome_cliente_confirmado'] =
    "={{ $fromAI('nome_cliente_confirmado', 'Nome do cliente confirmado nesta conversa. NAO pergunte ao tecnico — use o nome que ja foi confirmado anteriormente na conversa. Ex: se o tecnico confirmou opcao 3 da lista e o nome era Associacao Cultural Estancia Jardim, use exatamente esse nome.', 'string') }}";

  criarOSNode.parameters.description =
    'Abre nova OS. Passe: cliente_id (ID do cliente confirmado nesta conversa), nome_cliente_confirmado (nome do cliente ja confirmado — NAO pergunte ao tecnico, extraia do contexto da conversa) e observacoes (motivo do atendimento). O sistema valida internamente. Se OK, abre a OS imediatamente.';

  console.log('OK: criarOS — fromAI description corrigida (nao perguntar ao tecnico)');
}

// ─── 2. Fix the REGRA DE OURO section to be less ambiguous about asking user
const vanda = w1.nodes.find(n => n.name === 'Vanda');
let msg = vanda.parameters.options.systemMessage;

// Fix the checagem obrigatoria section to be about internal check, not asking user
msg = msg.replace(
  '**Checagem obrigatória antes de chamar criarOS ou atualizarOS:**\n1. Tenho o cliente_id do cliente confirmado NESTA conversa? -> Se não: pare\n2. O nome_cliente_confirmado bate com o que o usuário confirmou? -> Se não: pare\n3. O cliente_id que vou enviar é o mesmo da confirmacao? -> Se não: NAO chame a ferramenta\n\nSe qualquer resposta for "nao": NAO abra a OS. Informe ao tecnico e peca nova confirmacao.',
  '**Checagem INTERNA antes de chamar criarOS (nao pergunte ao tecnico):**\n1. Tenho o cliente_id do cliente que foi confirmado nesta conversa? -> Se nao: peca o nome do cliente de novo\n2. Sei o nome do cliente confirmado pelo historico da conversa? -> Use esse nome diretamente\n3. NUNCA peca ao tecnico para "confirmar o nome novamente" se ele ja confirmou\n4. NUNCA entre em loop de confirmacao — uma confirmacao basta'
);

// Also fix ETAPA 2 to be explicit about not asking again
msg = msg.replace(
  '- Se nova: colete o mínimo e use `criarOS`. Passe OBRIGATORIAMENTE:\n  - cliente_id: o ID do cliente confirmado NESTA conversa\n  - nome_cliente_confirmado: o nome exato do cliente confirmado\n  - observacoes: motivo inicial / orientação do serviço\n  - NUNCA chame criarOS sem certeza absoluta do cliente confirmado',
  '- Se nova: use `criarOS` diretamente. Passe:\n  - cliente_id: ID do cliente ja confirmado nesta conversa\n  - nome_cliente_confirmado: nome do cliente confirmado (do historico — NAO pergunte de novo)\n  - observacoes: motivo informado pelo tecnico\n  - Se o tecnico ja confirmou o cliente, abra a OS SEM pedir confirmacao adicional'
);

vanda.parameters.options.systemMessage = msg;

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('OK: W1 salvo');

// Verify
const check = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
const c = check.nodes.find(n => n.name === 'criarOS');
const descOk = c.parameters.description.includes('NAO pergunte');
console.log('Verificacao criarOS description corrigida:', descOk);
