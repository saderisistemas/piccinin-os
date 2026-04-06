/**
 * FIX DEFINITIVO W3b — Criar OS Bom Saldo
 * 
 * Problemas corrigidos:
 * 1. Posições invertidas (Resolver Cliente antes do Trigger)
 * 2. Nome com parênteses quebra a busca da API
 * 3. W11 Set OS Ativa sem workflowInputs
 * 4. Join Saidas: chooseBranch (não existe passThrough no v2.1)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const w3bPath = path.join(__dirname, 'workflows', 'W3b - Tool - Criar OS.json');
let w3b = JSON.parse(fs.readFileSync(w3bPath, 'utf8'));

// Rebuild nodes array from scratch with correct positions and configs
const nodes = [
  // ── Trigger ──
  {
    parameters: {
      workflowInputs: {
        values: [
          { name: 'cliente_id' },
          { name: 'tecnico_id' },
          { name: 'tecnico_nome' },
          { name: 'situacao_id' },
          { name: 'observacoes' },
          { name: 'cliente_nome' }
        ]
      }
    },
    type: 'n8n-nodes-base.executeWorkflowTrigger',
    typeVersion: 1.1,
    position: [-800, 400],
    id: crypto.randomUUID(),
    name: 'Trigger'
  },

  // ── Limpar Nome (Code) — strip parênteses, normalizar ──
  {
    parameters: {
      jsCode: `// Limpar nome do cliente para busca na API
const input = $input.first().json;
let nome = (input.cliente_nome || '').trim();

// Remover tudo entre parênteses no final: "ABC (XYZ)" → "ABC"
nome = nome.replace(/\\s*\\(.*?\\)\\s*$/g, '').trim();

// Se o nome tem mais de 5 palavras, pegar só as 3 primeiras para busca mais ampla
const palavras = nome.split(/\\s+/);
const nomeBusca = palavras.length > 5 ? palavras.slice(0, 3).join(' ') : nome;

return [{ json: { ...input, cliente_nome_busca: nomeBusca, cliente_nome_original: input.cliente_nome } }];`
    },
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-560, 400],
    id: crypto.randomUUID(),
    name: 'Limpar Nome'
  },

  // ── Resolver Cliente (HTTP GET) ──
  {
    parameters: {
      method: 'GET',
      url: "=https://bomsaldo.com/api/clientes/?nome={{ encodeURIComponent($json.cliente_nome_busca) }}&ativo=1&limit=10",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'access-token', value: '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8' },
          { name: 'secret-access-token', value: '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a' }
        ]
      },
      options: {}
    },
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [-320, 400],
    id: crypto.randomUUID(),
    name: 'Resolver Cliente',
    onError: 'continueRegularOutput'
  },

  // ── Validar Parametros (Code) — resolve ID real ──
  {
    parameters: {
      jsCode: `// ─── RESOLVER CLIENTE ID REAL ─────────────────────────────────
const triggerParams = $('Limpar Nome').first().json;
const apiResp = $input.first().json;
const clientes = (apiResp.data || []);

let clienteIdReal = null;
let clienteNomeReal = null;

if (clientes.length > 0) {
  const nomeOriginal = (triggerParams.cliente_nome_original || '').toLowerCase().trim();
  const nomeBusca = (triggerParams.cliente_nome_busca || '').toLowerCase().trim();
  
  // 1. Match exato pelo nome original (sem parênteses)
  let match = clientes.find(c =>
    (c.nome || '').toLowerCase().trim() === nomeBusca ||
    (c.razao_social || '').toLowerCase().trim() === nomeBusca
  );
  
  // 2. Match contém o nome de busca
  if (!match) {
    match = clientes.find(c =>
      (c.nome || '').toLowerCase().includes(nomeBusca) ||
      nomeBusca.includes((c.nome || '').toLowerCase())
    );
  }
  
  // 3. Match parcial com nome original (pode ter parênteses)
  if (!match) {
    match = clientes.find(c =>
      nomeOriginal.includes((c.nome || '').toLowerCase()) ||
      (c.nome || '').toLowerCase().includes(nomeOriginal.replace(/\\s*\\(.*?\\)\\s*$/g, ''))
    );
  }
  
  // 4. Fallback: primeiro resultado da API (mais relevante)
  if (!match) match = clientes[0];
  
  clienteIdReal = String(match.id);
  clienteNomeReal = match.nome;
}

// Ultima chance: usar o ID que a LLM mandou
if (!clienteIdReal && triggerParams.cliente_id && /^[0-9]{5,}$/.test(String(triggerParams.cliente_id).trim())) {
  clienteIdReal = String(triggerParams.cliente_id).trim();
}

if (!clienteIdReal) {
  return [{ json: { 
    error: "Nao encontrei o cliente '" + (triggerParams.cliente_nome_original || '???') + "' no Bom Saldo. Pergunte o nome correto ao tecnico.",
    sucesso: false 
  } }];
}

return [{ json: {
  cliente_id: clienteIdReal,
  cliente_nome_validado: clienteNomeReal || triggerParams.cliente_nome_original,
  tecnico_id: triggerParams.tecnico_id,
  tecnico_nome: triggerParams.tecnico_nome,
  situacao_id: triggerParams.situacao_id,
  observacoes: triggerParams.observacoes
} }];`
    },
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-60, 400],
    id: crypto.randomUUID(),
    name: 'Validar Parametros'
  },

  // ── POST Criar OS ──
  {
    parameters: {
      method: 'POST',
      url: 'https://bomsaldo.com/api/ordens_servicos/',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'access-token', value: '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8' },
          { name: 'secret-access-token', value: '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a' },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ cliente_id: parseInt($json.cliente_id), situacao_id: parseInt($json.situacao_id) || 6237497, data: $now.format('yyyy-MM-dd'), observacoes: $json.observacoes || 'OS aberta via Assistente Vanda - Piccinin Security', vendedor_id: 906858 }) }}",
      options: {}
    },
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [180, 400],
    id: crypto.randomUUID(),
    name: 'POST Criar OS',
    onError: 'continueRegularOutput'
  },

  // ── Formatar Resposta ──
  {
    parameters: {
      jsCode: `const payloadJson = $('Validar Parametros').first().json;
if (payloadJson.error) {
  return [{ json: { resultado: payloadJson.error, os_id: null, sucesso: false } }];
}

const resp = $input.first().json;

if (resp.status === 'error' || resp.error || resp.message || (resp.statusCode && resp.statusCode >= 400)) {
  const detalheErro = resp.message || resp.error || JSON.stringify(resp);
  return [{ json: {
    resultado: 'Erro ao criar a OS: ' + detalheErro + '. Verifique se o cliente esta cadastrado corretamente.',
    os_id: null,
    sucesso: false
  } }];
}

if (resp.code === 200 && resp.data) {
  const os = resp.data;
  return [{ json: {
    resultado: 'OS #' + os.codigo + ' aberta com sucesso. ID interno: ' + os.id + '.',
    os_id:     String(os.id),
    os_codigo: String(os.codigo),
    cliente_id: String(payloadJson.cliente_id),
    cliente_nome: payloadJson.cliente_nome_validado,
    tecnico_id: payloadJson.tecnico_id || null,
    tecnico_nome: payloadJson.tecnico_nome || null,
    nome_cliente: os.nome_cliente,
    sucesso: true
  } }];
} else {
  return [{ json: {
    resultado: 'Erro desconhecido ao abrir OS: ' + JSON.stringify(resp),
    os_id: null,
    sucesso: false
  } }];
}`
    },
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [420, 400],
    id: crypto.randomUUID(),
    name: 'Formatar Resposta'
  },

  // ── OS Criada OK? (IF) ──
  {
    parameters: {
      conditions: {
        boolean: [{ value1: '={{ $json.sucesso }}', value2: true }]
      }
    },
    type: 'n8n-nodes-base.if',
    typeVersion: 1,
    position: [660, 400],
    id: crypto.randomUUID(),
    name: 'OS Criada OK?'
  },

  // ── W11 Set OS Ativa — COM workflowInputs corretos ──
  {
    parameters: {
      workflowId: { __rl: true, value: 'kWjI5bVdGdATsuiH', mode: 'id' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          tecnico_id: '={{ $json.tecnico_id }}',
          tecnico_nome: '={{ $json.tecnico_nome }}',
          acao: 'set_os',
          os_id: '={{ $json.os_id }}',
          os_codigo: '={{ $json.os_codigo }}',
          cliente_id: '={{ $json.cliente_id }}',
          cliente_nome: '={{ $json.cliente_nome || $json.nome_cliente }}',
          fase: 'abertura_os'
        },
        schema: [
          { id: 'tecnico_id', displayName: 'tecnico_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false },
          { id: 'tecnico_nome', displayName: 'tecnico_nome', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false },
          { id: 'acao', displayName: 'acao', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false },
          { id: 'os_id', displayName: 'os_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false },
          { id: 'os_codigo', displayName: 'os_codigo', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false },
          { id: 'cliente_id', displayName: 'cliente_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false },
          { id: 'cliente_nome', displayName: 'cliente_nome', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false },
          { id: 'fase', displayName: 'fase', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: false }
        ]
      },
      options: {}
    },
    type: 'n8n-nodes-base.executeWorkflow',
    typeVersion: 1.1,
    position: [900, 280],
    id: crypto.randomUUID(),
    name: 'W11 Set OS Ativa'
  },

  // ── Retornar Resultado ──
  {
    parameters: {
      jsCode: `const resp = $('Formatar Resposta').first().json;
return [{ json: {
  resultado:    resp.resultado,
  os_id:        resp.os_id,
  os_codigo:    resp.os_codigo,
  nome_cliente: resp.nome_cliente,
  sucesso:      resp.sucesso
} }];`
    },
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1140, 400],
    id: crypto.randomUUID(),
    name: 'Retornar Resultado'
  }
];

// Build connections (linear flow, no merge needed)
const connections = {
  'Trigger':             { main: [[{ node: 'Limpar Nome',         type: 'main', index: 0 }]] },
  'Limpar Nome':         { main: [[{ node: 'Resolver Cliente',    type: 'main', index: 0 }]] },
  'Resolver Cliente':    { main: [[{ node: 'Validar Parametros',  type: 'main', index: 0 }]] },
  'Validar Parametros':  { main: [[{ node: 'POST Criar OS',       type: 'main', index: 0 }]] },
  'POST Criar OS':       { main: [[{ node: 'Formatar Resposta',   type: 'main', index: 0 }]] },
  'Formatar Resposta':   { main: [[{ node: 'OS Criada OK?',       type: 'main', index: 0 }]] },
  'OS Criada OK?': {
    main: [
      [{ node: 'W11 Set OS Ativa', type: 'main', index: 0 }],   // true → salva contexto
      [{ node: 'Retornar Resultado', type: 'main', index: 0 }]  // false → retorna erro direto
    ]
  },
  'W11 Set OS Ativa':    { main: [[{ node: 'Retornar Resultado', type: 'main', index: 0 }]] },
};

w3b.nodes = nodes;
w3b.connections = connections;

fs.writeFileSync(w3bPath, JSON.stringify(w3b, null, 2));
console.log('✅ W3b reescrito do zero');
console.log('   Fluxo: Trigger → Limpar Nome → Resolver Cliente → Validar → POST → Formatar → IF → W11/Retornar');
console.log('   Fixes:');
console.log('     - Posições corrigidas (esquerda→direita)');
console.log('     - Novo nó "Limpar Nome" remove parênteses e limita busca');
console.log('     - W11 Set OS Ativa agora passa TODOS os inputs (tecnico_id, os_id, acao, etc)');
console.log('     - Join Saidas removido (desnecessário, simplificado para fluxo direto)');
