const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'workflows', 'W3b - Tool - Criar OS.json');
const w3b = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const postNode = w3b.nodes.find(n => n.name === 'POST Criar OS');

if (!postNode) {
  console.error('ERRO: Nó "POST Criar OS" não encontrado!');
  process.exit(1);
}

// Corrigir: remover aspas ao redor das variáveis de ID para que sejam enviados como inteiros
// ANTES: "cliente_id": "{{ $json.cliente_id }}"  → string
// DEPOIS: "cliente_id": {{ $json.cliente_id }}    → integer
const jsonBodyCorrigido = `={\n  "cliente_id": {{ $json.cliente_id }},\n  "situacao_id": {{ $json.situacao_id || 6237497 }},\n  "data_entrada": "{{ $now.format('yyyy-MM-dd') }}",\n  "observacoes": "{{ $json.observacoes || 'OS aberta via Assistente Vanda - Piccinin Security' }}",\n  "vendedor_id": 906858\n}`;

const jsonBodyAnterior = postNode.parameters.jsonBody;
console.log('ANTES:', jsonBodyAnterior.substring(0, 120));

postNode.parameters.jsonBody = jsonBodyCorrigido;

console.log('DEPOIS:', postNode.parameters.jsonBody.substring(0, 120));

fs.writeFileSync(filePath, JSON.stringify(w3b, null, 2), 'utf8');
console.log('\n✅ W3b corrigido! cliente_id e situacao_id agora são enviados como inteiros.');
