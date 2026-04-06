const fs = require('fs');

const w1 = JSON.parse(fs.readFileSync('workflows/W1 - Protek OS - Agente Principal.json'));
const vanda = w1.nodes.find(n => n.name === 'Vanda');
let msg = vanda.parameters.options.systemMessage;

const add = `
5. **RETENÇÃO DO CLIENTE_ID NA MEMÓRIA**
   - Ocorreram falhas do robô esquecendo o cliente_id depois que o usuário confirma a busca e pede para abrir a OS.
   - Para NUNCA MAIS perder o \`cliente_id\` entre as mensagens de confirmação, quando você retornar o cliente encontrado para o técnico, você OBRIGATORIAMENTE deve estampar o ID dele no final do seu texto.
   - Escreva literalmente: *"Achei o cliente X. Confirma? [ID do sistema: 34476405]"*
   - Esse marcador numérico na sua própria mensagem forçará sua janela de contexto a "lembrar" o número na rodada seguinte, quando for chamar a tool \`criarOS\`. Caso contrário, você falhará no atendimento.
`;

if (!msg.includes('RETENÇÃO DO CLIENTE_ID NA MEMÓRIA')) {
  vanda.parameters.options.systemMessage = msg + add;
  fs.writeFileSync('workflows/W1 - Protek OS - Agente Principal.json', JSON.stringify(w1, null, 2));
  console.log('W1 Memory Trick Patched');
} else {
  console.log('W1 Já atualizado');
}
