const fs = require('fs');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

async function testar() {
  const filePath = "c:/Users/famil/OneDrive/Documentos/Protek OS/workflows/W2 - Tool - Buscar Cliente.json";
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const workflow = JSON.parse(fileContent);
    // Para n8n REST API (v1), o JSON geralmente tem que ser apenas o objeto com `name`, `nodes`, `connections` e `settings`.
    // Vamos enviar exatamente isso.
    const payload = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || { executionOrder: "v1" },
      active: false
    };

    console.log("Enviando...");
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const bodyText = await response.text();
    console.log("Status:", response.status);
    console.log("Body:", bodyText);
  } catch (error) {
    console.error("Erro no script:", error);
  }
}

testar();
