const fs = require('fs');
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";

async function run() {
  const filePath = "c:/Users/famil/OneDrive/Documentos/Protek OS/workflows/W6 - Tool - Atualizar OS.json";
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const wfConfig = JSON.parse(fileContent);

  const payload = {
    name: wfConfig.name,
    nodes: wfConfig.nodes.map(n => {
      if (n.type === "n8n-nodes-base.executeWorkflowTrigger") {
        n.typeVersion = 1;
        delete n.parameters.workflowInputs;
      }
      return n;
    }),
    connections: wfConfig.connections || {},
    settings: wfConfig.settings || { executionOrder: "v1" }
  };


  const resp = await fetch("https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/hhFMx49xvO5WSxW9", {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const body = await resp.text();
  console.log(resp.status >= 200 && resp.status < 300 ? "✅ W6 Atualizado" : "❌ ERRO W6: " + body);
}

run();
