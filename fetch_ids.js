const https = require('https');
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
function req() {
  return new Promise((resolve) => {
    https.request({ hostname: 'piccininsecurity-n8n.cloudfy.live', path: '/api/v1/workflows', method: 'GET', headers: { 'X-N8N-API-KEY': API_KEY } }, res => {
      let d = ''; res.on('data', c => d+=c); res.on('end', () => resolve(JSON.parse(d)));
    }).end();
  });
}
req().then(d => d.data.forEach(w => console.log(w.name, '->', w.id)));
