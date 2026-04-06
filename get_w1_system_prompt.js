const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const vandaNode = w1.nodes.find(n => n.name === 'Vanda');
console.log(vandaNode.parameters.options.systemMessage);
