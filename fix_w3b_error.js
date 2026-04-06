const fs = require('fs');
const path = require('path');

const w3bPath = path.join(__dirname, 'workflows', 'W3b - Tool - Criar OS.json');
if (fs.existsSync(w3bPath)) {
  let w3b = JSON.parse(fs.readFileSync(w3bPath, 'utf8'));
  let modified = false;
  w3b.nodes.forEach(n => {
    if (n.name === 'POST Criar OS') {
      n.onError = 'continueRegularOutput'; // Continua no msm fluxo com o JSON de erro
      modified = true;
    }
  });
  if (modified) {
    fs.writeFileSync(w3bPath, JSON.stringify(w3b, null, 2));
    console.log("W3b POST Criar OS onError fix applied!");
  }
}

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
if (fs.existsSync(w1Path)) {
  let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
  let modified = false;
  w1.nodes.forEach(n => {
    if (n.name === 'Vanda' && n.parameters.options && n.parameters.options.systemMessage) {
      if (!n.parameters.options.systemMessage.includes('NUNCA CHUTE UM ID')) {
             n.parameters.options.systemMessage = n.parameters.options.systemMessage.replace(
          '## REGRA 1 — CLIENTE',
          '## REGRA 1 — CLIENTE\n- NUNCA CHUTE OU INVENTE UM ID DE CLIENTE. Se a busca retornar "Nenhum cliente encontrado", AVISE o técnico e NÃO invente números como 57239129.'
        );
        modified = true;
      }
    }
  });
  if (modified) {
    fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
    console.log("W1 Vanda Anti-Hallucination prompt applied!");
  }
}
