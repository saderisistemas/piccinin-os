const https = require('https');
const url = require('url');

const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";

async function run() {
  const parsedUrl = new url.URL('https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows?limit=100');
  const req = https.get({
    hostname: parsedUrl.hostname,
    port: 443,
    path: '/api/v1/workflows?limit=100',
    headers: { 'X-N8N-API-KEY': apikey }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const json = JSON.parse(body);
      const items = json.data || json.items || [];
      items.forEach(i => console.log(i.id + ' -> ' + i.name));
    });
  });
}
run();
