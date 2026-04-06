const fs = require('fs');
const path = require('path');

const w6Path = path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json');
const w6 = JSON.parse(fs.readFileSync(w6Path, 'utf8'));

// Modificar o nó Formatar Resposta para capturar e repassar os erros do Montar Payload ou do PUT
const w6Format = w6.nodes.find(n => n.name === 'Formatar Resposta');
if (w6Format) {
  w6Format.parameters.jsCode = `
const payloadJson = $('Montar Payload').first().json;
if (payloadJson.error) {
  return [{ json: { sucesso: false, resultado: payloadJson.error } }];
}

const data = $input.first().json;
if (data.status === 'error' || data.error || data.message || (data.statusCode && data.statusCode >= 400)) {
  const detalheErro = data.message || data.error || JSON.stringify(data);
  return [{ json: { sucesso: false, resultado: "Erro fatal ao SALVAR a OS. Detalhes reais do parceiro API Bom Saldo: " + detalheErro } }];
}
return [{ json: { sucesso: true, resultado: 'OS Atualizada/Fechada com SUCESSO! A requisição foi processada pela API.', dados: data.data || data } }];
`;
}

// Em "Montar Payload", colocar uma "trava" para que o PUT receba um HTTP nulo e caia silenciosamente? No, a melhor forma é ajeitar a trigger no PUT:
// PUT url
const w6Put = w6.nodes.find(n => n.name === 'PUT Atualizar OS');
if (w6Put) {
  w6Put.parameters.url = `=https://bomsaldo.com/api/ordens_servicos/{{ String($('Trigger').first().json.os_id || '').replace(/[^0-9]/g, '') }}/`;
  
  // Se houver erro, podemos definir o body para não quebrar ou algo parecido, mas já está blindado com ignoreResponseCode.
}

fs.writeFileSync(w6Path, JSON.stringify(w6, null, 2), 'utf8');
console.log('OK: Reposta formatada repassando erros programáticos corretamente.');
