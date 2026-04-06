const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';
const HOST = 'piccininsecurity-n8n.cloudfy.live';

const TARGETS = [
  { id: 'cecf2wY4MQsp4mr8', file: 'W1 - Protek OS - Agente Principal.json',  label: 'W1' },
  { id: '2UfWf7qK0T2P1h2i', file: 'W4 - Tool - Buscar Produtos.json',         label: 'W4' },
  { id: 'OByI7z0D3eQ3yR4V', file: 'W5 - Tool - Buscar Servicos.json',         label: 'W5' },
  { id: 'JzKmL9N1pYxT8s4g', file: 'W6 - Tool - Atualizar OS.json',            label: 'W6' } // Wait, let me check W6 ID. Oh wait, what is the ID of W6?
];

// Let me find the IDs of W4, W5, W6 from the metadata inside the JSON or just list them all
async function findIds() {
  const dir = path.join(__dirname, 'workflows');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const p = path.join(dir, f);
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(`${f} -> ${d.id}`);
  }
}

findIds();
