const fs = require('fs');

function applyToLocalJson(workflowFile, patchFile, outFile) {
  const patch = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  const wf = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));

  const nodes = wf.workflow ? wf.workflow.nodes : (wf.nodes || wf);

  patch.forEach(op => {
    if (op.type === 'updateNode') {
      const node = nodes.find(n => n.name === op.nodeName);
      if (node) Object.assign(node.parameters, op.updates.parameters);
    }
  });

  fs.writeFileSync(outFile, JSON.stringify(wf, null, 2), 'utf8');
  console.log(`Updated ${outFile}`);
}

applyToLocalJson('workflow_prod_updated.json', 'patch_prod.json', 'workflow_prod_final.json');
applyToLocalJson('workflow_serv_updated.json', 'patch_serv.json', 'workflow_serv_final.json');
