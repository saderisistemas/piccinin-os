module.exports = `const triggerParams = $('Trigger').first().json;
const resp = $input.first().json;
if (!resp || resp.status === 'error' || !resp.data) return [{ json: { error: "FALHA GRAVE NO PROCESSO DE BUSCAR A OS ANTES DE ATUALIZAR" } }];

const osAtual = resp.data;
let produtos = [];
let servicos = [];
try { produtos = typeof triggerParams.produtos_json === 'string' ? JSON.parse(triggerParams.produtos_json) : (triggerParams.produtos_json || []); } catch(e) {}
try { servicos = typeof triggerParams.servicos_json === 'string' ? JSON.parse(triggerParams.servicos_json) : (triggerParams.servicos_json || []); } catch(e) {}

const payload = {
  codigo: osAtual.codigo,
  cliente_id: osAtual.cliente_id,
  data: osAtual.data || new Date().toISOString().split('T')[0],
  observacoes: triggerParams.observacoes_orientacao || osAtual.observacoes || '',
  observacoes_interna: (triggerParams.relatorio_tecnico || triggerParams.laudo || osAtual.observacoes_interna || ''),
  situacao_id: String(triggerParams.situacao_id || '6237499')
};
// Lógica pura de mutação...
return [{ json: { os_id: triggerParams.os_id, payload } }];`;
