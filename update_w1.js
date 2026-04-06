const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// Modificar os WIDs e inputs das tools
const tools = {
  'criarOS': 'BZ429y5KhQxWZ76O',
  'atualizarOS': 'hhFMx49xvO5WSxW9', // já estava, mas vamos adicionar tecnico_id
  'salvarContexto': 'cYIrVtfY8qfkwj38',
  'buscarContexto': 'euPVASK7Ycfi6zWk'
};

for (const node of w1.nodes) {
  if (tools[node.name]) {
    node.parameters.workflowId.value = tools[node.name];
    
    const inputs = node.parameters.workflowInputs.value;
    const schema = node.parameters.workflowInputs.schema;
    
    // Todos eles agora precisam de tecnico_id (passado pelo n8n, sem precisar da IA mandar)
    inputs.tecnico_id = "={{ $('setarInfo4').first().json.msg.id_Lead }}";
    
    if (!schema.find(s => s.id === 'tecnico_id')) {
      schema.push({
        id: 'tecnico_id',
        displayName: 'tecnico_id',
        required: false,
        display: true,
        type: 'string'
      });
    }
  }

  // W3b (criarOS) também tem tecnico_nome inserido invisivelmente
  if (node.name === 'criarOS') {
    node.parameters.workflowInputs.value.tecnico_nome = "={{ $('setarInfo4').first().json.msg.nomeLead }}";
    // remover do ask to AI se estava lá
  }
}

// Adicionar o node W11
const VANDA_NODE_ID = "a1b2c3d4-0027-0027-0027-000000000027";
const SETAR_INFO_ID = "a1b2c3d4-0026-0026-0026-000000000026";
const W11_NODE_ID = "w1-w11-get-context";

// Achar Vanda position para posicionar W11
const vandaNode = w1.nodes.find(n => n.id === VANDA_NODE_ID);
const px = vandaNode ? vandaNode.position[0] - 200 : 0;
const py = vandaNode ? vandaNode.position[1] : 0;

// Verificar se o W11 já foi adicionado
if (!w1.nodes.find(n => n.id === W11_NODE_ID)) {
  w1.nodes.push({
    "parameters": {
      "workflowId": {
        "__rl": true,
        "value": "kWjI5bVdGdATsuiH",
        "mode": "id"
      },
      "workflowInputs": {
        "mappingMode": "defineBelow",
        "value": {
          "tecnico_id": "={{ $('setarInfo4').first().json.msg.id_Lead }}",
          "tecnico_nome": "={{ $('setarInfo4').first().json.msg.nomeLead }}",
          "acao": "get_context"
        }
      },
      "options": {}
    },
    "type": "n8n-nodes-base.executeWorkflow",
    "typeVersion": 2,
    "position": [px, py],
    "id": W11_NODE_ID,
    "name": "W11 Get Contexto OS"
  });

  // Re-fazer conexões
  if (w1.connections["setarInfo"] && w1.connections["setarInfo"]["main"][0]) {
    // Aponta setarInfo para W11
    w1.connections["setarInfo"]["main"][0] = [{
      "node": "W11 Get Contexto OS",
      "type": "main",
      "index": 0
    }];
  }
  
  w1.connections["W11 Get Contexto OS"] = {
    "main": [
      [{
        "node": "Vanda",
        "type": "main",
        "index": 0
      }]
    ]
  };
}

// Injetar o contexto no System Message do Vanda
if (vandaNode) {
  let prompt = vandaNode.parameters.text;
  if (!prompt.includes("DADOS DO ATENDIMENTO ATUAL")) {
    vandaNode.parameters.text = `DADOS DO ATENDIMENTO ATUAL:
{{ JSON.stringify($('W11 Get Contexto OS').first()?.json || {}, null, 2) }}

---\n` + prompt;
  }
}

fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
console.log("W1 Tool IDs, connections and system message updated");
