/**
 * FIX 1: W11 — Substitui UPSERT (não suportado no Supabase node) por:
 *   GET check existência → IF exists? → UPDATE (sim) / INSERT (não)
 * 
 * FIX 2: W10 — Substitui node postgres por dois nodes Supabase nativos:
 *   INSERT auditoria + UPDATE buffer
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'workflows');
const SUPA_CRED = { supabaseApi: { id: '3TZFb8LBSmrd137a', name: 'Supabase Vanda OS' } };

// ═══════════════════════════════════════════════════════════════
// FIX 1 — W11: UPSERT → GET + IF + UPDATE/INSERT
// ═══════════════════════════════════════════════════════════════
const w11Path = path.join(DIR, 'W11 - Gerenciador Contexto OS.json');
let w11 = JSON.parse(fs.readFileSync(w11Path, 'utf8'));

// Remove UPSERT node
w11.nodes = w11.nodes.filter(n => n.name !== 'UPSERT Contexto Ativo');
delete w11.connections['UPSERT Contexto Ativo'];

// The 3 replacement nodes
const setOsFields = [
  { fieldId: 'tecnico_id',    fieldValue: "={{ $('setarInputs').first().json.tecnico_id }}" },
  { fieldId: 'tecnico_nome',  fieldValue: "={{ $('setarInputs').first().json.tecnico_nome }}" },
  { fieldId: 'os_id',         fieldValue: "={{ $('setarInputs').first().json.os_id }}" },
  { fieldId: 'os_codigo',     fieldValue: "={{ $('setarInputs').first().json.os_codigo }}" },
  { fieldId: 'cliente_id',    fieldValue: "={{ $('setarInputs').first().json.cliente_id }}" },
  { fieldId: 'cliente_nome',  fieldValue: "={{ $('setarInputs').first().json.cliente_nome }}" },
  { fieldId: 'fase',          fieldValue: "={{ $('setarInputs').first().json.fase || 'abertura_os' }}" },
  { fieldId: 'atualizado_em', fieldValue: "={{ $now }}" },
];

// Node 1: GET — check if tecnico already has a row
const checkNode = {
  parameters: {
    operation: 'getAll',
    tableId: 'tecnico_contexto_ativo',
    returnAll: false,
    limit: 1,
    filters: {
      conditions: [{
        keyName: 'tecnico_id',
        condition: 'eq',
        keyValue: "={{ $('setarInputs').first().json.tecnico_id }}"
      }]
    }
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [60, 500],
  id: 'w11-check-ctx-exists',
  name: 'CHECK Contexto Existe',
  credentials: SUPA_CRED
};

// Node 2: IF — row exists?
const ifNode = {
  parameters: {
    conditions: {
      number: [{
        value1: "={{ $json.id ? 1 : 0 }}",
        operation: 'equal',
        value2: 1
      }]
    }
  },
  type: 'n8n-nodes-base.if',
  typeVersion: 1,
  position: [280, 500],
  id: 'w11-if-ctx-exists',
  name: 'IF Contexto Existe'
};

// Node 3a: UPDATE — row already exists
const updateCtxNode = {
  parameters: {
    operation: 'update',
    tableId: 'tecnico_contexto_ativo',
    filters: {
      conditions: [{
        keyName: 'tecnico_id',
        condition: 'eq',
        keyValue: "={{ $('setarInputs').first().json.tecnico_id }}"
      }]
    },
    fieldsUi: { fieldValues: setOsFields }
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [500, 380],
  id: 'w11-update-ctx',
  name: 'UPDATE Contexto Ativo',
  credentials: SUPA_CRED
};

// Node 3b: INSERT — no row yet
const insertCtxNode = {
  parameters: {
    operation: 'insert',
    tableId: 'tecnico_contexto_ativo',
    fieldsUi: { fieldValues: setOsFields }
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [500, 620],
  id: 'w11-insert-ctx',
  name: 'INSERT Contexto Ativo',
  credentials: SUPA_CRED
};

// Node 4: Merge the two branches back before Resp set_os
const mergeSetOsNode = {
  parameters: { mode: 'passThrough', output: 'input1' },
  type: 'n8n-nodes-base.merge',
  typeVersion: 2.1,
  position: [720, 500],
  id: 'w11-merge-set-os',
  name: 'Merge Set OS'
};

w11.nodes.push(checkNode, ifNode, updateCtxNode, insertCtxNode, mergeSetOsNode);

// Rewire: Switch Acao (set_os branch) → CHECK → IF → UPDATE/INSERT → Merge → Resp set_os
// First find which branch of Switch Acao was going to UPSERT
// Switch Acao had UPSERT at index 0 of branch 0
w11.connections['Switch Acao'].main[0] = [{ node: 'CHECK Contexto Existe', type: 'main', index: 0 }];
w11.connections['CHECK Contexto Existe'] = { main: [[{ node: 'IF Contexto Existe', type: 'main', index: 0 }]] };
w11.connections['IF Contexto Existe'] = {
  main: [
    [{ node: 'UPDATE Contexto Ativo', type: 'main', index: 0 }],  // true
    [{ node: 'INSERT Contexto Ativo', type: 'main', index: 0 }]   // false
  ]
};
w11.connections['UPDATE Contexto Ativo'] = { main: [[{ node: 'Merge Set OS', type: 'main', index: 0 }]] };
w11.connections['INSERT Contexto Ativo'] = { main: [[{ node: 'Merge Set OS', type: 'main', index: 1 }]] };
w11.connections['Merge Set OS'] = { main: [[{ node: 'Resp set_os', type: 'main', index: 0 }]] };

fs.writeFileSync(w11Path, JSON.stringify(w11, null, 2));
console.log('✅ W11: UPSERT replaced with CHECK → IF → UPDATE/INSERT');


// ═══════════════════════════════════════════════════════════════
// FIX 2 — W10: Replace postgres node with native Supabase nodes
// ═══════════════════════════════════════════════════════════════
const w10Path = path.join(DIR, 'W10 - Tool - Cancelar OS.json');
let w10 = JSON.parse(fs.readFileSync(w10Path, 'utf8'));

// Get position of old node
const oldAuditoria = w10.nodes.find(n => n.name === 'Registrar Auditoria');
const basePos = oldAuditoria ? [...oldAuditoria.position] : [600, 400];

// Remove postgres node
w10.nodes = w10.nodes.filter(n => n.name !== 'Registrar Auditoria');
delete w10.connections['Registrar Auditoria'];

// New Node 1: INSERT audit log via Supabase native
const insertAuditNode = {
  parameters: {
    operation: 'insert',
    tableId: 'os_log_auditoria',
    fieldsUi: {
      fieldValues: [
        { fieldId: 'conversa_id',      fieldValue: "={{ $('Verificar OS').first().json.conversa_id || '' }}" },
        { fieldId: 'tecnico_id',       fieldValue: "={{ $('Verificar OS').first().json.tecnico_id }}" },
        { fieldId: 'os_id',            fieldValue: "={{ $('Verificar OS').first().json.os_id }}" },
        { fieldId: 'acao',             fieldValue: 'cancelada' },
        { fieldId: 'status',           fieldValue: 'sucesso' },
        { fieldId: 'payload_enviado',  fieldValue: "={{ JSON.stringify($('Verificar OS').first().json) }}" },
        { fieldId: 'resposta_api',     fieldValue: "={{ JSON.stringify($input.first().json) }}" },
      ]
    }
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [basePos[0], basePos[1]],
  id: 'w10-insert-auditoria',
  name: 'INSERT Auditoria',
  credentials: SUPA_CRED,
  onError: 'continueRegularOutput'
};

// New Node 2: UPDATE buffer status via Supabase native
const updateBufferNode = {
  parameters: {
    operation: 'update',
    tableId: 'os_buffer',
    filters: {
      conditions: [
        { keyName: 'tecnico_id', condition: 'eq', keyValue: "={{ $('Verificar OS').first().json.tecnico_id }}" },
        { keyName: 'os_id',      condition: 'eq', keyValue: "={{ $('Verificar OS').first().json.os_id }}" }
      ]
    },
    fieldsUi: {
      fieldValues: [
        { fieldId: 'fase',         fieldValue: 'cancelado' },
        { fieldId: 'atualizado_em', fieldValue: "={{ $now }}" }
      ]
    }
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [basePos[0] + 220, basePos[1]],
  id: 'w10-update-buffer',
  name: 'UPDATE Buffer Cancelado',
  credentials: SUPA_CRED,
  onError: 'continueRegularOutput'
};

w10.nodes.push(insertAuditNode, updateBufferNode);

// Rewire: PUT Cancelar OS → INSERT Auditoria → UPDATE Buffer → Confirmar Cancelamento
w10.connections['PUT Cancelar OS'].main[0] = [{ node: 'INSERT Auditoria', type: 'main', index: 0 }];
w10.connections['INSERT Auditoria'] = { main: [[{ node: 'UPDATE Buffer Cancelado', type: 'main', index: 0 }]] };
w10.connections['UPDATE Buffer Cancelado'] = { main: [[{ node: 'Confirmar Cancelamento', type: 'main', index: 0 }]] };

fs.writeFileSync(w10Path, JSON.stringify(w10, null, 2));
console.log('✅ W10: postgres node replaced with native Supabase INSERT + UPDATE');

console.log('\n═══════════════════════════════════════════');
console.log('DONE. Deploy: node deploy_refactor.js W11 W10');
