const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
let modified = false;

w1.nodes.forEach(node => {
  if (node.name === 'criarOS' && node.parameters.workflowInputs) {
    const val = node.parameters.workflowInputs.value;
    
    // Fix cliente_id description — remove the misleading example number
    val.cliente_id = "={{ $fromAI('cliente_id', 'OBRIGATORIO: O ID numerico do cliente retornado pela tool buscarCliente. Pegue o valor do campo cliente_id ou id do JSON de resposta do buscarCliente. NUNCA invente ou use um numero memorizado. Se nao chamou buscarCliente nessa conversa, nao chame criarOS.', 'string') }}";
    
    // Fix situacao_id — was already fine but clarify
    val.situacao_id = "={{ $fromAI('situacao_id', 'ID da situacao. Sempre use 6237497 (Aguardando Atendimento) a menos que o tecnico peça outro.', 'string') }}";
    
    // Fix observacoes — align per tech context
    val.observacoes = "={{ $fromAI('observacoes', 'Descricao inicial do atendimento relatado pelo tecnico. Escreva em portugues.', 'string') }}";
    
    node.parameters.workflowInputs.value = val;
    
    // Fix the description too
    node.parameters.description = `Abre nova OS no Bom Saldo. 
REGRAS CRITICAS:
1. Voce DEVE ter chamado 'buscarCliente' NESTA CONVERSA antes de chamar esta tool.
2. O cliente_id DEVE ser o valor do campo 'cliente_id' retornado pelo buscarCliente. NAO use IDs de memoria, contexto anterior ou inventados.
3. Se nao tem cliente_id fresco do buscarCliente, NAO CHAME ESTA TOOL. Pergunte o nome do cliente primeiro.`;
    
    modified = true;
    console.log('criarOS tool fixed!');
  }
  
  if (node.name === 'buscarCliente' && node.parameters.workflowInputs) {
    // Make sure buscarCliente description is crystal clear
    node.parameters.description = `Busca cliente no Bom Saldo pelo nome. Use SEMPRE antes de criarOS.
Retorna: cliente_id (numero), cliente_nome, e lista de clientes para confirmacao.
IMPORTANTE: O 'cliente_id' retornado aqui e o unico ID valido para usar no criarOS.`;
    modified = true;
    console.log('buscarCliente tool description fixed!');
  }
  
  if (node.name === 'Vanda' && node.parameters.options && node.parameters.options.systemMessage) {
    // Fix the system message to be crystal clear on ID usage
    let sm = node.parameters.options.systemMessage;
    
    // Replace the REGRA 1 section with a cleaner version
    sm = sm.replace(
      /## REGRA 1 — CLIENTE[\s\S]*?## REGRA 2/,
      `## REGRA 1 — CLIENTE
1. Pergunte o NOME do cliente.
2. Chame \`buscarCliente\` com o nome digitado pelo técnico.
3. O retorno do buscarCliente contém o campo \`cliente_id\` — ESTE é o único ID válido.
4. Técnico confirma o cliente? Use EXATAMENTE o \`cliente_id\` que veio do retorno do buscarCliente. Nunca altere esse número.
5. Chame \`salvarContexto\` com o \`cliente_id\` e \`cliente_nome\` confirmados.

⛔ PROIBIÇÃO ABSOLUTA: Jamais use um cliente_id que não veio do retorno de um buscarCliente nesta conversa. Se tiver dúvida, chame buscarCliente de novo.

## REGRA 2`
    );
    
    node.parameters.options.systemMessage = sm;
    modified = true;
    console.log('Vanda system message REGRA 1 fixed!');
  }
});

if (modified) {
  fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
  console.log('W1 saved!');
} else {
  console.log('Nothing to modify!');
}
