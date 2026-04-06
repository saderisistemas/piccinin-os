// ========================================================
// W6 - Montar Payload - Code Node
// Monta o payload completo para PUT na API Bom Saldo
// Preserva TODOS os campos da OS original e enriquece
// ========================================================

const triggerParams = $('Resolver OS ID').first().json;
const osResp = $input.first().json;

// Validacoes de entrada
if (triggerParams.error) {
  return [{ json: { error: triggerParams.error } }];
}

if (!osResp || osResp.status === 'error' || !osResp.data) {
  const dt = osResp ? (osResp.message || JSON.stringify(osResp)) : 'erro desconhecido';
  return [{ json: { error: 'FALHA GRAVE AO BUSCAR OS. Erro API: ' + dt } }];
}

const osAtual = osResp.data;

// ========================================================
// PARSE DE PRODUTOS E SERVICOS DO TRIGGER
// ========================================================
let produtos = [];
let servicos = [];
try { produtos = typeof triggerParams.produtos_json === 'string' ? JSON.parse(triggerParams.produtos_json) : (triggerParams.produtos_json || []); } catch(e) {}
try { servicos = typeof triggerParams.servicos_json === 'string' ? JSON.parse(triggerParams.servicos_json) : (triggerParams.servicos_json || []); } catch(e) {}

const emGarantia = triggerParams.em_garantia === 'true' || triggerParams.em_garantia === true;

// ========================================================
// PARSE DE HORA - SEM OBJETO DATE para evitar bug UTC -3h
// ========================================================

// Normaliza qualquer formato de hora para string 'HH:MM'
// NUNCA cria new Date() a partir de strings simples (evita UTC offset)
const parseHoraStr = (raw) => {
  if (!raw || raw === '') return null;
  const s = String(raw).trim();
  // Ja e HH:MM ou HH:MM:SS
  const mColon = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (mColon) return `${mColon[1].padStart(2,'0')}:${mColon[2]}`;
  // HHhMM ou HHh (ex: '15h45', '15h')
  const mH = s.match(/^(\d{1,2})h(\d{2})?$/i);
  if (mH) return `${mH[1].padStart(2,'0')}:${(mH[2]||'00').padStart(2,'0')}`;
  // ISO timestamp do Supabase (ex: '2026-04-05T18:45:00+00:00')
  // Estes JA foram convertidos para texto 'HH:MM' no W8, mas por seguranca:
  if (s.includes('T') || s.includes(' ')) {
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch {}
  }
  return null;
};

// Calcular diferenca em minutos entre duas strings 'HH:MM'
const calcMinutos = (hhmm1, hhmm2) => {
  if (!hhmm1 || !hhmm2) return null;
  const [h1, m1] = hhmm1.split(':').map(Number);
  const [h2, m2] = hhmm2.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff : null;
};

const checkinHHMM = parseHoraStr(triggerParams.hora_entrada);
const checkoutHHMM = parseHoraStr(triggerParams.hora_saida);
const tempoMin = calcMinutos(checkinHHMM, checkoutHHMM);


// ========================================================
// RELATORIO TECNICO + TIMESTAMPS nas observacoes_interna
// ========================================================
let obsInterna = triggerParams.relatorio_tecnico || triggerParams.laudo || osAtual.observacoes_interna || '';

const tsLinhas = [];
if (checkinHHMM && !obsInterna.includes('[CHEGADA:')) tsLinhas.push(`[CHEGADA: ${checkinHHMM}]`);
if (checkoutHHMM && !obsInterna.includes('[SAIDA:')) tsLinhas.push(`[SAIDA: ${checkoutHHMM}]`);
if (tempoMin !== null && !obsInterna.includes('[TEMPO:')) tsLinhas.push(`[TEMPO: ${tempoMin} min]`);
if (tsLinhas.length > 0) {
  obsInterna = (obsInterna ? obsInterna + '\n' : '') + tsLinhas.join('\n');
}

