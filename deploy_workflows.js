const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = { hostname: HOST, path: urlPath, method, headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' } };
    if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const r = https.request(opts, res => { 
      let d = ''; res.on('data', c => d += c); 
      res.on('end', () => resolve({ status: res.statusCode, data: d }));
    });
    r.on('error', reject); 
    if (bodyStr) r.write(bodyStr); 
    r.end();
  });
}

const workflowsBase = [
  'W2 - Tool - Buscar Cliente.json',
  'W3 - Tool - Buscar OS.json',
  'W3b - Tool - Criar OS.json',
  'W4 - Tool - Buscar Produtos.json',
  'W5 - Tool - Buscar Servicos.json',
  'W6 - Tool - Atualizar OS.json',
  'W7 - Tool - Salvar Evidencias Drive.json',
  'W8 - Tool - Salvar Contexto OS.json',
  'W9 - Tool - Buscar Contexto OS.json',
  'W10 - Tool - Cancelar OS.json'
];

(async () => {
    try {
        console.log('Fetching live workflows...');
        const resp = await req('GET', '/api/v1/workflows');
        const liveWorkflows = JSON.parse(resp.data).data;
        
        const toolIdMap = {};

        // 1) Deploy Tools first
        for (const file of workflowsBase) {
            const localPath = path.join(__dirname, 'workflows', file);
            const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
            const live = liveWorkflows.find(w => w.name === local.name);
            
            // Ensure payload has all properties n8n wants
            const payload = {
                name: local.name,
                nodes: local.nodes,
                connections: local.connections,
                settings: local.settings || { executionOrder: 'v1' },
                staticData: local.staticData || null
            };

            let id;
            if (live) {
                console.log(`Updating ${local.name} (Existing ID: ${live.id})`);
                const updateResp = await req('PUT', `/api/v1/workflows/${live.id}`, payload);
                if (updateResp.status !== 200) console.error(`Failed to update ${local.name}:`, updateResp.data);
                id = live.id;
            } else {
                console.log(`Creating ${local.name}`);
                const createResp = await req('POST', '/api/v1/workflows', payload);
                if (createResp.status >= 200 && createResp.status < 300) {
                    const created = JSON.parse(createResp.data);
                    id = created.id;
                    console.log(`Created ${local.name} with ID: ${id}`);
                } else {
                    console.error(`Failed to create ${local.name}:`, createResp.data);
                }
            }
            
            // Map tool names to IDs
            const toolNameMatch = file.match(/Tool - (.*)\.json/);
            if (toolNameMatch) {
                let toolName = toolNameMatch[1].charAt(0).toLowerCase() + toolNameMatch[1].slice(1).replace(/\s/g, '');
                if (toolName === 'buscarCliente') toolName = 'buscarCliente';
                if (toolName === 'buscarOS') toolName = 'buscarOS';
                if (toolName === 'cancelarOS') toolName = 'cancelarOS';
                if (toolName === 'salvarContextoOS') toolName = 'salvarContexto';
                if (toolName === 'buscarContextoOS') toolName = 'buscarContexto';
                if (toolName === 'salvarEvidenciasDrive') toolName = 'salvarEvidencia';
                if (toolName === 'atualizarOSBomSaldo') toolName = 'atualizarOS';
                if (toolName === 'buscarProdutos') toolName = 'buscarProdutos';
                if (toolName === 'buscarServicos') toolName = 'buscarServicos';
                toolIdMap[toolName] = id;
            }
        }
        
        console.log('Tool ID Map:', toolIdMap);

        // 2) Deploy W1 (Agent)
        const w1_path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
        let w1 = JSON.parse(fs.readFileSync(w1_path, 'utf8'));
        
        w1.nodes.forEach(node => {
            if (node.type === '@n8n/n8n-nodes-langchain.toolWorkflow' && toolIdMap[node.name]) {
                node.parameters.workflowId = { value: toolIdMap[node.name], mode: 'id' };
            }
        });
        
        const liveW1 = liveWorkflows.find(w => w.name === w1.name);
        const w1Payload = {
            name: w1.name,
            nodes: w1.nodes,
            connections: w1.connections,
            settings: w1.settings || { executionOrder: 'v1' },
            staticData: w1.staticData || null
        };

        if (liveW1) {
            const liveInfo = await req('GET', '/api/v1/workflows/' + liveW1.id);
            if (liveInfo.status === 200) {
                const liveNodes = JSON.parse(liveInfo.data).nodes;
                const liveTrigger = liveNodes.find(n => n.name === 'Webhook Chatwoot');
                if (liveTrigger) {
                    console.log('Preserving live Webhook Chatwoot...');
                    w1Payload.nodes = [liveTrigger, ...w1Payload.nodes.filter(n => n.name !== 'Webhook Chatwoot')];
                }
            }
            console.log(`Updating W1: ${liveW1.id}`);
            await req('PUT', '/api/v1/workflows/' + liveW1.id, w1Payload);
        } else {
            console.log('Creating W1');
            await req('POST', '/api/v1/workflows', w1Payload);
        }

        console.log('Deployment Completed Successfully!');
    } catch (e) {
        console.error('Deployment Failed:', e);
    }
})();
