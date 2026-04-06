// Testa se o cliente_id realmente existe na API do Bom Saldo
const ACCESS_TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const SECRET_TOKEN = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';

const headers = {
  'access-token': ACCESS_TOKEN,
  'secret-access-token': SECRET_TOKEN,
  'Content-Type': 'application/json'
};

async function testar() {
  // IDs que aparecerem nos logs de erro
  const idsParaTestar = ['18821930', '38821930'];

  for (const id of idsParaTestar) {
    console.log(`\n─── Testando cliente_id: ${id} ───`);
    
    // 1. Tentar buscar cliente por ID direto
    try {
      const r1 = await fetch(`https://bomsaldo.com/api/clientes/${id}`, { headers });
      const b1 = await r1.json();
      console.log(`GET /clientes/${id} → HTTP ${r1.status}`);
      if (b1.data) {
        console.log(`  ✅ CLIENTE EXISTE: ${b1.data.nome || b1.data.razao_social}`);
        console.log(`  ID real: ${b1.data.id}`);
      } else {
        console.log(`  ❌ Resposta: ${JSON.stringify(b1).substring(0, 200)}`);
      }
    } catch(e) {
      console.log(`  ERRO: ${e.message}`);
    }

    // 2. Tentar criar OS com esse ID para ver mensagem exata
    try {
      const r2 = await fetch('https://bomsaldo.com/api/ordens_servicos/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cliente_id: parseInt(id),
          situacao_id: 6237497,
          data_entrada: '2026-03-29',
          observacoes: 'TESTE DE VALIDACAO',
          vendedor_id: 906858
        })
      });
      const b2 = await r2.json();
      console.log(`POST /ordens_servicos/ com cliente_id=${parseInt(id)} → HTTP ${r2.status}`);
      console.log(`  Resposta: ${JSON.stringify(b2).substring(0, 300)}`);
    } catch(e) {
      console.log(`  ERRO POST: ${e.message}`);
    }
  }

  // 3. Buscar clientes reais para ver como os IDs são formatados
  console.log('\n─── Formato real dos IDs no Bom Saldo ───');
  try {
    const r3 = await fetch('https://bomsaldo.com/api/clientes/?limit=3', { headers });
    const b3 = await r3.json();
    const clientes = b3.data || [];
    clientes.forEach(c => {
      console.log(`  ID: ${c.id} (tipo: ${typeof c.id}) | Nome: ${c.nome}`);
    });
  } catch(e) {
    console.log(`  ERRO: ${e.message}`);
  }
}

testar().catch(e => console.error('FATAL:', e.message));
