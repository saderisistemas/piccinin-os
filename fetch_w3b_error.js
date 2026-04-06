const fs = require('fs');

async function fetchLog() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  
  // Fetch recent executions to see what failed
  const res = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/executions?limit=10', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const data = await res.json();
  const w3bExecs = data.data.filter(e => e.workflowId === 'Pbj7zwqjbeHtvodF'); // W3b workflow ID
  
  if (w3bExecs.length === 0) { console.log('Sem execucoes recentes do W3b'); return; }
  
  // Get details of the latest failed one
  const lastFailed = w3bExecs.find(e => e.status === 'error');
  if (!lastFailed) { console.log('Sem erros recentes no W3b'); return; }
  
  const detailRes = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/executions/${lastFailed.id}`, {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const detail = await detailRes.json();
  
  const triggerData = detail.data.resultData.runData['Trigger'];
  console.log('Trigger Input:', JSON.stringify(triggerData?.[0]?.data?.main?.[0]?.[0]?.json || {}));
  
  const valData = detail.data.resultData.runData['Validar Parametros'];
  console.log('Validar Output:', JSON.stringify(valData?.[0]?.data?.main?.[0]?.[0]?.json || {}));
}

fetchLog().catch(console.error);
