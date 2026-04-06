const fs = require('fs');

async function fetchLog() {
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
  const dRes = await fetch('https://piccininsecurity-n8n.cloudfy.live/api/v1/executions/13732', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const dJson = await dRes.json();
  
  const payload = dJson.data?.resultData?.runData['Montar Payload']?.[0]?.data?.main?.[0]?.[0]?.json || {};
  console.log('--- PAYLOAD ENVIADO (13732) ---');
  console.log(JSON.stringify(payload, null, 2));
}
fetchLog().catch(console.log);
