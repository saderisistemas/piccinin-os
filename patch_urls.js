const fs = require('fs');
const path = require('path');

// Fix W4
const w4Path = path.join(__dirname, 'workflows', 'W4 - Tool - Buscar Produtos.json');
const w4 = JSON.parse(fs.readFileSync(w4Path, 'utf8'));
const w4Get = w4.nodes.find(n => n.name === 'GET Produtos');
if (w4Get) {
  w4Get.parameters.url = `=https://bomsaldo.com/api/produtos/?nome={{ encodeURIComponent($json.nome || $json.produtos || '') }}`;
}
fs.writeFileSync(w4Path, JSON.stringify(w4, null, 2), 'utf8');

// Fix W5
const w5Path = path.join(__dirname, 'workflows', 'W5 - Tool - Buscar Servicos.json');
const w5 = JSON.parse(fs.readFileSync(w5Path, 'utf8'));
const w5Get = w5.nodes.find(n => n.name === 'GET Servicos');
if (w5Get) {
  w5Get.parameters.url = `=https://bomsaldo.com/api/servicos/?nome={{ encodeURIComponent($json.nome || $json.servicos || '') }}`;
}
fs.writeFileSync(w5Path, JSON.stringify(w5, null, 2), 'utf8');

console.log('OK: urls modified for fallback property checks');
