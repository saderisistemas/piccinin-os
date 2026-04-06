const fs = require('fs');


const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const workflows = [
  { id: "u9jabM2Dlah82Qrd", file: "W3 - Tool - Buscar OS.json" },
  { id: "cecf2wY4MQsp4mr8", file: "W1 - Protek OS - Agente Principal.json" }
];

async function updateWorkflows() {
  for (const wf of workflows) {
    const filePath = `c:/Users/famil/OneDrive/Documentos/Protek OS/workflows/${wf.file}`;
    console.log(`Atualizando localmente ${wf.file}...`);
    
    let fileContent = fs.readFileSync(filePath, 'utf8');

    // Make specific replacements for W1
    if (wf.file.includes("W1")) {
      fileContent = fileContent.replace(
        /"os_id": "=\{\{ \$fromAI\('os_id', 'ID da OS no Bom Saldo', 'string'\) \}\}"/g,
        `"os_id": "={{ $fromAI('os_id', 'ID Interno da OS no banco de dados (retornado na busca). Nunca use o numero visual com # (hashtag)', 'string') }}"`
      );
      // For evidence tool which also receives os_codigo (can be the visual one, that's fine for GDrive)
      fs.writeFileSync(filePath, fileContent);
    }

    const wfConfig = JSON.parse(fileContent);

    // Apply the Trigger node fix as before
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
      console.log(`✅ ${wf.file} atualizado com sucesso no N8N!`);
    } else {
      console.log(`❌ ERRO (${resp.status}) em ${wf.file}: ${body}`);
    }
  }
}

updateWorkflows();
