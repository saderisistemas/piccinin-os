const fs = require('fs');
const path = require('path');

const w3bPath = path.join(__dirname, 'workflows', 'W3b - Tool - Criar OS.json');
const w3b = JSON.parse(fs.readFileSync(w3bPath, 'utf8'));

const w3bFormat = w3b.nodes.find(n => n.name === 'Formatar Resposta');
if (w3bFormat) {
  w3bFormat.parameters.jsCode = `
const resp = $input.first().json;

if (resp.code === 200 && resp.data) {
  const os = resp.data;
  return [{ json: {
    resultado: \`OS #\${os.codigo} aberta na API com sucesso. IMPORTANTE VANDA: O ID Interno dessa OS no banco é \${os.id}. GUARDE o número \${os.id} NA SUA MEMÓRIA e passe ele sempre que uma ferramenta pedir 'os_id'. NUNCA use \${os.codigo} como os_id.\`,
    os_id: String(os.id),
    os_codigo: String(os.codigo),
    nome_cliente: os.nome_cliente
  } }];
} else {
  const msg = resp.message || resp.error || JSON.stringify(resp.data || resp);
  return [{ json: {
    resultado: \`Erro ao abrir OS: \${msg}\`,
    os_id: null
  } }];
}
`;
}

fs.writeFileSync(w3bPath, JSON.stringify(w3b, null, 2), 'utf8');

console.log('OK: Modificando Formatar Resposta em W3b');
