const fs = require('fs');

async function updateWorkflow(id, patchFile) {
  const patch = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  const res = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/${id}`, {
    method: 'GET',
    headers: { 'X-N8N-API-KEY': 'piccinin_api_pw' }
  });
  if (!res.ok) throw new Error(`GET failed: ${res.statusText}`);
  const wf = await res.json();
  
  // Apply patch to the nodes array
  patch.forEach(op => {
    if (op.type === 'updateNode') {
      const node = wf.nodes.find(n => n.name === op.nodeName);
      if (node) Object.assign(node.parameters, op.updates.parameters);
    }
  });

  const updateRes = await fetch(`https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows/${id}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': 'piccinin_api_pw', 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes: wf.nodes, connections: wf.connections })
  });
  if (!updateRes.ok) throw new Error(`PUT failed: ${updateRes.statusText}`);
  console.log(`Workflow ${id} updated successfully from ${patchFile}.`);
}

async function main() {
  await updateWorkflow('iJRYEqsLzCVACG0j', 'patch_prod.json');
  await updateWorkflow('Dhp6XByNpzhyVqza', 'patch_serv.json');
}

main().catch(console.error);
