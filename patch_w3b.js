const fs = require('fs');

const path = './workflows/W3b - Tool - Criar OS.json';
const w3b = JSON.parse(fs.readFileSync(path, 'utf8'));

const postNode = w3b.nodes.find(n => n.name === 'POST Criar OS');
if (postNode) {
  // Replace the jsonBody to cast cliente_id and situacao_id to integers
  postNode.parameters.jsonBody = 
    "={{ JSON.stringify({ cliente_id: parseInt($json.cliente_id), situacao_id: parseInt($json.situacao_id) || 6237497, data: $now.format('yyyy-MM-dd'), observacoes: $json.observacoes || 'OS aberta via Assistente Vanda - Piccinin Security', vendedor_id: 906858 }) }}";
  
  fs.writeFileSync(path, JSON.stringify(w3b, null, 2));
  console.log('W3b jsonBody patched:', postNode.parameters.jsonBody.substring(0, 80) + '...');
} else {
  console.log('ERROR: POST Criar OS node not found!');
}
