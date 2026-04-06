const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const vandaNode = w1.nodes.find(n => n.name === 'Vanda');
let prompt = vandaNode.parameters.options.systemMessage;

let dataHeader = `DADOS DO ATENDIMENTO ATUAL RECENTE (LIDO DA BASE DE DADOS):
{{ JSON.stringify($('W11 Get Contexto OS').first()?.json || {}, null, 2) }}

===== LEIA O JSON ACIMA ATENTAMENTE ANTES DE AGIR =====

`;

// limpar sujidades no prompt text da vanda
vandaNode.parameters.text = "={{ $('setarInfo').item.json.msgLead }}";

if (!prompt.includes("DADOS DO ATENDIMENTO ATUAL")) {
  vandaNode.parameters.options.systemMessage = dataHeader + prompt;
}

// Adjust regule 0 
vandaNode.parameters.options.systemMessage = vandaNode.parameters.options.systemMessage.replace(
  `- Sua PRIMEIRA pergunta SEMPRE é: "Qual o nome do cliente?"`,
  `- Se não houver OS ou cliente no JSON do "DADOS DO ATENDIMENTO ATUAL", SUA PRIMEIRA AÇÃO E PERGUNTA SEMPRE É: "Qual o nome do cliente?". DE OUTRA FORMA, siga de onde parou.`
);

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
console.log("W1 System Prompt Fixed");
