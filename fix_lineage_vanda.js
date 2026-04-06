const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
let wf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

wf.nodes.forEach(node => {
  if (node.name === 'Vanda') {
    // parameters.text
    if (node.parameters.text) {
      node.parameters.text = node.parameters.text.replace(/\$\('setarInfo'\)\.item\.json/g, "$('setarInfo').first().json");
    }
    
    // parameters.options.systemMessage
    if (node.parameters.options && node.parameters.options.systemMessage) {
      node.parameters.options.systemMessage = node.parameters.options.systemMessage.replace(/\$\('setarInfo'\)\.item\.json/g, "$('setarInfo').first().json");
    }
  }
  
  if (node.name === 'memoriaVanda') {
    if (node.parameters.sessionKey) {
      node.parameters.sessionKey = node.parameters.sessionKey.replace(/\$\('setarInfo'\)\.item\.json/g, "$('setarInfo').first().json");
    }
  }
});

fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
console.log("W1 lineage fixed!");
