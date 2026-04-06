const fs = require('fs');

const w1Path = './workflows/W1 - Protek OS - Agente Principal.json';
const w1Raw = fs.readFileSync(w1Path, 'utf8');
const w1 = JSON.parse(w1Raw);

function fixFromAI(nodeName, requiredKeys) {
  const t = w1.nodes.find(n => n.name === nodeName);
  if (!t) return;
  const inputs = t.parameters.workflowInputs.value;
  Object.keys(inputs).forEach(k => {
    let expr = inputs[k];
    if (expr.includes('$fromAI')) {
      const isReq = requiredKeys.includes(k);
      // Ensure we haven't already patched it
      if (!expr.includes(', false)') && !expr.includes(', true)')) {
        expr = expr.replace(/', 'string'\)\}$/, `', 'string', ${isReq})}`);
        inputs[k] = expr;
      }
    }
  });
}

// Fix atualizarOS
fixFromAI('atualizarOS', ['os_id']);

// Fix salvarContexto
fixFromAI('salvarContexto', ['conversa_id']);

// Fix the hardcoded ID hallucination
const criarOS = w1.nodes.find(n => n.name === 'criarOS');
if (criarOS) {
  criarOS.parameters.description = criarOS.parameters.description.replace('(ex: 34474811)', '');
}

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
console.log('W1 Patched');
