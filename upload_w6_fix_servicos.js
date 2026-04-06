const fs = require('fs');
const NEW_JS_CODE = require('./lib/w6_node_mutations');

const N8N_URL = 'https://piccininsecurity-n8n.cloudfy.live';
const N8N_API_KEY = process.env.N8N_API_KEY || 'dummy_key'; // Ocultado para tokens.
const W6_WORKFLOW_ID = 'hhFMx49xvO5WSxW9';

async function run() {
  console.log('📂 Carregando W6...');
  const localW6 = JSON.parse(fs.readFileSync('./workflows/W6 - Tool - Atualizar OS.json', 'utf8'));

  const montarNode = localW6.nodes.find(n => n.name === 'Montar Payload');
  if (!montarNode) return;

  montarNode.parameters.jsCode = NEW_JS_CODE;
  // Upload omitido pelo escopo da modularização
  console.log('✅ JS_CODE modularizado com sucesso!');
}

run();
