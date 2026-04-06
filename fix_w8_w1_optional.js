const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'workflows');
const w1Path = path.join(dir, 'W1 - Protek OS - Agente Principal.json');
const w8Path = path.join(dir, 'W8 - Tool - Salvar Contexto OS.json');

// --- UPDATE W8 ---
if (fs.existsSync(w8Path)) {
  let w8 = JSON.parse(fs.readFileSync(w8Path, 'utf8'));
  let modifiedW8 = false;
  w8.nodes.forEach(n => {
    if (n.name === 'Merge for Update') {
      n.parameters.jsCode = `const novos = $('Validar Params').first().json;
const existente = $input.first().json;
const merged = { ...existente };

for (const key in novos) {
  if (novos[key] !== null && novos[key] !== undefined && novos[key] !== '') {
    merged[key] = novos[key];
  }
}

merged.atualizado_em = new Date().toISOString();
delete merged.id;
delete merged.criado_em;
delete merged._busca_por;

return [{ json: merged }];`;
      modifiedW8 = true;
    }
  });
  if (modifiedW8) {
    fs.writeFileSync(w8Path, JSON.stringify(w8, null, 2));
    console.log("W8 Merge for Update fixed!");
  }
}

// --- UPDATE W1 ---
if (fs.existsSync(w1Path)) {
  let w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
  let modifiedW1 = false;
  w1.nodes.forEach(n => {
    if (n.name === 'salvarContexto') {
      if (n.parameters.workflowInputs && n.parameters.workflowInputs.value) {
        n.parameters.workflowInputs.value.os_id = "={{ $fromAI('os_id', 'O ID INTERNO DA OS (OBRIGATORIO: se tiver duvida envie texto vazio \"\")', 'string') }}";
        n.parameters.workflowInputs.value.os_codigo = "={{ $fromAI('os_codigo', 'A visualização (OBRIGATORIO: envie texto vazio \"\" se nao houver)', 'string') }}";
        n.parameters.workflowInputs.value.fase = "={{ $fromAI('fase', 'A fase (abertura, andamento, fechado) (OBRIGATORIO: envie texto vazio \"\" se manter atual)', 'string') }}";
        modifiedW1 = true;
      }
    }
    if (n.name === 'Vanda') {
      if (n.parameters.options && n.parameters.options.systemMessage) {
        if (!n.parameters.options.systemMessage.includes('MUITO IMPORTANTE SOBRE TOOLS')) {
          n.parameters.options.systemMessage += `\n\n## MUITO IMPORTANTE SOBRE TOOLS
Se uma Tool pedir os_id, os_codigo ou fase e você NÃO TIVER ESSA INFORMAÇÃO, **ENVIE UM TEXTO VAZIO ""**. NUNCA omita o parâmetro, sempre preencha com string vazia "".`;
          modifiedW1 = true;
        }
      }
    }
  });
  if (modifiedW1) {
    fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2));
    console.log("W1 salvarContexto params fixed!");
  }
}
