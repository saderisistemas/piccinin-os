const fs = require('fs');
const path = require('path');

const w10Path = path.join(__dirname, 'workflows', 'W10 - Tool - Cancelar OS.json');
let w10 = JSON.parse(fs.readFileSync(w10Path, 'utf8'));

// 1. Validar Params
const validarNode = w10.nodes.find(n => n.name === 'Validar Params');
validarNode.parameters.jsCode = `const p = $input.first().json;
const erros = [];

if (!p.os_id || !/^[0-9]+$/.test(String(p.os_id))) 
  erros.push('os_id inválido ou ausente — deve ser o ID interno numérico da OS');
if (!p.motivo || String(p.motivo).trim().length < 5)
  erros.push('motivo do cancelamento obrigatório (mínimo 5 caracteres)');
if (!p.tecnico_id)
  erros.push('tecnico_id obrigatório');

if (erros.length > 0) {
  throw new Error('Parâmetros inválidos:\\n' + erros.join('\\n'));
}

return [{ json: {
  os_id:              String(p.os_id),
  motivo:             String(p.motivo).trim(),
  tecnico_nome:       p.tecnico_nome || p.tecnico_responsavel || 'Desconhecido',
  tecnico_id:         String(p.tecnico_id),
  conversa_id:        p.conversa_id ? String(p.conversa_id) : null,
  timestamp_cancel:   new Date().toISOString()
} }];`;

// 2. Registar Auditoria (Postgres) -> atualizar para tecnico_id
const dbNode = w10.nodes.find(n => n.name === 'Registrar Auditoria');
dbNode.parameters.query = `-- Registrar no log de auditoria
INSERT INTO os_log_auditoria (conversa_id, tecnico_id, os_id, acao, status, payload_enviado, resposta_api)
VALUES ($1, $2, $3, 'cancelada', 'sucesso', $4::JSONB, $5::JSONB);

-- Atualizar o buffer se encontrado
UPDATE os_buffer 
SET fase = 'cancelado', atualizado_em = NOW()
WHERE tecnico_id = $2 AND os_id = $3;

SELECT 'ok' AS result;`;

dbNode.parameters.additionalFields.queryParams = `={{ [
  $('Verificar OS').first().json.conversa_id || '',
  $('Verificar OS').first().json.tecnico_id,
  $('Verificar OS').first().json.os_id,
  JSON.stringify($('Verificar OS').first().json),
  JSON.stringify($input.first().json)
].join(',') }}`;

// Preciso também garantir que Verificar OS passe tecnico_id
const verifNode = w10.nodes.find(n => n.name === 'Verificar OS');
verifNode.parameters.jsCode = verifNode.parameters.jsCode.replace(
  "tecnico:      trigger.tecnico_responsavel,", 
  "tecnico_id:   trigger.tecnico_id,\n  tecnico_nome: trigger.tecnico_nome,"
);

// 3. Adicionar chamada ao W11 (Archive)
const w10_w11_id = "w10-w11-archive";
const confNode = w10.nodes.find(n => n.name === 'Confirmar Cancelamento');
w10.nodes.push({
  "parameters": {
    "workflowId": {
      "__rl": true,
      "value": "kWjI5bVdGdATsuiH",
      "mode": "id"
    },
    "workflowInputs": {
      "mappingMode": "defineBelow",
      "value": {
        "tecnico_id": "={{ $('Verificar OS').first().json.tecnico_id }}",
        "acao": "archive"
      }
    },
    "options": {}
  },
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 2,
  "position": [confNode.position[0], confNode.position[1]],
  "id": w10_w11_id,
  "name": "W11 Limpar Contexto OS"
});

// Ajustar conexões e posição do Confirmar Cancelamento
confNode.position[0] = confNode.position[0] + 240;

// Registrar Auditoria aponta para W11 Limpar Contexto OS
w10.connections["Registrar Auditoria"]["main"][0] = [{
  "node": "W11 Limpar Contexto OS",
  "type": "main",
  "index": 0
}];

// E W11 aponta para Confirmar Cancelamento
w10.connections["W11 Limpar Contexto OS"] = {
  "main": [
    [{
      "node": "Confirmar Cancelamento",
      "type": "main",
      "index": 0
    }]
  ]
};

// Ajustar Output Message
confNode.parameters.jsCode = `const info = $('Verificar OS').first().json;
return [{
  json: {
    sucesso: true,
    mensagem: \`✅ OS #\${info.os_codigo} cancelada com sucesso.\\n\\nMotivo: \${info.motivo}\\nResponsável: \${info.tecnico_nome}\\nHorário: \${info.timestamp}\`,
    os_id: info.os_id,
    os_codigo: info.os_codigo
  }
}];`;

fs.writeFileSync(w10Path, JSON.stringify(w10, null, 2));
console.log("W10 Atualizado");
