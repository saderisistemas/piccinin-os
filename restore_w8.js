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
  const w8Res = await req('GET', '/workflows/cYIrVtfY8qfkwj38');
  if (w8Res.status !== 200) {
     console.log('Error fetching W8:', w8Res.body);
     return;
  }
  let w8 = JSON.parse(w8Res.body);
  
  const fields = [
    { fieldId: 'conversa_id', fieldValue: '={{ $json.conversa_id || null }}' },
    { fieldId: 'tecnico_id', fieldValue: '={{ $json.tecnico_id || null }}' },
    { fieldId: 'tecnico_nome', fieldValue: '={{ $json.tecnico_nome || null }}' },
    { fieldId: 'tecnico_whatsapp', fieldValue: '={{ $json.tecnico_whatsapp || null }}' },
    { fieldId: 'cliente_id', fieldValue: '={{ $json.cliente_id || null }}' },
    { fieldId: 'cliente_nome', fieldValue: '={{ $json.cliente_nome || null }}' },
    { fieldId: 'os_id', fieldValue: '={{ $json.os_id || null }}' },
    { fieldId: 'os_codigo', fieldValue: '={{ $json.os_codigo || null }}' },
    { fieldId: 'em_garantia', fieldValue: '={{ $json.em_garantia !== undefined ? $json.em_garantia : false }}' },
    { fieldId: 'tipo_servico', fieldValue: '={{ $json.tipo_servico || null }}' },
    { fieldId: 'observacoes_orientacao', fieldValue: '={{ $json.observacoes_orientacao || null }}' },
    { fieldId: 'equipamento', fieldValue: '={{ $json.equipamento || null }}' },
    { fieldId: 'marca', fieldValue: '={{ $json.marca || null }}' },
    { fieldId: 'modelo', fieldValue: '={{ $json.modelo || null }}' },
    { fieldId: 'defeito', fieldValue: '={{ $json.defeito || null }}' },
    { fieldId: 'causa', fieldValue: '={{ $json.causa || null }}' },
    { fieldId: 'solucao', fieldValue: '={{ $json.solucao || null }}' },
    { fieldId: 'relatorio_tecnico', fieldValue: '={{ $json.relatorio_tecnico || null }}' },
    { fieldId: 'hora_entrada', fieldValue: '={{ $json.hora_entrada || null }}' },
    { fieldId: 'hora_saida', fieldValue: '={{ $json.hora_saida || null }}' },
    { fieldId: 'link_drive', fieldValue: '={{ $json.link_drive || null }}' },
    { fieldId: 'tipo_pagamento', fieldValue: '={{ $json.tipo_pagamento || null }}' },
    { fieldId: 'forma_pagamento_id', fieldValue: '={{ $json.forma_pagamento_id || null }}' },
    { fieldId: 'fase', fieldValue: '={{ $json.fase || "identificacao" }}' }
  ];

  w8.nodes.forEach(n => {
    if (n.name === 'Insert Contexto') {
      n.parameters = {
        operation: 'create',
        tableId: 'os_buffer',
        fieldsUi: { fieldValues: fields }
      };
      n.onError = 'continueRegularOutput'; 
    }
  });

  const putBody = {
    name: w8.name, nodes: w8.nodes, connections: w8.connections,
    settings: w8.settings?.executionOrder ? { executionOrder: w8.settings.executionOrder } : {},
    staticData: w8.staticData || null
  };
  
  const r = await req('PUT', '/workflows/cYIrVtfY8qfkwj38', putBody);
  console.log('PUT restore W8:', r.status);
  if(r.status === 200) await req('POST', '/workflows/cYIrVtfY8qfkwj38/activate');
})();
