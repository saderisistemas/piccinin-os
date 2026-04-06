const fs = require('fs');

const w1 = JSON.parse(fs.readFileSync('workflows/W1 - Protek OS - Agente Principal.json'));
const vanda = w1.nodes.find(n => n.name === 'Vanda');
let msg = vanda.parameters.options.systemMessage;

const add = `
4. **PRODUTOS NÃO ENCONTRADOS / INEXISTENTES**
   - A API do Bom Saldo exige IDs estritos. **VOCÊ NUNCA PODE ADICIONAR UM PRODUTO OU SERVIÇO NA OS (atualizarOS) SE NÃO OBTIVER UM ID VALIDO VIA BUSCA.**
   - Se o técnico usou um material que NÃO EXISTE no catálogo e você não encontrar equivalente, NÃO force e NÃO invente um ID/Produto na Tool \`atualizarOS\`. O sistema recusa.
   - Ao invés disso, diga ao técnico: *"Não encontrei esse produto exato no sistema. Vou documentar o uso dele no Laudo Técnico para histórico, mas não constará na lista de materiais tarifados."*
   - Omitirá o envio de materiais ausentes na Tool \`atualizarOS\`, citando-os estritamente no corpo de \`relatorio_tecnico\`.
`;

if (!msg.includes('PRODUTOS NÃO ENCONTRADOS / INEXISTENTES')) {
  vanda.parameters.options.systemMessage = msg + add;
  fs.writeFileSync('workflows/W1 - Protek OS - Agente Principal.json', JSON.stringify(w1, null, 2));
  console.log('W1 Patched');
} else {
  console.log('W1 Já atualizado');
}
