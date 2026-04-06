const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// Fix W11 Get Contexto OS node
const w11Node = w1.nodes.find(n => n.name === 'W11 Get Contexto OS');
if (w11Node) {
  w11Node.parameters.workflowInputs.schema = [
    {
      "id": "tecnico_id",
      "displayName": "tecnico_id",
      "required": false,
      "defaultMatch": false,
      "display": true,
      "type": "string",
      "canBeUsedToMatch": true,
      "removed": false
    },
    {
      "id": "tecnico_nome",
      "displayName": "tecnico_nome",
      "required": false,
      "defaultMatch": false,
      "display": true,
      "type": "string",
      "canBeUsedToMatch": true,
      "removed": false
    },
    {
      "id": "acao",
      "displayName": "acao",
      "required": false,
      "defaultMatch": false,
      "display": true,
      "type": "string",
      "canBeUsedToMatch": true,
      "removed": false
    }
  ];
  fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
  console.log("W11 node schema fixed inside W1.");
} else {
  console.log("W11 node not found in W1.");
}
