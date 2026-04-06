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
      if (node.parameters && node.parameters.workflowId) {
        node.parameters.workflowId.mode = "list";
        node.parameters.workflowId.cachedResultName = "W11 - Gerenciador Contexto OS";
        modified = true;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
    console.log(`Fix visual de cache injetado no: ${file}`);
  }
});
