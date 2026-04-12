const fs = require('fs');
const path = require('path');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

const updates = [
    { file: "W4 - Tool - Buscar Produtos.json", id: "iJRYEqsLzCVACG0j" },
    { file: "W6 - Tool - Atualizar OS.json", id: "hhFMx49xvO5WSxW9" },
    { file: "W8 - Tool - Salvar Contexto OS.json", id: "cYIrVtfY8qfkwj38" },
    { file: "W1 - Protek OS - Agente Principal.json", id: "BZ429y5KhQxWZ76O" }
];

const workflowsPath = path.join(__dirname, "workflows");

async function deployUpdates() {
  console.log("Iniciando deploy de atualizações parciais...");

  for (const item of updates) {
    const filePath = path.join(workflowsPath, item.file);
    try {
      if(!fs.existsSync(filePath)) {
          console.warn(`Arquivo não encontrado para update: ${filePath}`);
          continue;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const wfConfig = JSON.parse(fileContent);

      const payload = {
        name: wfConfig.name,
        nodes: wfConfig.nodes || [],
        connections: wfConfig.connections || {},
        settings: wfConfig.settings || { executionOrder: "v1" }
      };

      const resp = await fetch(`${baseUrl}/${item.id}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const body = await resp.text();
      
      if (resp.status >= 200 && resp.status < 300) {
        console.log(`✅ [Deploy] ${item.file} atualizado! (ID: ${item.id})`);
      } else {
        console.log(`❌ [Erro Deploy] ${item.file} (${resp.status}): ${body}`);
      }
    } catch (err) {
      console.log(`❌ EXCEPTION em ${item.file}: ${err.message}`);
    }
  }
}

deployUpdates();
