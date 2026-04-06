const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// Update buscarProdutos
const bp = w1.nodes.find(n => n.name === 'buscarProdutos');
if (bp) {
  bp.parameters.workflowInputs = {
    mappingMode: "defineBelow",
    value: {
      "nome": "={{ $fromAI('nome', 'O nome, código ou termo do produto para buscar no catálogo do Bom Saldo. Exemplos: VHL 1120, CÂMERA', 'string') }}"
    },
    matchingColumns: [],
    schema: [
      {
        "id": "nome",
        "displayName": "nome",
        "required": true,
        "defaultMatch": false,
        "display": true,
        "type": "string",
        "canBeUsedToMatch": true,
        "removed": false
      }
    ],
    attemptToConvertTypes: false,
    convertFieldsToString: false
  };
}

// Update buscarServicos
const bs = w1.nodes.find(n => n.name === 'buscarServicos');
if (bs) {
  bs.parameters.workflowInputs = {
    mappingMode: "defineBelow",
    value: {
      "nome": "={{ $fromAI('nome', 'O nome do serviço para buscar no catálogo. Exemplos: Manutenção de câmera', 'string') }}"
    },
    matchingColumns: [],
    schema: [
      {
        "id": "nome",
        "displayName": "nome",
        "required": true,
        "defaultMatch": false,
        "display": true,
        "type": "string",
        "canBeUsedToMatch": true,
        "removed": false
      }
    ],
    attemptToConvertTypes: false,
    convertFieldsToString: false
  };
}

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('OK: updated W1 AI mapping for products & services');
