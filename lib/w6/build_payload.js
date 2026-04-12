/**
 * lib/w6/build_payload.js
 * Orquestrador central para montagem de Payload W6
 */
const { parseHoraStr, calcMinutos } = require('./parse_time');
const { mergeProdutos, mergeServicos } = require('./merge_produtos');
const { getFormaPagamentoId, calcSumTotal } = require('./forma_pagamento');

// ========================================================
// W6 - Montar Payload - Code Node
// ========================================================
const buildPayload = (triggerParams, osResp) => {
  if (triggerParams.error) return [{ json: { error: triggerParams.error } }];
  if (!osResp || osResp.status === 'error' || !osResp.data) {
    const dt = osResp ? (osResp.message || JSON.stringify(osResp)) : 'erro desconhecido';
    return [{ json: { error: 'FALHA GRAVE AO BUSCAR OS. Erro API: ' + dt } }];
  }

  const osAtual = osResp.data;
  const emGarantia = triggerParams.em_garantia === 'true' || triggerParams.em_garantia === true;

  // Parse de produtos e serviços do trigger
  let produtos = [], servicos = [];
  try { produtos = typeof triggerParams.produtos_json === 'string' ? JSON.parse(triggerParams.produtos_json) : (triggerParams.produtos_json || []); } catch(e) {}
  try { servicos = typeof triggerParams.servicos_json === 'string' ? JSON.parse(triggerParams.servicos_json) : (triggerParams.servicos_json || []); } catch(e) {}

  // Tempos e Observacoes
  const checkinHHMM = parseHoraStr(triggerParams.hora_entrada);
  const checkoutHHMM = parseHoraStr(triggerParams.hora_saida);
  const tempoMin = calcMinutos(checkinHHMM, checkoutHHMM);

  let obsInterna = triggerParams.relatorio_tecnico || triggerParams.laudo || osAtual.observacoes_interna || '';
  const tsLinhas = [];
  if (checkinHHMM && !obsInterna.includes('[CHEGADA:')) tsLinhas.push(`[CHEGADA: ${checkinHHMM}]`);
  if (checkoutHHMM && !obsInterna.includes('[SAIDA:')) tsLinhas.push(`[SAIDA: ${checkoutHHMM}]`);
  if (tempoMin !== null && !obsInterna.includes('[TEMPO:')) tsLinhas.push(`[TEMPO: ${tempoMin} min]`);
  if (tsLinhas.length > 0) obsInterna = (obsInterna ? obsInterna + '\n' : '') + tsLinhas.join('\n');

  const dataHoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');

  // Payload Base
  const payload = {
    codigo: osAtual.codigo,
    cliente_id: osAtual.cliente_id,
    data: osAtual.data || osAtual.data_entrada || dataHoje,
    data_entrada: osAtual.data_entrada || dataHoje,
    data_saida: triggerParams.data_saida || dataHoje,
    vendedor_id: osAtual.vendedor_id || '',
    tecnico_id: osAtual.tecnico_id || '',
    situacao_id: String(triggerParams.situacao_id || osAtual.situacao_id || '6237499'),
    transportadora_id: osAtual.transportadora_id || '',
    centro_custo_id: osAtual.centro_custo_id || '',
    aos_cuidados_de: osAtual.aos_cuidados_de || '',
    validade: osAtual.validade || '',
    introducao: osAtual.introducao || '',
    observacoes: triggerParams.observacoes_orientacao || osAtual.observacoes || '',
    observacoes_interna: obsInterna.trim(),
    desconto_valor: osAtual.desconto_valor || '0.00',
    desconto_porcentagem: osAtual.desconto_porcentagem || '0.00',
    valor_frete: osAtual.valor_frete || '0.00',
    condicao_pagamento: osAtual.condicao_pagamento || 'a_vista',
    situacao_financeiro: osAtual.situacao_financeiro || '0',
    situacao_estoque: osAtual.situacao_estoque || '0',
    nota_fiscal_id: osAtual.nota_fiscal_id || '',
    nota_fiscal_servico_id: osAtual.nota_fiscal_servico_id || '',
    exibir_endereco: osAtual.exibir_endereco || 0
  };

  // Equipamentos
  let equipamentosArray = osAtual.equipamentos || [];
  if (triggerParams.equipamento) {
    equipamentosArray = [{
      equipamento: {
        equipamento: triggerParams.equipamento || '',
        marca: triggerParams.marca || '',
        modelo: triggerParams.modelo || '',
        defeitos: triggerParams.defeito || '',
        solucao: triggerParams.solucao || '',
        laudo: triggerParams.relatorio_tecnico || triggerParams.laudo || ''
      }
    }];
  }
  if (equipamentosArray.length > 0) payload.equipamentos = equipamentosArray;

  // Itens
  const produtosArray = mergeProdutos(osAtual, produtos, triggerParams.equipamento_codigo, emGarantia);
  if (produtosArray.length > 0) payload.produtos = produtosArray;

  const servicosArray = mergeServicos(osAtual, servicos, triggerParams.servico_codigo, emGarantia);
  if (servicosArray.length > 0) payload.servicos = servicosArray;

  if (osAtual.enderecos && osAtual.enderecos.length > 0) payload.enderecos = osAtual.enderecos;

  // Atributos Especiais (58528 = Laudo, 58529 = Tipo Servico, 58530 = Previsao)
  const camposExtras = [];
  const idsCustom = ['58528', '58529', '58530'];
  if (osAtual.atributos && osAtual.atributos.length > 0) {
    osAtual.atributos.forEach(a => {
      const aid = String(a.atributo_os?.atributo_id || a.atributo_id || '');
      if (!idsCustom.includes(aid)) camposExtras.push(a);
    });
  }

  if (triggerParams.relatorio_tecnico || triggerParams.laudo) {
    camposExtras.push({ atributo_os: { atributo_id: '58528', valor: triggerParams.relatorio_tecnico || triggerParams.laudo } });
  }

  const tipoServico = emGarantia ? 'Garantia' : (triggerParams.tipo_servico || '');
  if (tipoServico) camposExtras.push({ atributo_os: { atributo_id: '58529', valor: tipoServico } });

  const descServico = [];
  if (checkinHHMM) descServico.push(`Entrada: ${checkinHHMM}`);
  if (checkoutHHMM) descServico.push(`Saida: ${checkoutHHMM}`);
  if (tempoMin !== null) descServico.push(`Tempo: ${tempoMin}min`);
  if (tipoServico) descServico.push(`Tipo: ${tipoServico}`);
  if (descServico.length > 0) camposExtras.push({ atributo_os: { atributo_id: '58530', valor: descServico.join(' | ') } });

  if (camposExtras.length > 0) payload.atributos_os = camposExtras;

  // Pagamentos
  if (emGarantia) {
    payload.pagamentos = [{ pagamento: { data_vencimento: dataHoje, valor: '0.00', forma_pagamento_id: '4366641' } }];
    return [{ json: { os_id: triggerParams.os_id, os_codigo: triggerParams.os_codigo, payload, tempo_atendimento_min: tempoMin } }];
  }

  const sumTotalStr = calcSumTotal(produtosArray, servicosArray);
  const fallbackPagamento = (osAtual.pagamentos?.length > 0) ? osAtual.pagamentos[0].pagamento.forma_pagamento_id : null;
  const formaId = getFormaPagamentoId(triggerParams.tipo_pagamento, fallbackPagamento);

  payload.pagamentos = [{ pagamento: { data_vencimento: dataHoje, valor: sumTotalStr, forma_pagamento_id: formaId } }];

  return [{ json: {
    os_id: triggerParams.os_id,
    os_codigo: triggerParams.os_codigo,
    payload,
    tempo_atendimento_min: tempoMin
  }}];
};

module.exports = buildPayload;

// Compatibilidade para execução direta no n8n se o require não estiver ativo (exige bundle)
// module.exports( $('Resolver OS ID').first().json, $input.first().json );
