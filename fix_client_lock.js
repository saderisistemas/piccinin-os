const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const vanda = w1.nodes.find(n => n.name === 'Vanda');
if (!vanda) { console.error('Vanda node not found'); process.exit(1); }

let msg = vanda.parameters.options.systemMessage;

// ─── 1. Add CLIENTE TRAVADO rule section ─────────────────────────────────────
const clienteLockBlock = [
  '',
  '## REGRA DE OURO — CLIENTE TRAVADO NO CONTEXTO',
  'Esta é a regra de MAIOR PRIORIDADE do sistema:',
  '',
  '**Depois que o cliente for confirmado pelo usuário, ele está TRAVADO.**',
  '',
  '- Guarde internamente: nome_confirmado + cliente_id_confirmado',
  '- TODAS as operações seguintes usam SOMENTE o cliente_id confirmado',
  '- NUNCA troque o cliente sem nova confirmação explícita do usuário',
  '- NUNCA cite, sugira ou opere outro cliente na mesma conversa',
  '- NUNCA use um cliente_id de buscas anteriores ou de memória histórica',
  '',
  '**Checagem obrigatória antes de chamar criarOS ou atualizarOS:**',
  '1. Tenho o cliente_id do cliente confirmado NESTA conversa? -> Se não: pare',
  '2. O nome_cliente_confirmado bate com o que o usuário confirmou? -> Se não: pare',
  '3. O cliente_id que vou enviar é o mesmo da confirmacao? -> Se não: NAO chame a ferramenta',
  '',
  'Se qualquer resposta for "nao": NAO abra a OS. Informe ao tecnico e peca nova confirmacao.',
  '',
  '---'
].join('\n');

const insertMarker = '- Perguntas devem ser **curtas e diretas** — evite textos longos\n\n---';

if (!msg.includes('REGRA DE OURO — CLIENTE TRAVADO')) {
  msg = msg.replace(insertMarker, '- Perguntas devem ser **curtas e diretas** — evite textos longos\n\n---\n' + clienteLockBlock);
  console.log('OK: Regra de travamento adicionada');
} else {
  console.log('INFO: Regra de travamento ja existe, pulando');
}

// ─── 2. Update criarOS tool ───────────────────────────────────────────────────
const criarOSNode = w1.nodes.find(n => n.name === 'criarOS');
if (criarOSNode) {
  criarOSNode.parameters.description =
    'Abre nova OS no Bom Saldo. OBRIGATORIO: passar cliente_id E nome_cliente_confirmado do cliente confirmado nesta conversa. O sistema valida se o cliente_id corresponde ao nome antes de criar a OS. Se houver divergencia, a OS NAO sera criada.';

  if (!criarOSNode.parameters.workflowInputs) {
    criarOSNode.parameters.workflowInputs = { schema: [], value: {} };
  }
  criarOSNode.parameters.workflowInputs.value['nome_cliente_confirmado'] =
    "={{ $fromAI('nome_cliente_confirmado', 'OBRIGATORIO: nome EXATO do cliente confirmado pelo usuario nesta conversa. Deve corresponder ao cliente_id enviado. Campo critico de seguranca.', 'string') }}";

  const hasSchema = criarOSNode.parameters.workflowInputs.schema &&
    criarOSNode.parameters.workflowInputs.schema.some(s => s.id === 'nome_cliente_confirmado');
  if (!hasSchema) {
    if (!criarOSNode.parameters.workflowInputs.schema) criarOSNode.parameters.workflowInputs.schema = [];
    criarOSNode.parameters.workflowInputs.schema.push({
      id: 'nome_cliente_confirmado',
      displayName: 'nome_cliente_confirmado',
      required: true,
      defaultMatch: false,
      display: true,
      canBeUsedToMatch: true,
      type: 'string',
      removed: false
    });
  }
  console.log('OK: criarOS — nome_cliente_confirmado adicionado');
}

// ─── 3. Update atualizarOS ────────────────────────────────────────────────────
const atualizarOSNode = w1.nodes.find(n => n.name === 'atualizarOS');
if (atualizarOSNode && atualizarOSNode.parameters.workflowInputs) {
  if (!atualizarOSNode.parameters.workflowInputs.value['nome_cliente_confirmado']) {
    atualizarOSNode.parameters.workflowInputs.value['nome_cliente_confirmado'] =
      "={{ $fromAI('nome_cliente_confirmado', 'Nome do cliente confirmado nesta conversa — validacao de seguranca.', 'string') }}";

    if (atualizarOSNode.parameters.workflowInputs.schema) {
      atualizarOSNode.parameters.workflowInputs.schema.push({
        id: 'nome_cliente_confirmado',
        displayName: 'nome_cliente_confirmado',
        required: false,
        defaultMatch: false,
        display: true,
        canBeUsedToMatch: true,
        type: 'string',
        removed: false
      });
    }
    console.log('OK: atualizarOS — nome_cliente_confirmado adicionado');
  }
}

// ─── 4. Reinforce ETAPA 2 ─────────────────────────────────────────────────────
const oldEtapa2 = '- Se nova: colete o mínimo e use `criarOS`. Passe obrigatoriamente:\n  - `cliente_id`: o ID do cliente **confirmado nesta conversa** (não use IDs de outras buscas)\n  - `nome_cliente_confirmado`: o nome exato do cliente confirmado\n  - `observacoes`: o motivo inicial / orientação do serviço\n  - **NUNCA chame `criarOS` sem ter certeza absoluta do cliente confirmado**';
const oldEtapa2Fallback = '- Se nova: colete o mínimo e use `criarOS`. Informe como `observacoes` o **motivo inicial / orientação do serviço** informada pelo técnico';
const newEtapa2 = '- Se nova: colete o mínimo e use `criarOS`. Passe OBRIGATORIAMENTE:\n  - cliente_id: o ID do cliente confirmado NESTA conversa\n  - nome_cliente_confirmado: o nome exato do cliente confirmado\n  - observacoes: motivo inicial / orientação do serviço\n  - NUNCA chame criarOS sem certeza absoluta do cliente confirmado';

if (msg.includes(oldEtapa2)) {
  msg = msg.replace(oldEtapa2, newEtapa2);
  console.log('OK: ETAPA 2 atualizada (versao nova)');
} else if (msg.includes(oldEtapa2Fallback)) {
  msg = msg.replace(oldEtapa2Fallback, newEtapa2);
  console.log('OK: ETAPA 2 atualizada (versao fallback)');
} else {
  console.log('AVISO: ETAPA 2 nao encontrada para substituir — verifique manualmente');
}

vanda.parameters.options.systemMessage = msg;

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('OK: W1 salvo');

// ─── Verification ─────────────────────────────────────────────────────────────
const check = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
const vCheck = check.nodes.find(n => n.name === 'Vanda');
const cCheck = check.nodes.find(n => n.name === 'criarOS');
console.log('\nVerificacao:');
console.log('  Regra TRAVADO no prompt:', vCheck.parameters.options.systemMessage.includes('TRAVADO'));
console.log('  criarOS nome_cliente_confirmado:', !!cCheck?.parameters?.workflowInputs?.value?.nome_cliente_confirmado);
