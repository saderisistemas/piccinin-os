const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const atualizarOS = w1.nodes.find(n => n.name === 'atualizarOS');
if (atualizarOS) {
  // Update os_id description
  const inputs = atualizarOS.parameters.workflowInputs.value;
  inputs['os_id'] = `={{ $fromAI('os_id', 'O campo numérico os_id exato retornado quando a OS foi criada (criarOS) ou buscada. NUNCA envie branco e NUNCA envie o código visual com #', 'string') }}`;
  
  // Make sure she formats the pagamentos properly.
  // Actually, Vanda doesn't format it, W6 handles 'Faturar no escritorio' text correctly if passed as tipo_pagamento.
  
  const schema = atualizarOS.parameters.workflowInputs.schema;
  const osIdSchema = schema.find(s => s.id === 'os_id');
  if (osIdSchema) osIdSchema.type = 'string';
}

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('OK: os_id description updated');
