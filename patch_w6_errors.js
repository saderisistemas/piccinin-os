const fs = require('fs');
const path = require('path');

const w6Path = path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json');
const w6 = JSON.parse(fs.readFileSync(w6Path, 'utf8'));

// Modificar GET OS Atual
const w6Get = w6.nodes.find(n => n.name === 'GET OS Atual');
if (w6Get) {
  w6Get.parameters.url = `=https://bomsaldo.com/api/ordens_servicos/{{ String($json.os_id || '').replace(/[^0-9]/g, '') }}/`;
  w6Get.parameters.options = { ...w6Get.parameters.options, ignoreResponseCode: true };
}

// Modificar PUT Atualizar OS
const w6Put = w6.nodes.find(n => n.name === 'PUT Atualizar OS');
if (w6Put) {
  w6Put.parameters.url = `=https://bomsaldo.com/api/ordens_servicos/{{ String($json.os_id || '').replace(/[^0-9]/g, '') }}/`;
  w6Put.parameters.options = { ...w6Put.parameters.options, ignoreResponseCode: true };
}

// Modificar o nó Formatar Resposta para capturar e passar os erros legíveis em caso de falha no PUT
const w6Format = w6.nodes.find(n => n.name === 'Formatar Resposta');
if (w6Format) {
  w6Format.parameters.jsCode = `
const data = $input.first().json;
if (data.status === 'error' || data.error || data.message || (data.statusCode && data.statusCode >= 400)) {
  const detalheErro = data.message || data.error || JSON.stringify(data);
  return [{ json: { sucesso: false, resultado: "Erro fatal ao SALVAR a OS. Detalhes reais do parceiro API Bom Saldo: " + detalheErro } }];
}
return [{ json: { sucesso: true, resultado: 'OS Atualizada/Fechada com SUCESSO! A requisição foi processada pela API.', dados: data.data || data } }];
`;
}

// Modificar o Montar Payload para tratar o erro do GET OS Atual
const w6Payload = w6.nodes.find(n => n.name === 'Montar Payload');
if (w6Payload) {
  let jsCode = w6Payload.parameters.jsCode;
  // Ensure we capture api response code
  jsCode = jsCode.replace(
    `if (!resp || resp.status === 'error' || !resp.data) {`,
    `if (!resp || resp.status === 'error' || !resp.data) {
  const dt = resp ? (resp.message || JSON.stringify(resp)) : "erro desconhecido do GET";
  return [{ json: { error: "FALHA GRAVE NO PROCESSO DE BUSCAR A OS ANTES DE ATUALIZAR. VANDA: Você passou um os_id errado ou vazio. O erro da API foi: " + dt } }];
}
if (!triggerParams.os_id) {
  return [{ json: { error: "VANDA: você não enviou a variável obrigatória 'os_id'." } }];
}
if (String(triggerParams.os_id).replace(/[^0-9]/g, '') === '') {
  return [{ json: { error: "VANDA: o 'os_id' que você mandou tem um formato incorreto e não continha números (ex: " + triggerParams.os_id + ")" } }];
}`
  );
  w6Payload.parameters.jsCode = jsCode;
}

fs.writeFileSync(w6Path, JSON.stringify(w6, null, 2), 'utf8');
console.log('OK: W6 blindado com ignoreResponseCode e extração numérica estrita do os_id');
