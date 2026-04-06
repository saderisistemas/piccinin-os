const fs = require('fs');
const path = require('path');
const { getVandaSystemMessage } = require('./lib/system_messages.js');
const { getW6PayloadCode } = require('./lib/data_transformers.js');

const workflowsDir = path.join(__dirname, 'workflows');

// ─── PATCH W1 ─────────────────────────────────────────────────────────────────
const w1Path = path.join(workflowsDir, 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

w1.name = 'W1 - Piccinin Security OS - Agente Principal';

const vandaNode = w1.nodes.find(n => n.name === 'Vanda');
if (vandaNode) {
  vandaNode.parameters.options.systemMessage = getVandaSystemMessage();
  console.log('✅ W1: Vanda system message updated');
}

const atualizarOSNode = w1.nodes.find(n => n.name === 'atualizarOS');
if (atualizarOSNode) {
  atualizarOSNode.parameters.description =
    'Atualiza OS com dados técnicos e evidências. Em caso de atendimento em garantia, pode ser chamada sem tipo_pagamento (deixar vazio). Somente pergunte sobre pagamento quando NÃO for garantia.';
  if (atualizarOSNode.parameters.workflowInputs && atualizarOSNode.parameters.workflowInputs.schema) {
    const tpField = atualizarOSNode.parameters.workflowInputs.schema.find(s => s.id === 'tipo_pagamento');
    if (tpField) {
      tpField.required = false;
    }
  }
  atualizarOSNode.parameters.workflowInputs.value['hora_entrada'] =
    "={{ $fromAI('hora_entrada', 'Horário de entrada do técnico no atendimento (ex: 14:30)', 'string') }}";
  atualizarOSNode.parameters.workflowInputs.value['hora_saida'] =
    "={{ $fromAI('hora_saida', 'Horário de saída do técnico no atendimento (ex: 16:00)', 'string') }}";
  atualizarOSNode.parameters.workflowInputs.value['em_garantia'] =
    "={{ $fromAI('em_garantia', 'true se for atendimento em garantia, false caso contrário', 'string') }}";
  
  atualizarOSNode.parameters.workflowInputs.schema.push(
    { id: 'hora_entrada', displayName: 'hora_entrada', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false },
    { id: 'hora_saida', displayName: 'hora_saida', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false },
    { id: 'em_garantia', displayName: 'em_garantia', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false }
  );
  console.log('✅ W1: atualizarOS tool updated');
}

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('✅ W1 saved');

// ─── PATCH W6 ─────────────────────────────────────────────────────────────────
const w6Path = path.join(workflowsDir, 'W6 - Tool - Atualizar OS.json');
const w6 = JSON.parse(fs.readFileSync(w6Path, 'utf8'));

w6.name = 'W6 - Tool - Atualizar OS Bom Saldo';

const montarPayloadNode = w6.nodes.find(n => n.name === 'Montar Payload');
if (montarPayloadNode) {
  montarPayloadNode.parameters.jsCode = getW6PayloadCode();
  console.log('✅ W6: Montar Payload updated with warranty logic + correct field mapping');
}

fs.writeFileSync(w6Path, JSON.stringify(w6, null, 2), 'utf8');
console.log('✅ W6 saved');
console.log('\\n🎉 All patches applied successfully!');