// ========================================================
// DATA HOJE (fuso SP)
// ========================================================
const dataHoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');

// ========================================================
// PAYLOAD BASE - preserva TODOS os campos da OS original
// ========================================================
const payload = {
  // Campos obrigatorios
  codigo: osAtual.codigo,
  cliente_id: osAtual.cliente_id,

  // Datas
  data: osAtual.data || osAtual.data_entrada || dataHoje,
  data_entrada: osAtual.data_entrada || dataHoje,
  data_saida: triggerParams.data_saida || dataHoje,

  // Vendedor / Tecnico (preservar existente)
  vendedor_id: osAtual.vendedor_id || '',
  tecnico_id: osAtual.tecnico_id || '',

  // Situacao - atualizar para fechada (6237499) ou manter
  situacao_id: String(triggerParams.situacao_id || osAtual.situacao_id || '6237499'),

  // Transportadora
  transportadora_id: osAtual.transportadora_id || '',

  // Centro de custo
  centro_custo_id: osAtual.centro_custo_id || '',

  // Campos textuais
  aos_cuidados_de: osAtual.aos_cuidados_de || '',
  validade: osAtual.validade || '',
  introducao: osAtual.introducao || '',

  // Observacoes - enriquecer
  observacoes: triggerParams.observacoes_orientacao || osAtual.observacoes || '',
  observacoes_interna: obsInterna.trim(),

  // Descontos e frete (preservar)
  desconto_valor: osAtual.desconto_valor || '0.00',
  desconto_porcentagem: osAtual.desconto_porcentagem || '0.00',
  valor_frete: osAtual.valor_frete || '0.00',

  // Condicao pagamento
  condicao_pagamento: osAtual.condicao_pagamento || 'a_vista',

  // Situacao financeiro/estoque
  situacao_financeiro: osAtual.situacao_financeiro || '0',
  situacao_estoque: osAtual.situacao_estoque || '0',

  // Nota fiscal (preservar)
  nota_fiscal_id: osAtual.nota_fiscal_id || '',
  nota_fiscal_servico_id: osAtual.nota_fiscal_servico_id || '',

  // Exibir endereco
  exibir_endereco: osAtual.exibir_endereco || 0
};

// ========================================================
// EQUIPAMENTOS
// ========================================================
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

// ========================================================
// PRODUTOS (manter existentes da OS + novos do trigger)
// ========================================================
let produtosArray = [];

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

// Adicionar novos produtos do trigger (via json ARRAY)
produtos.forEach(p => {
  const pid = p.produto_id || p.id;
  if (!pid || pid === '') return;
  // Evitar duplicata
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

// Adicionar produto(s) avulso(s) (equipamento_codigo aceita multiplos separados por virgula)
if (triggerParams.equipamento_codigo) {
  const codigos = String(triggerParams.equipamento_codigo).split(',').map(c => c.trim()).filter(c => c !== '');
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
        valor_venda: emGarantia ? '0' : '0', // API ajusta caso passe 0 e n?o tenha json com valor
        tipo_desconto: 'R$',
        desconto_valor: '0',
        desconto_porcentagem: '0'
      }});
    }
  }
}

if (produtosArray.length > 0) payload.produtos = produtosArray;

// ========================================================
// SERVICOS (manter existentes + novos)
// ========================================================
let servicosArray = [];

// Preservar servicos existentes
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

