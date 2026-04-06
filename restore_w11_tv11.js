const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, 'workflows');
const filesToFix = [
  'W1 - Protek OS - Agente Principal.json',
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
    if (node.type === 'n8n-nodes-base.executeWorkflow' && node.name.includes('W11')) {
      node.typeVersion = 1.1; // Restore to 1.1
      node.parameters.workflowId = {
        "__rl": true,
        "value": "kWjI5bVdGdATsuiH",
        "mode": "id"
      };
      
      // Fix workflowInputs structure just in case
      if (node.parameters.workflowInputs && Array.isArray(node.parameters.workflowInputs.schema)) {
         // Keep it fully populated
      }
      
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
    console.log(`Restaurado typeVersion para 1.1 no: ${file}`);
  }
});
