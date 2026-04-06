const fs = require('fs');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const workflowId = "Pbj7zwqjbeHtvodF"; // W3b - Tool - Criar OS Bom Saldo
const baseUrl = `https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/${workflowId}`;

const filePath = "c:/Users/famil/OneDrive/Documentos/Protek OS/workflows/W3b - Tool - Criar OS.json";

async function atualizarW3b() {
  console.log(`Atualizando workflow W3b (ID: ${workflowId})...`);
  console.log(`Correção: cliente_id e situacao_id agora enviados como INTEIROS (sem aspas)\n`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const wfConfig = JSON.parse(fileContent);

    const payload = {
      name: wfConfig.name,
      nodes: wfConfig.nodes || [],
      connections: wfConfig.connections || {},
      settings: wfConfig.settings || { executionOrder: "v1" }
    };

    const resp = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await resp.text();
    
    if (resp.status >= 200 && resp.status < 300) {
      console.log(`✅ W3b atualizado com sucesso! (HTTP ${resp.status})`);
      console.log(`   → cliente_id agora é enviado como integer à API do Bom Saldo`);
    } else {
      console.log(`❌ ERRO (${resp.status}): ${body}`);
    }
  } catch (err) {
    console.log(`❌ EXCEPTION: ${err.message}`);
  }
}

atualizarW3b();
