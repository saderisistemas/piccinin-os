/**
 * RECONSTRUÇÃO LIMPA DO W11 — Gerenciador Contexto OS
 * 
 * Layout em colunas por ação:
 * 
 * Switch Acao branches:
 *   [0] get_context  → GET Contexto Ativo + GET Buffer OS → Montar Contexto
 *   [1] set_os       → CHECK → IF → UPDATE/INSERT → Resp set_os
 *   [2] checkin      → UPDATE Checkin → GET Ctx → GET OS → Preparar → PATCH → Resp checkin
 *   [3] checkout     → UPDATE Checkout → Resp checkout
 *   [4] switch_os    → GET Atual → INSERT Transicao → UPDATE Switch → Resp switch_os
 *   [5] archive      → UPDATE Archive → Resp archive
 */
const fs = require('fs');
const path = require('path');

const w11Path = path.join(__dirname, 'workflows', 'W11 - Gerenciador Contexto OS.json');
let w11 = JSON.parse(fs.readFileSync(w11Path, 'utf8'));

const SUPA = { supabaseApi: { id: '3TZFb8LBSmrd137a', name: 'Supabase Vanda OS' } };
const BSTOKEN = { name: 'access-token', value: '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8' };
const BSSECRET = { name: 'secret-access-token', value: '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a' };

// ────────────────────────────────────────────────────────
// PRESERVE nodes that are complex and already correct
// (just fix positions)
// ────────────────────────────────────────────────────────

// Nodes to KEEP (by name) — rebuild positions cleanly
const KEEP = [
  'Trigger','setarInputs','Switch Acao',
  'GET Contexto Ativo','GET Buffer OS','Montar Contexto',
  'UPDATE Checkin Contexto','GET Ctx para Checkin','GET OS para Checkin',
  'Preparar Checkin Payload','PATCH Bom Saldo Checkin','Resp checkin',
  'UPDATE Checkout','Resp checkout',
  'GET Atual para Switch','INSERT Transicao','UPDATE Switch OS','Resp switch_os',
  'UPDATE Archive','Resp archive',
  'Resp set_os'
  // Removing: UPSERT Contexto Ativo, CHECK Contexto Existe, IF Contexto Existe,
  //           UPDATE Contexto Ativo, INSERT Contexto Ativo, Merge Set OS
];

// Filter nodes — keep only the ones we want
w11.nodes = w11.nodes.filter(n => KEEP.includes(n.name));

// ─── SET CLEAN POSITIONS ─────────────────────────────────
// X columns: -700 (Trigger), -460 (setarInputs), -200 (Switch)
// Then per branch row, X starts at 100 and steps by 260

const POS = {
  'Trigger':              [-700, 400],
  'setarInputs':          [-460, 400],
  'Switch Acao':          [-200, 400],

  // Branch 0: get_context (Y = 140)
  'GET Contexto Ativo':   [ 100, 100],
  'GET Buffer OS':        [ 100, 240],
  'Montar Contexto':      [ 400, 170],

  // Branch 1: set_os (Y = 380) — just Resp (no more check/if, use Code node instead)
  'Resp set_os':          [ 100, 380],

  // Branch 2: checkin (Y = 560)
  'UPDATE Checkin Contexto': [100, 560],
  'GET Ctx para Checkin':    [360, 560],
  'GET OS para Checkin':     [620, 560],
  'Preparar Checkin Payload':[880, 560],
  'PATCH Bom Saldo Checkin': [1140,560],
  'Resp checkin':            [1400,560],

  // Branch 3: checkout (Y = 740)
  'UPDATE Checkout':      [ 100, 740],
  'Resp checkout':        [ 360, 740],

  // Branch 4: switch_os (Y = 920)
  'GET Atual para Switch':[ 100, 920],
  'INSERT Transicao':     [ 360, 920],
  'UPDATE Switch OS':     [ 620, 920],
  'Resp switch_os':       [ 880, 920],

  // Branch 5: archive (Y = 1100)
  'UPDATE Archive':       [ 100, 1100],
  'Resp archive':         [ 360, 1100],
};

w11.nodes.forEach(n => {
  if (POS[n.name]) n.position = POS[n.name];
});

