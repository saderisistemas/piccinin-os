const https = require('https');
const url = require('url');
const N8N_API_URL = 'https://piccininsecurity-n8n.cloudfy.live';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const parsedUrl = new url.URL(N8N_API_URL);

async function req(method, path, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: parsedUrl.hostname, port: 443,
      path: '/api/v1' + path, method,
      headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': N8N_API_KEY }
    };
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

(async () => {
  const w6Res = await req('GET', '/workflows/hhFMx49xvO5WSxW9');
  if (w6Res.status !== 200) {
     console.log('Error fetching W6:', w6Res.body);
     return;
  }
  let w6 = JSON.parse(w6Res.body);
  
  // Create IF node
  const ifNode = {
    parameters: {
      conditions: {
        string: [
          {
            value1: "={{ $json.error }}",
            operation: "isEmpty"
          }
        ]
      }
    },
    type: "n8n-nodes-base.if",
    typeVersion: 1,
    position: [632, 400],
    id: "w6-node-valida-erro",
    name: "IF Sem Erro"
  };

  // Add the IF node if not already present
  if (!w6.nodes.find(n => n.name === 'IF Sem Erro')) {
    w6.nodes.push(ifNode);
  }

  // Rewrite connections to route through the IF node
  
  // 1. Remove connection from "Montar Payload"
  delete w6.connections['Montar Payload'];

  // 2. Add connection from "Montar Payload" to "IF Sem Erro"
  w6.connections['Montar Payload'] = {
    main: [
      [
        {
          node: "IF Sem Erro",
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // 3. Set connections for "IF Sem Erro"
  // True branch [0] -> PUT Atualizar OS
  // False branch [1] -> Formatar Resposta
  w6.connections['IF Sem Erro'] = {
    main: [
      [
        {
          node: "PUT Atualizar OS",
          type: "main",
          index: 0
        }
      ],
      [
        {
          node: "Formatar Resposta",
          type: "main",
          index: 0
        }
      ]
    ]
  };

  const putBody = {
    name: w6.name, nodes: w6.nodes, connections: w6.connections,
    settings: w6.settings?.executionOrder ? { executionOrder: w6.settings.executionOrder } : {},
    staticData: w6.staticData || null
  };
  
  const r = await req('PUT', '/workflows/hhFMx49xvO5WSxW9', putBody);
  console.log('PUT fix W6:', r.status);
  
  if (r.status !== 200) {
      console.log('Error Body:', r.body);
  }

  if(r.status === 200) await req('POST', '/workflows/hhFMx49xvO5WSxW9/activate');
})();
