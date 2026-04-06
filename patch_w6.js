const fs = require('fs');

const w6Path = './workflows/W6 - Tool - Atualizar OS.json';
const w6Raw = fs.readFileSync(w6Path, 'utf8');
const w6 = JSON.parse(w6Raw);

const t = w6.nodes.find(n => n.name === 'Montar Payload');
let jsCode = t.parameters.jsCode;

// Inject date processing right before payload construction
const codeToInject = `
const currentDate = new Date().toISOString().split('T')[0];
if (triggerParams.hora_entrada) {
  let hs = String(triggerParams.hora_entrada).trim();
  if (hs.length === 5) hs += ':00'; // ex: 14:00 -> 14:00:00
  payload.data_entrada = currentDate + ' ' + hs;
}
if (triggerParams.hora_saida) {
  let hs = String(triggerParams.hora_saida).trim();
  if (hs.length === 5) hs += ':00';
  payload.data_saida = currentDate + ' ' + hs;
}
`;

// Insert it right after payload declaration
// The existing code has "const payload = {\n  codigo:..." Let's find it.

if (jsCode.includes('const payload = {') && !jsCode.includes('payload.data_entrada =')) {
  jsCode = jsCode.replace('const payload = {', 'const payload = {');
  // Wait, better to replace `};\n\nlet equipamentosArray`
  jsCode = jsCode.replace('};\n\nlet equipamentosArray', '};\n' + codeToInject + '\nlet equipamentosArray');
  t.parameters.jsCode = jsCode;
  
  fs.writeFileSync(w6Path, JSON.stringify(w6, null, 2));
  console.log('W6 Patched successfully');
} else {
  console.log('W6 Patch skipped: already patched or code not found');
}
