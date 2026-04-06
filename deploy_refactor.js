/**
 * deploy_refactor.js
 * Faz o deploy de W4, W5 e W11 refatorados no n8n via API.
 * 
 * Uso: node deploy_refactor.js [filtro]
 *   ex: node deploy_refactor.js W4
 * 
 * Workflows mapeados por ID:
 *   W4 → iJRYEqsLzCVACG0j
 *   W5 → Dhp6XByNpzhyVqza
 *   W11 → kWjI5bVdGdATsuiH
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const url = require('url');

// ── Configuração ────────────────────────────────────────────────────
const N8N_API_URL = (process.env.N8N_API_URL || 'https://piccininsecurity-n8n.cloudfy.live').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY';

const WORKFLOWS_DIR = path.join(__dirname, 'workflows');

const DEPLOY_MAP = [
  { file: 'W1 - Protek OS - Agente Principal.json',  id: 'fM89qahlNljegd2w',  label: 'W1 Agente Principal' },
  { file: 'W3b - Tool - Criar OS.json',              id: 'BZ429y5KhQxWZ76O',  label: 'W3b Criar OS' },
  { file: 'W4 - Tool - Buscar Produtos.json',       id: 'iJRYEqsLzCVACG0j', label: 'W4 Buscar Produtos' },
  { file: 'W5 - Tool - Buscar Servicos.json',        id: 'Dhp6XByNpzhyVqza', label: 'W5 Buscar Serviços' },
  { file: 'W6 - Tool - Atualizar OS.json',           id: 'hhFMx49xvO5WSxW9',  label: 'W6 Atualizar OS' },
  { file: 'W8 - Tool - Salvar Contexto OS.json',     id: 'cYIrVtfY8qfkwj38',  label: 'W8 Salvar Contexto' },
  { file: 'W9 - Tool - Buscar Contexto OS.json',     id: 'euPVASK7Ycfi6zWk',  label: 'W9 Buscar Contexto' },
  { file: 'W10 - Tool - Cancelar OS.json',           id: 'wNgtnqLZ6S09QRlF', label: 'W10 Cancelar OS' },
  { file: 'W11 - Gerenciador Contexto OS.json',      id: 'kWjI5bVdGdATsuiH', label: 'W11 Gerenciador Contexto OS' },
];

// ── HTTP helper ─────────────────────────────────────────────────────
function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new url.URL(N8N_API_URL);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: `/api/v1${endpoint}`,
      method,
      headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': N8N_API_KEY },
    };
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const proto = parsedUrl.protocol === 'https:' ? https : http;
    const req = proto.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Deploy function ─────────────────────────────────────────────────
async function deployWorkflow({ file, id, label }) {
  const filePath = path.join(WORKFLOWS_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ Arquivo não encontrado: ${filePath}`);
    return false;
  }

  const local = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`\n🔄 Deployando: ${label} (ID: ${id})`);

  try {
    // 1. Buscar workflow existente no n8n (precisamos do versionId)
    const getRes = await apiRequest('GET', `/workflows/${id}`);

    let putBody;
    if (getRes.status === 200) {
      const existing = getRes.body;
      // A API v1 rejeita campos extras em settings (binaryMode, availableInMCP, etc.)
      // Só passamos executionOrder que é o campo seguro
      const safeSettings = {};
      const srcSettings = existing.settings || {};
      if (srcSettings.executionOrder) safeSettings.executionOrder = srcSettings.executionOrder;

      putBody = {
        name:        local.name || existing.name,
        nodes:       local.nodes,
        connections: local.connections,
        settings:    safeSettings,
        staticData:  existing.staticData || null,
      };
    } else {
      // Workflow não existe – criar via POST
      console.log(`  ⚠ Workflow não encontrado (${getRes.status}), tentando criar via POST...`);
      const createBody = {
        name:        local.name,
        nodes:       local.nodes,
        connections: local.connections,
        settings:    local.settings || {},
      };
      const createRes = await apiRequest('POST', '/workflows', createBody);
      if (createRes.status === 200 || createRes.status === 201) {
        const newId = createRes.body.id;
        console.log(`  ✅ Criado com ID: ${newId}`);
        console.log(`  ⚠ ATENÇÃO: Atualize DEPLOY_MAP com o novo ID: ${newId}`);
        // Ativar
        await apiRequest('POST', `/workflows/${newId}/activate`);
        return true;
      } else {
        console.error(`  ✗ Erro ao criar: ${JSON.stringify(createRes.body)}`);
        return false;
      }
    }

    // 2. PUT para atualizar
    const putRes = await apiRequest('PUT', `/workflows/${id}`, putBody);
    if (putRes.status === 200) {
      console.log(`  ✅ Nodes e connections atualizados`);
      // 3. Ativar
      const actRes = await apiRequest('POST', `/workflows/${id}/activate`);
      if (actRes.status === 200) console.log(`  ✅ Workflow ativado`);
      else console.log(`  ⚠ Status ativação: ${actRes.status}`);
      return true;
    } else {
      console.error(`  ✗ PUT falhou ${putRes.status}: ${JSON.stringify(putRes.body)}`);
      return false;
    }

  } catch (err) {
    console.error(`  ✗ Exceção: ${err.message}`);
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log(' Protek OS — Deploy Refactor (W4, W5, W11)');
  console.log('═══════════════════════════════════════════════');
  console.log(`📡 n8n: ${N8N_API_URL}`);

  const filtro = process.argv[2]?.toLowerCase();
  const lista = filtro
    ? DEPLOY_MAP.filter(w => w.label.toLowerCase().includes(filtro))
    : DEPLOY_MAP;

  if (lista.length === 0) {
    console.error(`Nenhum workflow encontrado para filtro: ${filtro}`);
    process.exit(1);
  }

  let ok = 0, fail = 0;
  for (const wf of lista) {
    const success = await deployWorkflow(wf);
    success ? ok++ : fail++;
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`✅ Sucesso: ${ok} | ✗ Falha: ${fail}`);
  console.log('═══════════════════════════════════════════════');
  if (fail > 0) process.exit(1);
}

main().catch(console.error);
