/**
 * lib/w6/merge_produtos.js
 * Utilitários para parse e merge de produtos e serviços
 */

const mergeProdutos = (osAtual, produtosTrigger, equipamentoCodigo, emGarantia) => {
  const produtosArray = [];

  // Preservar produtos existentes da OS
  if (osAtual.produtos && osAtual.produtos.length > 0) {
    osAtual.produtos
      .filter(p => p.produto && p.produto.produto_id && p.produto.produto_id !== '')
      .forEach(p => {
        produtosArray.push({ produto: {
          produto_id: p.produto.produto_id,
          variacao_id: p.produto.variacao_id || '',
          quantidade: String(p.produto.quantidade || '1'),
          valor_venda: emGarantia ? '0' : String(p.produto.valor_venda || '0'),
          tipo_desconto: p.produto.tipo_desconto || 'R$',
          desconto_valor: String(p.produto.desconto_valor || '0'),
          desconto_porcentagem: String(p.produto.desconto_porcentagem || '0')
        }});
      });
  }

  // Adicionar novos produtos do trigger
  produtosTrigger.forEach(p => {
    const pid = p.produto_id || p.id;
    if (!pid || pid === '') return;
    const jaExiste = produtosArray.some(ex => String(ex.produto.produto_id) === String(pid));
    if (jaExiste) return;
    produtosArray.push({ produto: {
      produto_id: pid,
      variacao_id: p.variacao_id || '',
      quantidade: String(p.quantidade || '1'),
      valor_venda: emGarantia ? '0' : String(p.valor_venda ?? '0'),
      tipo_desconto: 'R$',
      desconto_valor: '0',
      desconto_porcentagem: '0'
    }});
  });

  // Adicionar produto(s) avulso(s)
  if (equipamentoCodigo) {
    const codigos = String(equipamentoCodigo).split(',').map(c => c.trim()).filter(c => c !== '');
    for (const pCode of codigos) {
      let finalPid = pCode;
      const idMatch = pCode.match(/\(ID:\s*(\d+)\)/);
      if (idMatch) finalPid = idMatch[1];
      const jaExiste = produtosArray.some(ex => String(ex.produto.produto_id) === finalPid);
      if (!jaExiste) {
        produtosArray.push({ produto: {
          produto_id: finalPid,
          variacao_id: '',
          quantidade: '1',
          valor_venda: '0', 
          tipo_desconto: 'R$',
          desconto_valor: '0',
          desconto_porcentagem: '0'
        }});
      }
    }
  }

  return produtosArray;
};

const mergeServicos = (osAtual, servicosTrigger, servicoCodigo, emGarantia) => {
  const servicosArray = [];

  if (osAtual.servicos && osAtual.servicos.length > 0) {
    osAtual.servicos
      .filter(s => s.servico && s.servico.servico_id && s.servico.servico_id !== '')
      .forEach(s => {
        servicosArray.push({ servico: {
          servico_id: s.servico.servico_id,
          quantidade: String(s.servico.quantidade || '1'),
          valor_venda: emGarantia ? '0' : String(s.servico.valor_venda || '0'),
          tipo_desconto: s.servico.tipo_desconto || 'R$',
          desconto_valor: String(s.servico.desconto_valor || '0'),
          desconto_porcentagem: String(s.servico.desconto_porcentagem || '0')
        }});
      });
  }

  servicosTrigger.forEach(s => {
    const sid = s.servico_id || s.id;
    if (!sid || sid === '') return;
    const jaExiste = servicosArray.some(ex => String(ex.servico.servico_id) === String(sid));
    if (jaExiste) return;
    servicosArray.push({ servico: {
      servico_id: sid,
      quantidade: String(s.quantidade || '1'),
      valor_venda: emGarantia ? '0' : String(s.valor_venda ?? '0'),
      tipo_desconto: 'R$',
      desconto_valor: '0',
      desconto_porcentagem: '0'
    }});
  });

  if (servicoCodigo) {
    const sCodigos = String(servicoCodigo).split(',').map(c => c.trim()).filter(c => c !== '');
    for (const sCode of sCodigos) {
      let finalSid = sCode;
      const idMatch = sCode.match(/\(ID:\s*(\d+)\)/);
      if (idMatch) finalSid = idMatch[1];
      const jaExiste = servicosArray.some(ex => String(ex.servico.servico_id) === finalSid);
      if (!jaExiste) {
        servicosArray.push({ servico: {
          servico_id: finalSid,
          quantidade: '1',
          valor_venda: '0', 
          tipo_desconto: 'R$',
          desconto_valor: '0',
          desconto_porcentagem: '0'
        }});
      }
    }
  }

  return servicosArray;
};

module.exports = { mergeProdutos, mergeServicos };
