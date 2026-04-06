// Busca clientes para diagnóstico - quem seria o cliente correto?
const ACCESS_TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const SECRET_TOKEN = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';

const headers = {
  'access-token': ACCESS_TOKEN,
  'secret-access-token': SECRET_TOKEN
};

async function buscar(nome) {
  console.log(`\n─── Buscando: "${nome}" ───`);
  const url = `https://bomsaldo.com/api/clientes/?nome=${encodeURIComponent(nome)}&limit=5`;
  const r = await fetch(url, { headers });
  const b = await r.json();
  const clientes = b.data || [];
  if (clientes.length === 0) {
    console.log('  ❌ Nenhum cliente encontrado');
    return;
  }
  clientes.forEach(c => {
    console.log(`  ID: ${c.id} | Nome: ${c.nome} | Razão: ${c.razao_social || '-'}`);
  });
}

async function main() {
  // Nomes que podem aparecer nas OSs de teste
  await buscar('Piccinin');
  await buscar('Portao');
  await buscar('sensor');
  
  // Ver as OSs recentes para pegar um cliente_id válido de referência
  console.log('\n─── OSs recentes (para pegar cliente_id válido) ───');
  const r = await fetch('https://bomsaldo.com/api/ordens_servicos/?limit=5', { headers });
  const b = await r.json();
  const oss = b.data || [];
  oss.forEach(os => {
    console.log(`  OS ID: ${os.id} | Código: ${os.codigo} | cliente_id: ${os.cliente_id} | Cliente: ${os.nome_cliente}`);
  });
}

main().catch(e => console.error('FATAL:', e.message));
