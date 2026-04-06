const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const vanda = w1.nodes.find(n => n.name === 'Vanda');

if (vanda) {
    let msg = vanda.parameters.options.systemMessage;
    
    // Remover injeção antiga caso eu rode múltiplas vezes
    msg = msg.split('## REGRA ESTRITA PARA BUSCA DE PRODUTOS E AMBIGUIDADE')[0];

    // Nova injeção poderosa para Produtos
    const novaRegra = `## REGRA ESTRITA PARA BUSCA DE PRODUTOS E AMBIGUIDADE
A base de produtos e serviços do Bom Saldo foi hiper-padronizada. Aplique a mesma disciplina tática ao adicionar itens:

1. **PRODUTOS DE ALTO VALOR (Câmeras, Centrais, Fontes, DVRs, Baterias, Cabos)**
   - Se o técnico falar "Usei uma câmera" ou "Puxei cabo" de forma genérica, ao chamar o \`buscarProdutos\`, o sistema retornará os modelos oficiais (ex: CÂMERA BULLET, CABO UTP).
   - **SE RETORNAR MAIS DE UMA OPÇÃO, NÃO ADIVINHE! NUNCA ESCOLHA O PRIMEIRO CEGAMENTE.**
   - Apresente uma lista numerada rápida ao técnico: *"Encontrei estas opções no estoque. Digite o número da peça exata que você instalou:"*
     1 - CÂMERA BULLET VHL 1120
     2 - CÂMERA DOME
   - Aguarde o número e só então registre o ID correspondente.

2. **INSUMOS GENÉRICOS (Exceção Silenciosa)**
   - Para materiais básicos (conectores BNC, fita isolante, RJ45, parafusos), não incomode o técnico com perguntas de múltipla escolha. 
   - Escolha o primeiro item genérico compatível na busca (ex: \`CONECTOR BNC\`) e registre silenciosamente na OS.
   - Aplique sempre o bom senso de Field Service para dinamizar o chat.

3. **FILTRO DE LIXO**
   - Se a ferramenta trouxer algum produto ou serviço que comece com \`[INATIVO]\`, ignore-o totalmente. Obscureça isso do técnico.
`;

    vanda.parameters.options.systemMessage = msg.trim() + '\n\n' + novaRegra;
    fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
    console.log("SUCESSO: Prompt da Vanda modificado para tratar ambiguidade e regras genéricas.");
} else {
    console.log("ERRO: Nó Vanda não encontrado no arquivo W1.");
}
