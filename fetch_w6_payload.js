const fs = require('fs');

async function fetchLog() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  const res = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/executions?limit=20', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const json = await res.json();
  const execs = json.data.filter(e => e.workflowId === 'hhFMx49xvO5WSxW9' && e.status === 'error');
  if (execs.length === 0) return console.log('Sem erros W6');
  
  const dRes = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/executions/${execs[0].id}`, {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const dJson = await dRes.json();
  
  const payload = dJson.data?.resultData?.runData['Montar Payload']?.[0]?.data?.main?.[0]?.[0]?.json || {};
  console.log(JSON.stringify(payload, null, 2));
}
fetchLog().catch(console.log);
