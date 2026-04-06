const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// 1. Update atualizarOS tool: add tipo_servico parameter
const atualizarOSNode = w1.nodes.find(n => n.name === 'atualizarOS');
if (!atualizarOSNode) { console.error('atualizarOS node not found'); process.exit(1); }

// Add tipo_servico to value map
atualizarOSNode.parameters.workflowInputs.value['tipo_servico'] =
  "={{ $fromAI('tipo_servico', 'Tipo do serviço executado. Quando for atendimento em garantia, SEMPRE enviar o valor exato: Garantia. Quando for manutenção, enviar: Manutenção. Quando for instalação, enviar: Instalação. Outros tipos conforme contexto.', 'string') }}";

// Add tipo_servico to schema
const alreadyHas = atualizarOSNode.parameters.workflowInputs.schema.find(s => s.id === 'tipo_servico');
if (!alreadyHas) {
  atualizarOSNode.parameters.workflowInputs.schema.push({
    id: 'tipo_servico',
    displayName: 'tipo_servico',
    required: false,
    defaultMatch: false,
    display: true,
    canBeUsedToMatch: true,
    type: 'string',
    removed: false
  });
}
console.log('✅ W1: atualizarOS — tipo_servico parameter added');

// 2. Update Vanda system prompt to include tipo_servico in ETAPA 6 and MAPEAMENTO sections
const vandaNode = w1.nodes.find(n => n.name === 'Vanda');
if (!vandaNode) { console.error('Vanda node not found'); process.exit(1); }

let msg = vandaNode.parameters.options.systemMessage;

// Update REGRAS DE GARANTIA to mention tipo_servico
msg = msg.replace(
  '- Registre internamente o contexto: atendimento em garantia',
  '- Registre internamente o contexto: atendimento em garantia\n- Envie `tipo_servico = "Garantia"` no fechamento da OS'
);

// Update ETAPA 6 to mention tipo_servico
msg = msg.replace(
  '- Se SIM: ative a regra de garantia. Não pergunte nada financeiro. Lance itens com valor zero\n- Se NÃO: prossiga normalmente',
  '- Se SIM: ative a regra de garantia. Não pergunte nada financeiro. Lance itens com valor zero. Envie `tipo_servico = "Garantia"`\n- Se NÃO: prossiga normalmente. Identifique o tipo de serviço (ex: Manutenção, Instalação) para enviar em `tipo_servico`'
);

// Update MAPEAMENTO section to include campos extras
msg = msg.replace(
  '## MAPEAMENTO DE CAMPOS NO BOM SALDO\n- **campo `observacoes`**',
  '## MAPEAMENTO DE CAMPOS NO BOM SALDO\n- **campo `tipo_servico`** = tipo do atendimento → "Garantia", "Manutenção", "Instalação", etc. Sempre "Garantia" quando for garantia.\n- **campo `observacoes`**'
);

vandaNode.parameters.options.systemMessage = msg;
console.log('✅ W1: Vanda system prompt updated with tipo_servico instructions');

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('✅ W1 saved');

// Verify
const v = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
const ao = v.nodes.find(n => n.name === 'atualizarOS');
const hasParam = !!ao.parameters.workflowInputs.value.tipo_servico;
const hasSchema = ao.parameters.workflowInputs.schema.some(s => s.id === 'tipo_servico');
const vn = v.nodes.find(n => n.name === 'Vanda');
const hasMsgRef = vn.parameters.options.systemMessage.includes('tipo_servico');
console.log('');
console.log('Verification:');
console.log('  atualizarOS value.tipo_servico:', hasParam);
console.log('  atualizarOS schema.tipo_servico:', hasSchema);
console.log('  Vanda systemMessage mentions tipo_servico:', hasMsgRef);
