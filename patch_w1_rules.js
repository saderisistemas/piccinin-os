const fs = require('fs');
const w1Path = './workflows/W1 - Protek OS - Agente Principal.json';
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const t = w1.nodes.find(n => n.name === 'Vanda');
let prompt = t.parameters.options.systemMessage;

prompt = prompt.replace(
  '2. Peça fotos se necessário (use `salvarEvidencia`).',
  '2. SEMPRE peça para o técnico enviar foto do serviço finalizado. Se ele enviar, chame a tool `salvarEvidencia`. A foto não é obrigatória para fechar, mas você deve SEMPRE pedir se ele tem uma ou pode tirar.'
);

prompt = prompt.replace(
  '2. Chame `atualizarOS`. Garantia? valor=0.',
  '2. ANTES de atualizar, pergunte se o serviço foi em Garantia ou Cobrado.\n3. Escreva o `relatorio_tecnico` e o `laudo` de forma profissional, rica e densa para impressionar o cliente lendo a OS depois. NUNCA copie a frase informal do técnico.\n4. Chame `atualizarOS`.'
);

prompt = prompt.replace(
  '3. Sucesso? `salvarContexto` com `fase: fechado`.',
  '5. Sucesso? `salvarContexto` com `fase: fechado`.'
);

t.parameters.options.systemMessage = prompt;

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
console.log('W1 Prompt patched');
