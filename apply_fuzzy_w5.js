const fs = require('fs');
const path = require('path');

const w5Path = path.join(__dirname, 'workflows', 'W5 - Tool - Buscar Servicos.json');
const w5 = JSON.parse(fs.readFileSync(w5Path, 'utf8'));

// 1. Modificar o GET Servicos para trazer até 200 serviços sem filtro de nome na API
const w5Get = w5.nodes.find(n => n.name === 'GET Servicos');
if (w5Get) {
  w5Get.parameters.url = '=https://bomsaldo.com/api/servicos/?limite_por_pagina=200';
}

// 2. Modificar o Formatar Servicos para fazer a busca Fuzzy local (JS)
const w5Format = w5.nodes.find(n => n.name === 'Formatar Servicos');
if (w5Format) {
  w5Format.parameters.jsCode = `
const normalize = (str) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim();
};

const tParam = $('Trigger').first().json;
const termoBruto = String(tParam.nome || tParam.servicos || '').trim();
const termo = normalize(termoBruto);

const servicos = $input.first().json.data || [];

if (servicos.length === 0) {
  return [{ json: { resultado: 'O catálogo de serviços do sistema retornou vazio.', servicos: [] } }];
}

// Se o técnico não passou nada ou a IA não mandou o termo, sugere os 8 primeiros
if (!termo) {
  const lista = servicos.slice(0, 8).map((s, i) => ({ index: i + 1, id: String(s.id), nome: s.nome, valor: s.valor_venda }));
  const texto = lista.map(s => \`\${s.index}. \${s.nome} | R$\${s.valor}\`).join('\\n');
  const option_map = {}; lista.forEach(s => { option_map[String(s.index)] = { id: s.id, nome: s.nome, valor_venda: s.valor }; });
  return [{ json: { resultado: \`Serviços disponíveis (nenhum termo fornecido):\\n\${texto}\\n\\nPeça para escolher pelo número.\`, option_map, servicos: lista } }];
}

const palavrasBusca = termo.split(/\\s+/).filter(p => p.length > 2); // Ex: ['manutencao', 'camera']

// Pontuação Fuzzy
const resultados = servicos.map(s => {
  const alvo = normalize(s.nome);
  let score = 0;
  
  // 1. Match exato
  if (alvo === termo) score += 100;
  
  // 2. Contém a frase inteira
  if (alvo.includes(termo)) score += 60;
  
  // 3. Match por palavras soltas
  if (palavrasBusca.length > 0) {
    let matches = 0;
    palavrasBusca.forEach(p => {
      if (alvo.includes(p)) {
        matches += 1;
        score += 20;
        // Bônus se a palavra bate no começo
        if (alvo.startsWith(p)) score += 10;
        // Bônus para palavra exata
        if (alvo.split(/\\s+/).includes(p)) score += 10;
      }
    });
    // Se achou todas as palavras fora de ordem, ganha bônus forte
    if (matches === palavrasBusca.length) {
      score += 30;
    }
  }

  // Se for código exato
  if (String(s.id) === termoBruto) score += 100;

  return { s, score, alvo };
}).filter(x => x.score > 0);

// Ordena pelos que tem maior pontuação
resultados.sort((a, b) => b.score - a.score);

// Pega os top 6 ou se não achou nada parecido, pega os 5 primeiros
let listaFinal = resultados.slice(0, 6);

if (listaFinal.length === 0) {
  return [{ json: { resultado: \`Nenhum serviço encontrado associado a "\${termoBruto}".\\nLembre-se: tente sugerir ao técnico termos genéricos como "Manutenção", "Instalação" ou "Visita Técnica".\`, servicos: [] } }];
}

const listaFormatada = listaFinal.map((r, i) => ({
  index: i + 1,
  id: String(r.s.id),
  nome: r.s.nome,
  valor_venda: r.s.valor_venda,
  score: r.score
}));

const textoLista = listaFormatada.map(s => \`\${s.index}. \${s.nome} | R$\${s.valor_venda}\`).join('\\n');
const option_map = {};
listaFormatada.forEach(s => { option_map[String(s.index)] = { id: s.id, nome: s.nome, valor_venda: s.valor_venda }; });

return [{ json: { 
  resultado: \`Serviços encontrados para "\${termoBruto}":\\n\${textoLista}\\n\\nApresente as opções ao técnico. Quando ele escolher o NÚMERO (1 a \${listaFormatada.length}), você usará o option_map para pegar o servico_id real.\`, 
  option_map,
  servicos: listaFormatada
} }];
`;
}

fs.writeFileSync(w5Path, JSON.stringify(w5, null, 2), 'utf8');

console.log('OK: fuzzy search applied to W5');
