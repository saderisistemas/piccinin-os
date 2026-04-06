const fs = require('fs');
const path = require('path');

// ─── Patch W4: Expose option_map and IDs ──────────────────────────────────────
const w4Path = path.join(__dirname, 'workflows', 'W4 - Tool - Buscar Produtos.json');
const w4 = JSON.parse(fs.readFileSync(w4Path, 'utf8'));
const w4Format = w4.nodes.find(n => n.name === 'Formatar Produtos');
if (w4Format) {
  w4Format.parameters.jsCode = `
const data = $input.first().json;
const produtos = data.data || [];
if (produtos.length === 0) {
  return [{ json: { resultado: 'Nenhum produto encontrado com esse nome. Tente um termo diferente ou mais genérico.', produtos: [] } }];
}
const lista = produtos.slice(0, 8).map((p, i) => {
  const variacao_id = p.variacoes && p.variacoes[0] ? String(p.variacoes[0].variacao.id) : null;
  return {
    index: i + 1,
    id: String(p.id),
    variacao_id: variacao_id,
    nome: p.nome,
    codigo: p.codigo_interno || '',
    valor_venda: p.valor_venda,
    estoque: p.estoque
  };
});
const textoLista = lista.map(p => \`\${p.index}. \${p.nome} | Cód: \${p.codigo} | R$\${p.valor_venda} | Estoque: \${p.estoque || 0}\`).join('\\n');

const option_map = {};
lista.forEach(p => { option_map[String(p.index)] = { id: p.id, variacao_id: p.variacao_id, nome: p.nome, valor_venda: p.valor_venda }; });

return [{ json: { 
  resultado: \`Produtos encontrados:\\n\${textoLista}\\n\\nApresente as opções ao técnico. Quando ele escolher o NÚMERO, você usará o option_map para pegar o produto_id e variacao_id reais.\`, 
  option_map,
  produtos: lista 
} }];
`;
  fs.writeFileSync(w4Path, JSON.stringify(w4, null, 2), 'utf8');
}

// ─── Patch W5: Expose option_map and IDs ──────────────────────────────────────
const w5Path = path.join(__dirname, 'workflows', 'W5 - Tool - Buscar Servicos.json');
const w5 = JSON.parse(fs.readFileSync(w5Path, 'utf8'));
const w5Format = w5.nodes.find(n => n.name === 'Formatar Servicos');
if (w5Format) {
  w5Format.parameters.jsCode = `
const data = $input.first().json;
const servicos = data.data || [];
if (servicos.length === 0) {
  return [{ json: { resultado: 'Nenhum serviço encontrado com esse nome. Tente mais genérico (ex: instalacao, manutencao).', servicos: [] } }];
}
const lista = servicos.slice(0, 8).map((s, i) => ({
  index: i + 1,
  id: String(s.id),
  nome: s.nome,
  valor_venda: s.valor_venda
}));
const textoLista = lista.map(s => \`\${s.index}. \${s.nome} | R$\${s.valor_venda}\`).join('\\n');

const option_map = {};
lista.forEach(s => { option_map[String(s.index)] = { id: s.id, nome: s.nome, valor_venda: s.valor_venda }; });

return [{ json: { 
  resultado: \`Serviços encontrados:\\n\${textoLista}\\n\\nApresente as opções ao técnico. Quando ele escolher o NÚMERO, você usará o option_map para pegar o servico_id real.\`, 
  option_map,
  servicos: lista 
} }];
`;
  fs.writeFileSync(w5Path, JSON.stringify(w5, null, 2), 'utf8');
}

// ─── Patch W1: Fix system prompt & atualizarOS ──────────────────────────────
const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

const atualizarOS = w1.nodes.find(n => n.name === 'atualizarOS');
if (atualizarOS) {
  atualizarOS.parameters.description = 'Finaliza a OS, adicionando produtos/serviços, dados financeiros e horários. IMPORTANTE: os produtos DEVEM conter `produto_id` e `variacao_id` retirados do `option_map` do buscarProdutos. NUNCA invente e NUNCA peça IDs ao técnico.';
}

const vanda = w1.nodes.find(n => n.name === 'Vanda');
if (vanda) {
  let msg = vanda.parameters.options.systemMessage;
  
  if (!msg.includes('**GUARDE INTERNALMENTE**')) {
    msg = msg.replace('3. **Lançamento / Finalização (`atualizarOS`)**', 
`3. **Lançamento / Finalização (\`atualizarOS\`)**
   - **MUITO IMPORTANTE:** Sempre que usar \`buscarProdutos\` ou \`buscarServicos\`, ele retornará uma lista e um \`option_map\`. Você **GUARDE INTERNALMENTE** o \`option_map\`. 
   - Quando o técnico escolher a opção 1, você pega \`option_map["1"].id\` e \`option_map["1"].variacao_id\` para incluir no payload de atualizarOS.
   - **NUNCA peça ao técnico o ID, código do sistema ou variacao_id.** Eles não sabem! Use o mapping!
   - Se \`variacao_id\` for null, envie como null. Tudo bem.
`);
  }
  
  vanda.parameters.options.systemMessage = msg;
  fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
}

// ─── Patch W6: Fix issue with GET OS / null variacao_id ─────────────────────
const w6Path = path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json');
const w6 = JSON.parse(fs.readFileSync(w6Path, 'utf8'));

// The actual problem: Is Trigger parsing os_id? Let's fix trigger/GET URL
const w6GetOs = w6.nodes.find(n => n.name === 'GET OS Atual');
if (w6GetOs) {
  // Use $('Trigger').first().json.os_id because $json from Trigger is the top level object
  w6GetOs.parameters.url = '=https://bomsaldo.com/api/ordens_servicos/{{ $json.os_id }}/';
}

const w6Payload = w6.nodes.find(n => n.name === 'Montar Payload');
if (w6Payload) {
  let code = w6Payload.parameters.jsCode;
  
  // Quick fix: remove variacao_id if it's null or undefined.
  code = code.replace(
    'produtosArray.push({ produto: {\\n    produto_id: p.produto_id || p.id,\\n    variacao_id: p.variacao_id,\\n    quantidade: String(p.quantidade || \\\'1\\\'),',
    `const p_variacao = p.variacao_id && p.variacao_id != 'null' ? p.variacao_id : undefined;
  produtosArray.push({ produto: {
    produto_id: String(p.produto_id || p.id),
    ...(p_variacao ? {variacao_id: String(p_variacao)} : {}),
    quantidade: String(p.quantidade || '1'),`
  );
  
  w6Payload.parameters.jsCode = code;
}
fs.writeFileSync(w6Path, JSON.stringify(w6, null, 2), 'utf8');

console.log('OK: Patched W1, W4, W5, W6');
