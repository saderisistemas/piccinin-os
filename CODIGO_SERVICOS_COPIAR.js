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

// Aliases comuns para serviços de segurança eletrônica
const ALIASES = {
  'manut': 'manutencao', 'mnt': 'manutencao', 'revisao': 'manutencao',
  'inst': 'instalacao', 'instalac': 'instalacao', 'instalar': 'instalacao',
  'vis': 'visita', 'vt': 'visita tecnica', 'chamado': 'visita tecnica',
  'prog': 'programacao', 'config': 'configuracao', 'cfg': 'configuracao',
  'desins': 'desinstalacao', 'remov': 'remocao',
  'reparar': 'reparo', 'consertar': 'reparo',
  'monit': 'monitoramento', 'ativ': 'ativacao',
  'cam': 'camera', 'cftv': 'camera', 'alarme': 'alarme', 'central': 'central',
  'acesso': 'controle acesso', 'biom': 'biometrico'
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

// ── Coletar e deduplicar ────────────────────────────────────────────
const allItems = $input.all();
const todos = allItems.flatMap(item => item.json.data || []);
const vistos = new Set();
const unicos = todos.filter(s => {
  if (vistos.has(s.id)) return false;
  vistos.add(s.id);
  return true;
});

// Se sem termo, retornar lista genérica sem filtro
if (!termo) {
  const lista = unicos.slice(0, 8).map((s, i) => ({
    index: i + 1, id: String(s.codigo_interno ? s.codigo_interno : s.id), nome: s.nome, valor_venda: s.valor_venda
  }));
  const option_map = {};
  lista.forEach(p => { option_map[String(p.index)] = { id: p.codigo || p.id, nome: p.nome, valor_venda: p.valor_venda }; });
  return [{ json: {
    resultado: `Serviços disponíveis:\n${lista.map(s => `${s.index}. ${s.nome} | R$${s.valor_venda}`).join('\n')}\n\nInforme o número desejado.`,
    option_map,
    servicos: lista
  }}];
}

if (unicos.length === 0) {
  return [{ json: {
    resultado: `Nenhum serviço encontrado para "${termoOriginal}". Tente: manutenção, instalação, visita técnica, configuração, monitoramento.`,
    option_map: {},
    servicos: []
  }}];
}

// ── Fuzzy scoring com Levenshtein ───────────────────────────────────
const pontuados = unicos.map(s => {
  const alvo = normalize(s.nome);
  const palavrasAlvo = alvo.split(/\s+/);
  let score = 0;

  if (alvo === termo) score += 100;
  if (alvo.includes(termo)) score += 60;

  palavrasBusca.forEach(busca => {
    if (busca.length < 2) return;

    if (alvo.includes(busca)) {
      score += 25;
      if (alvo.startsWith(busca)) score += 10;
      if (alvo.split(/\s+/).includes(busca)) score += 10;
    }

    palavrasAlvo.forEach(pa => {
      if (pa.length >= 3 && busca.length >= 3) {
        const dist = levenshtein(busca, pa);
        const maxLen = Math.max(busca.length, pa.length);
        if (dist === 0) score += 30;
        else if (dist === 1) score += 18;
        else if (dist === 2 && maxLen >= 6) score += 8;
      }
    });
  });

  if (palavrasBusca.length > 1 && palavrasBusca.every(b => alvo.includes(b))) {
    score += 35;
  }

  return { s, score };
}).filter(x => x.score > 0 || unicos.length <= 3);

pontuados.sort((a, b) => b.score - a.score);

const lista = pontuados.slice(0, 6).map((x, i) => ({
  index: i + 1,
  id: String(x.s.codigo_interno ? x.s.codigo_interno : x.s.id),
  nome: x.s.nome,
  valor_venda: x.s.valor_venda
}));

if (lista.length === 0) {
  return [{ json: {
    resultado: `Nenhum serviço compatível com "${termoOriginal}". Tente: Manutenção Preventiva, Instalação de Câmera, Visita Técnica, Configuração de Central.`,
    option_map: {},
    servicos: []
  }}];
}

const textoLista = lista.map(s => `${s.index}. ${s.nome} | R$${s.valor_venda}`).join('\n');
const option_map = {};
lista.forEach(p => {
  option_map[String(p.index)] = { id: p.codigo || p.id, nome: p.nome, valor_venda: p.valor_venda };
});

return [{ json: {
  resultado: `Serviços para "${termoOriginal}":\n${textoLista}\n\nApresente ao técnico e aguarde o número. Use o option_map para obter o servico_id oficial.`,
  option_map,
  servicos: lista
}}];