// Adicionar novos servicos do trigger (via ARRAY)
servicos.forEach(s => {
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

// Adicionar servico(s) avulso(s) (servico_codigo aceita multiplos separados por virgula)
if (triggerParams.servico_codigo) {
  const sCodigos = String(triggerParams.servico_codigo).split(',').map(c => c.trim()).filter(c => c !== '');
  for (const sCode of sCodigos) {
    let finalSid = sCode;
    const idMatch = sCode.match(/\(ID:\s*(\d+)\)/);
    if (idMatch) finalSid = idMatch[1];
    const jaExiste = servicosArray.some(ex => String(ex.servico.servico_id) === finalSid);
    if (!jaExiste) {
      servicosArray.push({ servico: {
        servico_id: finalSid,
        quantidade: '1',
        valor_venda: emGarantia ? '0' : '0', 
        tipo_desconto: 'R$',
        desconto_valor: '0',
        desconto_porcentagem: '0'
      }});
    }
  }
}

if (servicosArray.length > 0) payload.servicos = servicosArray;

// ========================================================
// ENDERECOS (preservar da OS original)
// ========================================================
if (osAtual.enderecos && osAtual.enderecos.length > 0) {
  payload.enderecos = osAtual.enderecos;
}

// ========================================================
// ATRIBUTOS OS (campos extras customizados)
// ========================================================
const camposExtras = [];

// Preservar atributos existentes que NAO estamos sobrescrevendo
const idsCustom = ['58528', '58529', '58530'];
if (osAtual.atributos && osAtual.atributos.length > 0) {
  osAtual.atributos.forEach(a => {
    const aid = String(a.atributo_os?.atributo_id || a.atributo_id || '');
    if (!idsCustom.includes(aid)) {
      camposExtras.push(a);
    }
  });
}

// 58528 = Relatorio tecnico / Laudo
if (triggerParams.relatorio_tecnico || triggerParams.laudo) {
  camposExtras.push({
    atributo_os: {
      atributo_id: '58528',
      valor: triggerParams.relatorio_tecnico || triggerParams.laudo
    }
  });
}

// 58529 = Tipo de servico
const tipoServico = emGarantia ? 'Garantia' : (triggerParams.tipo_servico || '');
if (tipoServico) {
  camposExtras.push({
    atributo_os: {
      atributo_id: '58529',
      valor: tipoServico
    }
  });
}

// 58530 = Descricao do servico (horarios + tipo)
const descServico = [];
if (checkinHHMM) descServico.push(`Entrada: ${checkinHHMM}`);
if (checkoutHHMM) descServico.push(`Saida: ${checkoutHHMM}`);
if (tempoMin !== null) descServico.push(`Tempo: ${tempoMin}min`);
if (tipoServico) descServico.push(`Tipo: ${tipoServico}`);
if (descServico.length > 0) {
  camposExtras.push({
    atributo_os: {
      atributo_id: '58530',
      valor: descServico.join(' | ')
    }
  });
}

if (camposExtras.length > 0) payload.atributos_os = camposExtras;

// ========================================================
// PAGAMENTOS
// ========================================================

// Garantia - pagamento zerado
if (emGarantia) {
  payload.pagamentos = [{
    pagamento: {
      data_vencimento: dataHoje,
      valor: '0.00',
      forma_pagamento_id: '4366641'
    }
  }];

  return [{ json: {
    os_id: triggerParams.os_id,
    os_codigo: triggerParams.os_codigo,
    payload,
    tempo_atendimento_min: tempoMin
  }}];
}

// Calcular total (produtos + servicos)
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

// Forma de pagamento - mapear texto para ID
let formaId = '4366641'; // Default = Boleto/Faturar
const tp = (triggerParams.tipo_pagamento || '').toLowerCase();

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
} else if (osAtual.pagamentos && osAtual.pagamentos.length > 0 && osAtual.pagamentos[0].pagamento.forma_pagamento_id) {
  formaId = osAtual.pagamentos[0].pagamento.forma_pagamento_id;
}

payload.pagamentos = [{
  pagamento: {
    data_vencimento: dataHoje,
    valor: String(Math.max(sumTotal, 0).toFixed(2)),
    forma_pagamento_id: formaId
  }
}];

// ========================================================
// RETORNO FINAL
// ========================================================
return [{ json: {
  os_id: triggerParams.os_id,
  os_codigo: triggerParams.os_codigo,
  payload,
  tempo_atendimento_min: tempoMin
}}];
