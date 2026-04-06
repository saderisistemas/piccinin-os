const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, 'workflows');

const filesToFix = [
  'W3b - Tool - Criar OS.json',
  'W6 - Tool - Atualizar OS.json',
  'W10 - Tool - Cancelar OS.json'
];

filesToFix.forEach(file => {
  const filePath = path.join(workflowsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let wf = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;
  
  wf.nodes.forEach(node => {
    // Procura por qualquer node que chame o W11
    if (node.type === 'n8n-nodes-base.executeWorkflow' && node.name.includes('W11')) {
      if (node.parameters && node.parameters.workflowInputs && !node.parameters.workflowInputs.schema) {
        node.parameters.workflowInputs.schema = [
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
          },
          {
            "id": "os_id",
            "displayName": "os_id",
            "required": false,
            "defaultMatch": false,
            "display": true,
            "type": "string",
            "canBeUsedToMatch": true,
            "removed": false
          },
          {
            "id": "os_codigo",
            "displayName": "os_codigo",
            "required": false,
            "defaultMatch": false,
            "display": true,
            "type": "string",
            "canBeUsedToMatch": true,
            "removed": false
          },
          {
            "id": "cliente_id",
            "displayName": "cliente_id",
            "required": false,
            "defaultMatch": false,
            "display": true,
            "type": "string",
            "canBeUsedToMatch": true,
            "removed": false
          },
          {
            "id": "cliente_nome",
            "displayName": "cliente_nome",
            "required": false,
            "defaultMatch": false,
            "display": true,
            "type": "string",
            "canBeUsedToMatch": true,
            "removed": false
          }
        ];
        modified = true;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
    console.log(`Schema injetado para o W11 no arquivo: ${file}`);
  }
});
