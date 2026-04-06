const fs = require('fs');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const workflows = [
  { id: "cecf2wY4MQsp4mr8", file: "W1 - Protek OS - Agente Principal.json" },
  { id: "0HxglGmNg0W0JYIs", file: "W7 - Tool - Salvar Evidencias Drive.json" }
];

async function updateWorkflows() {
  for (const wf of workflows) {
    const filePath = `c:/Users/famil/OneDrive/Documentos/Protek OS/workflows/${wf.file}`;
    console.log(`Atualizando workflow ${wf.file} (ID: ${wf.id})...`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const wfConfig = JSON.parse(fileContent);

      const payload = {
        name: wfConfig.name,
        nodes: wfConfig.nodes || [],
        connections: wfConfig.connections || {},
        settings: wfConfig.settings || { executionOrder: "v1" }
      };

      const resp = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/${wf.id}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const body = await resp.text();
      
      if (resp.status >= 200 && resp.status < 300) {
        console.log(`✅ ${wf.file} atualizado com sucesso!`);
      } else {
        console.log(`❌ ERRO (${resp.status}) em ${wf.file}: ${body}`);
      }
    } catch (err) {
      console.log(`❌ EXCEPTION: ${err.message}`);
    }
  }
}

updateWorkflows();
