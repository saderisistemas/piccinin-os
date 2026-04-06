const https = require('https');
const url = require('url');
const N8N_API_URL = 'https://piccininsecurity-n8n.cloudfy.live';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const parsedUrl = new url.URL(N8N_API_URL);

function apiReq(path) {
  return new Promise((resolve) => {
    const options = { hostname: parsedUrl.hostname, port: 443, path: '/api/v1' + path, method: 'GET', headers: { 'X-N8N-API-KEY': N8N_API_KEY } };
    https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    }).end();
  });
}

async function check() {
  // Check W3b execution 14377
  const exec = await apiReq('/executions/14377?includeData=true');
  const raw = JSON.stringify(exec);
  
  // Search for "problema"
  let idx = raw.indexOf('problema');
  if (idx > -1) {
    console.log('=== Found "problema" ===');
    console.log(raw.substring(Math.max(0, idx - 200), idx + 300));
  } else {
    console.log('No "problema" found in W3b exec 14377');
  }
  
  // Check W11 execution 14378
  const exec11 = await apiReq('/executions/14378?includeData=true');
  const raw11 = JSON.stringify(exec11);
  
  // Check structure
  console.log('\n=== W3b exec keys ===');
  console.log(Object.keys(exec));
  
  console.log('\n=== W11 exec keys ===');
  console.log(Object.keys(exec11));
  
  // Check for errors in W11
  let idx2 = raw11.indexOf('error');
  if (idx2 > -1) {
    console.log('\n=== W11 "error" context ===');
    console.log(raw11.substring(Math.max(0, idx2 - 100), idx2 + 300));
  }
  
  // Check W11 node outputs
  if (exec11.data && exec11.data.resultData && exec11.data.resultData.runData) {
    console.log('\n=== W11 Node Results ===');
    Object.entries(exec11.data.resultData.runData).forEach(([name, runs]) => {
      const last = runs[runs.length - 1];
      if (last.error) {
        console.log('ERROR in', name, ':', JSON.stringify(last.error).substring(0, 300));
      } else {
        const out = last.data && last.data.main && last.data.main[0] && last.data.main[0][0];
        console.log('OK', name, ':', JSON.stringify(out && out.json).substring(0, 200));
      }
    });
  }
  
  // Also check: Is there a W1 execution that generated the "problema" message?
  const w1execs = await apiReq('/executions?workflowId=fM89qahlNljegd2w&limit=2&status=success');
  console.log('\n=== W1 Recent ===');
  (w1execs.data || []).forEach(e => console.log('ID:', e.id, '| started:', e.startedAt));
  
  // Check W1 latest for the error message
  if (w1execs.data && w1execs.data[0]) {
    const w1exec = await apiReq('/executions/' + w1execs.data[0].id + '?includeData=true');
    const w1raw = JSON.stringify(w1exec);
    let pidx = w1raw.indexOf('problema');
    if (pidx > -1) {
      console.log('\n=== W1 "problema" source ===');
      console.log(w1raw.substring(Math.max(0, pidx - 300), pidx + 200));
    }
  }
}
check();