// ─── REPLACE set_os branch: use a Code node with upsert logic via HTTP (REST API) ───
// Actually: cleanest fix is to use Supabase HTTP API directly for upsert
// OR: keep CHECK+IF+UPDATE/INSERT but as 2 clean nodes using Code to do it via HTTP

// Simpler: use a single Code node that calls Supabase REST API for upsert
// even simpler: use n8n Supabase node with "update" but if fails → insert (with onError)

// PLAN: 
//   set_os branch: 
//     → "Upsert via Code" (Code node that does the logic)  
//     → Resp set_os

const setPosFields = [
  { fieldId: 'tecnico_id',    fieldValue: "={{ $('setarInputs').first().json.tecnico_id }}" },
  { fieldId: 'tecnico_nome',  fieldValue: "={{ $('setarInputs').first().json.tecnico_nome }}" },
  { fieldId: 'os_id',         fieldValue: "={{ $('setarInputs').first().json.os_id }}" },
  { fieldId: 'os_codigo',     fieldValue: "={{ $('setarInputs').first().json.os_codigo }}" },
  { fieldId: 'cliente_id',    fieldValue: "={{ $('setarInputs').first().json.cliente_id }}" },
  { fieldId: 'cliente_nome',  fieldValue: "={{ $('setarInputs').first().json.cliente_nome }}" },
  { fieldId: 'fase',          fieldValue: "={{ $('setarInputs').first().json.fase || 'abertura_os' }}" },
  { fieldId: 'atualizado_em', fieldValue: "={{ $now }}" },
];

