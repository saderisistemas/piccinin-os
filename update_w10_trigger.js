const fs = require('fs');
const path = require('path');

const w10Path = path.join(__dirname, 'workflows', 'W10 - Tool - Cancelar OS.json');
let w10 = JSON.parse(fs.readFileSync(w10Path, 'utf8'));

const trigger = w10.nodes.find(n => n.name === 'Trigger');

trigger.parameters = {
  "workflowInputs": {
    "values": [
      { "name": "os_id" },
      { "name": "motivo" },
      { "name": "tecnico_id" },
      { "name": "tecnico_nome" },
      { "name": "conversa_id" }
    ]
  }
};

fs.writeFileSync(w10Path, JSON.stringify(w10, null, 2));
console.log("W10 Trigger FIXED");
