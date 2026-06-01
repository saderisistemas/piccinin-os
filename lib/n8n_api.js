/**
 * lib/n8n_api.js
 * UtilitÃ¡rios para gerenciar workflows no n8n via API.
 */

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDk5ZTk3MGQtYjUxOC00NWRjLWFlZjQtZTZlMDIxNmJhN2M3IiwiaWF0IjoxNzc3NjQ1MTAwfQ.XHD48AMIioMUropIl_JEzzvClChKo5VP9YgL6l_PaxI';
const BASE_URL = 'https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows';

function cleanSettings(s) {
  // A API sÃ³ aceita executionOrder no settings em versÃµes especÃ­ficas
  if (!s) return { executionOrder: 'v1' };
  return { executionOrder: s.executionOrder || 'v1' };
}

async function getWorkflow(id) {
  const r = await fetch(`${BASE_URL}/${id}`, {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  if (!r.ok) throw new Error(`Erro ao buscar workflow ${id}: ${r.status}`);
  return r.json();
}

async function putWorkflow(id, wf) {
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: cleanSettings(wf.settings)
  };
  const r = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await r.text();
  return { ok: r.status >= 200 && r.status < 300, status: r.status, body };
}

module.exports = {
  getWorkflow,
  putWorkflow,
  cleanSettings
};
