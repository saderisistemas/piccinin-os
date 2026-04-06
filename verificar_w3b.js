const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';

async function verificar() {
  const resp = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/Pbj7zwqjbeHtvodF', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const d = await resp.json();

  const post = d.nodes.find(n => n.name === 'POST Criar OS');
  const jb = post ? post.parameters.jsonBody : null;

  // Verificar se ainda tem aspas nos IDs
  const temAspasClienteId = jb && jb.includes('"{{ $json.cliente_id }}"');
  const temAspasituacaoId = jb && jb.includes('"{{ $json.situacao_id');

  if (temAspasClienteId || temAspasituacaoId) {
    console.log('⚠️  AINDA TEM ASPAS - precisa corrigir');
    console.log(jb);
  } else {
    console.log('✅ jsonBody JÁ ESTÁ CORRETO no n8n!');
    console.log('   cliente_id e situacao_id são inteiros (sem aspas).');
    console.log('\nBody atual no n8n:');
    console.log(jb);
    console.log('\n✅ Correção aplicada com sucesso!');
  }
}

verificar().catch(e => console.error('ERRO:', e.message));
