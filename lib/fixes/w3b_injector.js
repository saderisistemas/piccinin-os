/**
 * lib/fixes/w3b_injector.js
 * Utilitário para ler o payload de W3b, injetar nós e conexões e salvar o JSON.
 */
const fs = require('fs');
const path = require('path');
const { getW3bNodes, getW3bConnections } = require('./w3b_parser');

const runW3bInjection = () => {
  // Ajuste o path para o root dir, uma vez que este script está em `lib/fixes/`
  const w3bPath = path.join(__dirname, '..', '..', 'workflows', 'W3b - Tool - Criar OS.json');
  
  if (!fs.existsSync(w3bPath)) {
    console.error('❌ ERRO: Arquivo W3b JSON não encontrado em', w3bPath);
    return;
  }

  let w3b = JSON.parse(fs.readFileSync(w3bPath, 'utf8'));

  w3b.nodes = getW3bNodes();
  w3b.connections = getW3bConnections();

  fs.writeFileSync(w3bPath, JSON.stringify(w3b, null, 2));

  console.log('✅ W3b reescrito do zero modularmente');
  console.log('   Fluxo: Trigger → Limpar Nome → Resolver Cliente → Validar → POST → Formatar → IF → W11/Retornar');
  console.log('   Fixes:');
  console.log('     - Posições corrigidas (esquerda→direita)');
  console.log('     - Novo nó "Limpar Nome" remove parênteses e limita busca');
  console.log('     - W11 Set OS Ativa agora passa TODOS os inputs (tecnico_id, os_id, acao, etc)');
  console.log('     - Join Saidas removido (desnecessário, simplificado para fluxo direto)');
};

if (require.main === module) {
  runW3bInjection();
}

module.exports = { runW3bInjection };
