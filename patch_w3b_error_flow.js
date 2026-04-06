const fs = require('fs');
const path = require('path');

const w3bPath = path.join(__dirname, 'workflows', 'W3b - Tool - Criar OS.json');
const w3b = JSON.parse(fs.readFileSync(w3bPath, 'utf8'));

const w3bFormat = w3b.nodes.find(n => n.name === 'Formatar Resposta');
if (w3bFormat) {
  w3bFormat.parameters.jsCode = `
const payloadJson = $('Validar Parametros').first().json;
if (payloadJson.error) {
  return [{ json: { resultado: payloadJson.error, os_id: null } }];
}

const resp = $input.first().json;

if (resp.status === 'error' || resp.error || resp.message || (resp.statusCode && resp.statusCode >= 400)) {
  const detalheErro = resp.message || resp.error || JSON.stringify(resp);
  return [{ json: { 
    resultado: \`VANDA, OCORREU UM ERRO FATAL AO SALVAR A OS NA API! ERRO: \${detalheErro}. VERIFIQUE SE VOCÊ MANDOU O CLIENTE_ID CERTO (NUMEROS E NÃO NOME) E TENTE NOVAMENTE.\`, 
    os_id: null 
  } }];
}

if (resp.code === 200 && resp.data) {
  const os = resp.data;
  return [{ json: {
    resultado: \`OS #\${os.codigo} aberta na API com sucesso. IMPORTANTE VANDA: O ID Interno dessa OS no banco é \${os.id}. GUARDE o número \${os.id} NA SUA MEMÓRIA e passe ele sempre que uma ferramenta pedir 'os_id'. NUNCA use \${os.codigo} como os_id.\`,
    os_id: String(os.id),
    os_codigo: String(os.codigo),
    nome_cliente: os.nome_cliente
  } }];
} else {
  return [{ json: {
    resultado: \`Erro desconhecido ao abrir OS: \${JSON.stringify(resp)}\`,
    os_id: null
  } }];
}
`;
}

fs.writeFileSync(w3bPath, JSON.stringify(w3b, null, 2), 'utf8');
console.log('OK: Formatar Resposta atualizado com erro repassado!');
