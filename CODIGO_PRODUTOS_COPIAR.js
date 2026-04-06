// ── Helpers ──────────────────────────────────────────────────────────
const normalize = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

const levenshtein = (a, b) => {
  if (!a) return (b||'').length;
  if (!b) return a.length;
  const m = Array.from({length: b.length + 1}, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[i-1] === a[j-1]
        ? m[i-1][j-1]
        : 1 + Math.min(m[i-1][j-1], m[i][j-1], m[i-1][j]);
    }
  }
  return m[b.length][a.length];
};

// Aliases comuns no setor de segurança eletrônica
const ALIASES = {
  'cam': 'camera', 'cftv': 'camera', 'cameras': 'camera',
  'ctrl': 'controle', 'tec': 'teclado', 'tecl': 'teclado',
  'bat': 'bateria', 'bats': 'bateria', 'baterias': 'bateria',
  'fnt': 'fonte', 'fontes': 'fonte', 'alim': 'alimentacao',
  'mov': 'movimento', 'pir': 'infravermelho', 'irt': 'infravermelho',
  'mag': 'magnetico', 'sab': 'sabotagem',
  'sir': 'sirene', 'siren': 'sirene', 'sirenes': 'sirene',
  'cbl': 'cabo', 'cabos': 'cabo', 'cabeamento': 'cabo',
  'mod': 'modulo', 'modulos': 'modulo', 'gprs': 'modulo',
  'acesso': 'controle acesso', 'biom': 'biometrico',
  'act': 'acionador', 'btn': 'botao',
  'nvr': 'nvr', 'dvr': 'dvr', 'xvr': 'dvr',
  'jfl': 'jfl', 'dsc': 'dsc', 'paradox': 'paradox', 'intelbras': 'intelbras'
};

const expandirAlias = (p) => ALIASES[p] || p;

// ── Recuperar contexto ──────────────────────────────────────────────
const normNode = $('Normalizar Termo').first().json;
const termoOriginal = normNode.termo_original || '';
const termo = normalize(termoOriginal);
const stopwords = ['de','da','do','para','com','em','um','uma','o','a'];
const palavrasBusca = termo.split(/\s+/)
  .filter(p => p.length > 1 && !stopwords.includes(p))
  .map(expandirAlias);

// ── Coletar e deduplicar todos os resultados ────────────────────────
const allItems = $input.all();
const todos = allItems.flatMap(item => item.json.data || []);
const vistos = new Set();
const unicos = todos.filter(p => {
  if (vistos.has(p.id)) return false;
  vistos.add(p.id);
  return true;
});

if (unicos.length === 0) {
  return [{ json: {
    resultado: `Nenhum produto encontrado para "${termoOriginal}". Tente: câmera, sensor, central de alarme, cabo, fonte, sirene, teclado, módulo.`,
    option_map: {},
    produtos: []
  }}];
}

// ── Fuzzy scoring com Levenshtein ───────────────────────────────────
const pontuados = unicos.map(p => {
  const alvo = normalize(p.nome);
  const palavrasAlvo = alvo.split(/\s+/);
  let score = 0;

  if (alvo === termo) score += 100;
  if (alvo.includes(termo)) score += 60;

  palavrasBusca.forEach(busca => {
    if (busca.length < 2) return;

    // Correspondência direta
    if (alvo.includes(busca)) {
      score += 25;
      if (alvo.startsWith(busca)) score += 10;
    }

    // Tolerância a typos via Levenshtein por palavra
    palavrasAlvo.forEach(pa => {
      if (pa.length >= 3 && busca.length >= 3) {
        const dist = levenshtein(busca, pa);
        const maxLen = Math.max(busca.length, pa.length);
        if (dist === 0) score += 30;
        else if (dist === 1) score += 18; // typo de 1 char
        else if (dist === 2 && maxLen >= 6) score += 8; // typo de 2 em palavra longa
      }
    });
  });

  // Bônus se TODAS as palavras bateram
  if (palavrasBusca.length > 1 && palavrasBusca.every(b => alvo.includes(b))) {
    score += 35;
  }

  return { p, score };
}).filter(x => x.score > 0 || unicos.length <= 3);

pontuados.sort((a, b) => b.score - a.score);

const lista = pontuados.slice(0, 8).map((x, i) => {
  const variacao_id = x.p.variacoes && x.p.variacoes[0]
    ? String(x.p.variacoes[0].variacao.id)
    : null;
  return {
    index: i + 1,
    id: String(x.p.codigo_interno ? x.p.codigo_interno : x.p.id),
    variacao_id,
    nome: x.p.nome,
    codigo: x.p.codigo_interno || '',
    valor_venda: x.p.valor_venda,
    estoque: x.p.estoque || 0
  };
});

if (lista.length === 0) {
  return [{ json: {
    resultado: `Nenhum produto compatível com "${termoOriginal}". Sugestões de termos: câmera IP, sensor de movimento, central de alarme, cabo coaxial, fonte 12V.`,
    option_map: {},
    produtos: []
  }}];
}

const textoLista = lista
  .map(p => `${p.index}. ${p.nome} | Cód: ${p.codigo || '-'} | R$${p.valor_venda} | Est: ${p.estoque}`)
  .join('\n');

const option_map = {};
lista.forEach(p => {
  option_map[String(p.index)] = { id: p.codigo || p.id, variacao_id: p.variacao_id, nome: p.nome, valor_venda: p.valor_venda };
});

return [{ json: {
  resultado: `Produtos para "${termoOriginal}":\n${textoLista}\n\nApresente as opções ao técnico. Quando ele informar o NÚMERO, use o option_map para obter produto_id e variacao_id oficiais.`,
  option_map,
  produtos: lista
}}];