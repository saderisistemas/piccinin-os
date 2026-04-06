const fs = require('fs');

const w1 = JSON.parse(fs.readFileSync('workflows/W1 - Protek OS - Agente Principal.json'));
const vanda = w1.nodes.find(n => n.name === 'Vanda');
let msg = vanda.parameters.options.systemMessage;

const add = `
6. **RETENÇÃO DO OS_ID (ID DA ORDEM DE SERVIÇO) NA MEMÓRIA**
   - A Ferramenta \`atualizarOS\` DEPENDE de um "ID Interno da API" gigantesco (ex: 456123471). A API Bom Saldo REJEITA E CRASHA se você enviar o código visual da OS de 4 dígitos (ex: "1618"). O erro retornado será "Bad Request / Sem permissão".
   - Ocorreram falhas da IA esquecendo o ID interno gigante gerado pela tool \`criarOS\` até a hora de fechar a OS (tool \`atualizarOS\`).
   - Para evitar isso, SEMPRE que criar uma Ordem de Serviço nova, você **OBRIGATORIAMENTE** deve imprimir o ID Interno na sua mensagem de sucesso para o cliente ver e a janela de contexto ancorar!
   - Escreva literalmente: *"OS #1618 aberta com sucesso! [ID Interno para API: 456123471]"*
   - Na hora de chamar a \`atualizarOS\`, olhe no histórico do chat a sua própria mensagem onde está o "[ID Interno para API...]" e use ESSE número, nunca o 1618. 
`;

if (!msg.includes('RETENÇÃO DO OS_ID')) {
  vanda.parameters.options.systemMessage = msg + add;
  fs.writeFileSync('workflows/W1 - Protek OS - Agente Principal.json', JSON.stringify(w1, null, 2));
  console.log('W1 OS ID Trick Patched');
} else {
  console.log('W1 Já atualizado');
}