// UPDATE node (tries first)
const updateSetOS = {
  parameters: {
    operation: 'update',
    tableId: 'tecnico_contexto_ativo',
    filters: { conditions: [{ keyName: 'tecnico_id', condition: 'eq', keyValue: "={{ $('setarInputs').first().json.tecnico_id }}" }] },
    fieldsUi: { fieldValues: setPosFields }
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [100, 380],
  id: 'w11-update-set-os',
  name: 'UPDATE Set OS',
  credentials: SUPA,
  onError: 'continueRegularOutput'
};

// Code node: decides if UPDATE returned rows; if not → insert
const checkAndInsertSetOS = {
  parameters: {
    jsCode: `// Se o UPDATE não atualizou nenhuma linha (array vazio), faz INSERT
const updated = $input.all();
const inputs = $('setarInputs').first().json;

// Supabase update retorna array com os rows atualizados
// Se vazio, não havia linha -> precisa INSERT
if (!updated || updated.length === 0 || !updated[0].json || !updated[0].json.tecnico_id) {
  // Retorna sinal para INSERT
  return [{ json: { _precisa_insert: true, ...inputs } }];
}
// UPDATE OK
return [{ json: { _precisa_insert: false, ...updated[0].json } }];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [360, 380],
  id: 'w11-check-insert-set-os',
  name: 'Checar e Inserir Set OS'
};

const ifNeedsInsert = {
  parameters: {
    conditions: {
      boolean: [{ value1: "={{ $json._precisa_insert }}", value2: true }]
    }
  },
  type: 'n8n-nodes-base.if',
  typeVersion: 1,
  position: [580, 380],
  id: 'w11-if-needs-insert',
  name: 'Precisa INSERT?'
};

const insertSetOS = {
  parameters: {
    operation: 'insert',
    tableId: 'tecnico_contexto_ativo',
    fieldsUi: { fieldValues: setPosFields }
  },
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position: [800, 300],
  id: 'w11-insert-set-os',
  name: 'INSERT Set OS',
  credentials: SUPA
};

const mergeSetOS = {
  parameters: { mode: 'passThrough', output: 'input1' },
  type: 'n8n-nodes-base.merge',
  typeVersion: 2.1,
  position: [1020, 380],
  id: 'w11-merge-set-os-2',
  name: 'Merge Set OS'
};

// Update Resp set_os position
const respSetOS = w11.nodes.find(n => n.name === 'Resp set_os');
if (respSetOS) respSetOS.position = [1240, 380];

// Add new nodes
w11.nodes.push(updateSetOS, checkAndInsertSetOS, ifNeedsInsert, insertSetOS, mergeSetOS);

// ─── REBUILD CONNECTIONS FROM SCRATCH ────────────────────
w11.connections = {
  'Trigger': { main: [[{ node: 'setarInputs', type: 'main', index: 0 }]] },
  'setarInputs': { main: [[{ node: 'Switch Acao', type: 'main', index: 0 }]] },
  'Switch Acao': {
    main: [
      // [0] get_context
      [
        { node: 'GET Contexto Ativo', type: 'main', index: 0 },
        { node: 'GET Buffer OS', type: 'main', index: 0 },
      ],
      // [1] set_os
      [{ node: 'UPDATE Set OS', type: 'main', index: 0 }],
      // [2] checkin
      [{ node: 'UPDATE Checkin Contexto', type: 'main', index: 0 }],
      // [3] checkout
      [{ node: 'UPDATE Checkout', type: 'main', index: 0 }],
      // [4] switch_os
      [{ node: 'GET Atual para Switch', type: 'main', index: 0 }],
      // [5] archive
      [{ node: 'UPDATE Archive', type: 'main', index: 0 }],
    ]
  },

  // Branch 0 — get_context
  'GET Contexto Ativo': { main: [[{ node: 'Montar Contexto', type: 'main', index: 0 }]] },
  'GET Buffer OS': { main: [[{ node: 'Montar Contexto', type: 'main', index: 1 }]] },

  // Branch 1 — set_os
  'UPDATE Set OS':         { main: [[{ node: 'Checar e Inserir Set OS', type: 'main', index: 0 }]] },
  'Checar e Inserir Set OS': { main: [[{ node: 'Precisa INSERT?', type: 'main', index: 0 }]] },
  'Precisa INSERT?': {
    main: [
      [{ node: 'INSERT Set OS', type: 'main', index: 0 }], // true
      [{ node: 'Merge Set OS', type: 'main', index: 1 }],  // false (UPDATE was ok)
    ]
  },
  'INSERT Set OS': { main: [[{ node: 'Merge Set OS', type: 'main', index: 0 }]] },
  'Merge Set OS':  { main: [[{ node: 'Resp set_os', type: 'main', index: 0 }]] },

  // Branch 2 — checkin
  'UPDATE Checkin Contexto': { main: [[{ node: 'GET Ctx para Checkin', type: 'main', index: 0 }]] },
  'GET Ctx para Checkin':    { main: [[{ node: 'GET OS para Checkin', type: 'main', index: 0 }]] },
  'GET OS para Checkin':     { main: [[{ node: 'Preparar Checkin Payload', type: 'main', index: 0 }]] },
  'Preparar Checkin Payload':{ main: [[{ node: 'PATCH Bom Saldo Checkin', type: 'main', index: 0 }]] },
  'PATCH Bom Saldo Checkin': { main: [[{ node: 'Resp checkin', type: 'main', index: 0 }]] },

  // Branch 3 — checkout
  'UPDATE Checkout': { main: [[{ node: 'Resp checkout', type: 'main', index: 0 }]] },

  // Branch 4 — switch_os
  'GET Atual para Switch':   { main: [[{ node: 'INSERT Transicao', type: 'main', index: 0 }]] },
  'INSERT Transicao':        { main: [[{ node: 'UPDATE Switch OS', type: 'main', index: 0 }]] },
  'UPDATE Switch OS':        { main: [[{ node: 'Resp switch_os', type: 'main', index: 0 }]] },

  // Branch 5 — archive
  'UPDATE Archive': { main: [[{ node: 'Resp archive', type: 'main', index: 0 }]] },
};

fs.writeFileSync(w11Path, JSON.stringify(w11, null, 2));
console.log('✅ W11 rebuilt cleanly. Nodes:', w11.nodes.length);
console.log('   Branches:');
console.log('   [0] get_context → GET x2 → Montar Contexto');
console.log('   [1] set_os      → UPDATE → Check → IF → INSERT(se vazio) → Merge → Resp');
console.log('   [2] checkin     → UPDATE → GET ctx → GET OS → Payload → PATCH → Resp');
console.log('   [3] checkout    → UPDATE → Resp');
console.log('   [4] switch_os   → GET → INSERT transicao → UPDATE → Resp');
console.log('   [5] archive     → UPDATE → Resp');
