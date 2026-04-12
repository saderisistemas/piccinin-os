/**
 * lib/w6/forma_pagamento.js
 * Utilitários de mapeamento e cálculo de pagamento
 */

const getFormaPagamentoId = (tipoPagamento, osAtualId) => {
  let formaId = '4366641'; // Default = Boleto/Faturar
  const tp = (tipoPagamento || '').toLowerCase();

  if (tp.includes('pix') && (tp.includes('nubank') || (!tp.includes('inter') && !tp.includes('cora')))) {
    formaId = '4366643'; // Pix Nubank
  } else if (tp.includes('pix') && tp.includes('inter')) {
    formaId = '4377571'; // Pix Inter
  } else if (tp.includes('pix') && tp.includes('cora')) {
    formaId = '4384234'; // Pix Cora
  } else if (tp.includes('dinheiro') || tp.includes('especie') || tp.includes('espécie')) {
    formaId = '4354377'; // Dinheiro
  } else if (tp.includes('boleto') || tp.includes('faturad') || tp.includes('escritorio') || tp.includes('escritório')) {
    formaId = '4366641'; // Boleto/Faturar
  } else if (osAtualId) {
    formaId = osAtualId;
  }
  return formaId;
};

const calcSumTotal = (produtosArray, servicosArray) => {
  let sumTotal = 0;
  produtosArray.forEach(p => {
    const qtd = parseFloat(p.produto.quantidade || 0);
    const val = parseFloat(p.produto.valor_venda || 0);
    const desc = parseFloat(p.produto.desconto_valor || 0);
    sumTotal += (qtd * val) - desc;
  });
  servicosArray.forEach(s => {
    const qtd = parseFloat(s.servico.quantidade || 0);
    const val = parseFloat(s.servico.valor_venda || 0);
    const desc = parseFloat(s.servico.desconto_valor || 0);
    sumTotal += (qtd * val) - desc;
  });
  return Math.max(sumTotal, 0).toFixed(2);
};

module.exports = { getFormaPagamentoId, calcSumTotal };
