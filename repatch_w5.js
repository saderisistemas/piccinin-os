const fs = require('fs');
const path = require('path');

const w5Path = path.join(__dirname, 'workflows', 'W5 - Tool - Buscar Servicos.json');
const w5 = JSON.parse(fs.readFileSync(w5Path, 'utf8'));

// Modificar o GET Servicos para buscar a primeira palavra do termo sem acento.
const w5Get = w5.nodes.find(n => n.name === 'GET Servicos');
if (w5Get) {
  w5Get.parameters.url = `=https://bomsaldo.com/api/servicos/?nome={{ encodeURIComponent(($json.nome || $json.servicos || '').normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").split(' ')[0]) }}`;
}

// O código Fuzzy Local já está ótimo, não precisamos mudar, mas vou garantir que a verificação if (!termo) continua lá.
// Actually, I will explicitly make sure the text tells it to pick properly.

fs.writeFileSync(w5Path, JSON.stringify(w5, null, 2), 'utf8');
console.log('OK: Re-patched W5 to use API search with first word normalized');
