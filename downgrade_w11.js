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
      node.typeVersion = 1;
      if (typeof node.parameters.workflowId === 'object' && node.parameters.workflowId.value) {
        node.parameters.workflowId = node.parameters.workflowId.value;
      }
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
    console.log(`Downgrade executeWorkflow typeVersion no: ${file}`);
  }
});
