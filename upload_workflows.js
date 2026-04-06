const fs = require('fs');
const path = require('path');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

const workflows = [
    "W2 - Tool - Buscar Cliente.json",
    "W3 - Tool - Buscar OS.json",
    "W3b - Tool - Criar OS.json",
    "W4 - Tool - Buscar Produtos.json",
    "W5 - Tool - Buscar Servicos.json",
    "W6 - Tool - Atualizar OS.json",
    "W7 - Tool - Salvar Evidencias Drive.json",
    "W1 - Protek OS - Agente Principal.json"
];

const workflowsPath = "c:/Users/famil/OneDrive/Documentos/Protek OS/workflows";
const nameToId = {};

async function uploadAll() {
  console.log("Iniciando upload para o n8n...");

  for (const wfFile of workflows) {
    const filePath = path.join(workflowsPath, wfFile);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const wfConfig = JSON.parse(fileContent);

      // Limpar o payload para a API
      const payload = {
        name: wfConfig.name,
        nodes: wfConfig.nodes || [],
        connections: wfConfig.connections || {},
        settings: wfConfig.settings || { executionOrder: "v1" }
      };

      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const body = await resp.text();
      
      if (resp.status >= 200 && resp.status < 300) {
        const data = JSON.parse(body);
        console.log(`✅ ${wfFile} -> ID: ${data.id}`);
        nameToId[wfConfig.name] = data.id;
      } else {
        console.log(`❌ ERRO em ${wfFile} (${resp.status}): ${body}`);
      }
    } catch (err) {
      console.log(`❌ EXCEPTION em ${wfFile}: ${err.message}`);
    }
  }
}

uploadAll();
