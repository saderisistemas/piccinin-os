const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const vanda = w1.nodes.find(n => n.name === 'Vanda');
if (vanda) {
  let msg = vanda.parameters.options.systemMessage;
  if (!msg.includes('**ID Interno Gigante vs Código Visual Pequeno**')) {
    msg = msg.replace('3. **Lançamento / Finalização (`atualizarOS`)**',
`3. **ID Interno Gigante vs Código Visual Pequeno**
   - O Bom Saldo tem o código "visual" curtinho da OS (ex: 1613). **MUITO CUIDADO:** A ferramenta atualizarOS não aceita o código pequeno (1613). Se você tentar usar ele, dará "Bad Request / Permissão negada".
   - Você DEVE enviar o 'ID Interno' de 8 a 15 números (ex: 63384371 ou 2047708371207). 
   - Se o técnico pedir para você atualizar a "OS 1613" e você não sabe o ID interno, **nunca tente atualizar direto**. Use primeiro buscarOS, ache a OS 1613 na lista e pegue o ID Interno para poder usar em atualizarOS.

4. **Lançamento / Finalização (\`atualizarOS\`)**`);
    vanda.parameters.options.systemMessage = msg;
    fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
    console.log('OK: Vanda prompt blindado contra os_id visual!');
  } else {
    console.log('OK: Já contém a instrução.');
  }
}
