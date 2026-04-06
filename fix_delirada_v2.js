const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGNÓSTICO:
// A memória usa phone_number como sessionKey. Isso faz TODOS os atendimentos
// do mesmo técnico compartilharem a mesma sessão de memória. A Vanda pega
// contexto de atendimentos anteriores (ex: Mercúrio) e continua como se fosse
// o mesmo atendimento. Quando o técnico diz "oi", ela nem pergunta o cliente
// e já abre OS com o client_id velho (que pode estar errado).
//
// SOLUÇÃO:
// 1. Mudar sessionKey para usar id_conversa (Chatwoot conversation ID) 
//    em vez de phone_number — cada conversa terá memória isolada
// 2. Reduzir contextWindow para 12 (suficiente para um atendimento)
// 3. Regras de RESET no system prompt para saudações
// 4. Regra de OBRIGATORIEDADE de buscar cliente antes de criar OS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── FIX 1: Mudar sessionKey da memória ──────────────────────────────────────
const memoria = w1.nodes.find(n => n.name === 'memoriaVanda');
if (memoria) {
  // Usar id_conversa do Chatwoot ao invés do telefone
  // Cada conversa nova no Chatwoot = sessão de memória limpa
  memoria.parameters.sessionKey = "={{ $('setarInfo').item.json.id_conversa }}";
  memoria.parameters.contextWindowLength = 12;
  console.log('✅ FIX 1: sessionKey -> id_conversa (isolamento por conversa)');
  console.log('✅ FIX 1b: contextWindow -> 12 mensagens');
}

// ─── FIX 2: Garantir que setarInfo passe o id_conversa ───────────────────────
const setarInfo = w1.nodes.find(n => n.name === 'setarInfo');
if (setarInfo) {
  const existingAssignments = setarInfo.parameters.assignments.assignments;
  const hasIdConversa = existingAssignments.some(a => a.name === 'id_conversa');
  if (!hasIdConversa) {
    existingAssignments.push({
      id: 'si_conv',
      name: 'id_conversa',
      value: "={{ $('setarInfo4').first().json.msg.id_conversa }}",
      type: 'string'
    });
    console.log('✅ FIX 2: id_conversa adicionado ao setarInfo');
  } else {
    console.log('✅ FIX 2: id_conversa já existe no setarInfo');
  }
}

// ─── FIX 3: Atualizar system prompt com regras anti-delirada V2 ──────────────
const vandaNode = w1.nodes.find(n => n.name === 'Vanda');
if (vandaNode) {
  let sysMsg = vandaNode.parameters.options.systemMessage;

  // Remover a seção anti-desvio anterior (se existir do fix v1)
  const antiDesvioStart = sysMsg.indexOf('## REGRAS DE COMPORTAMENTO — ANTI-DESVIO');
  if (antiDesvioStart !== -1) {
    const nextSection = sysMsg.indexOf('\n## ', antiDesvioStart + 10);
    if (nextSection !== -1) {
      sysMsg = sysMsg.substring(0, antiDesvioStart) + sysMsg.substring(nextSection + 1);
      console.log('✅ FIX 3a: Regras anti-desvio v1 removidas');
    }
  }

  // Inserir versão V2 com regras de RESET e obrigatoriedade
  const newRules = `## REGRAS ABSOLUTAS DE COMPORTAMENTO (PRIORIDADE MÁXIMA)

### REGRA 1 — SAUDAÇÃO = NOVO ATENDIMENTO
Quando o técnico enviar uma saudação como "oi", "olá", "e aí", "como vai", "bom dia", "boa tarde", "boa noite", ou qualquer cumprimento:
- Trate como UM NOVO ATENDIMENTO — contexto limpo
- **ESQUEÇA** qualquer cliente, OS, ou atendimento mencionado antes na conversa
- Responda com UMA FRASE CURTA: "Fala, [nome]! No que posso ajudar?"
- **NÃO** mencione clientes anteriores, OS anteriores ou contextos anteriores
- **NÃO** ofereça menu de opções, sugestões ou lista de funcionalidades
- ESPERE o técnico dizer o que precisa

### REGRA 2 — SEM PROATIVIDADE EXCESSIVA
- Responda SOMENTE ao que foi perguntado ou solicitado
- **NÃO** faça sugestões que o técnico não pediu
- **NÃO** envie múltiplas mensagens quando uma é suficiente
- **NÃO** explique seus processos internos — apenas execute
- Se a resposta cabe em 1 frase, responda em 1 frase

### REGRA 3 — BUSCA OBRIGATÓRIA ANTES DE CRIAR OS
- **JAMAIS** crie uma OS usando cliente_id que esteja apenas na memória da conversa
- Antes de chamar \`criarOS\`, você DEVE ter chamado \`buscarCliente\` NESTA MESMA CONVERSA
- Se o técnico pedir pra abrir OS e você não fez buscarCliente ainda: pergunte o nome do cliente primeiro
- O fluxo OBRIGATÓRIO é: buscarCliente → técnico confirma → criarOS (com o ID retornado pela busca)
- **PROIBIDO** pular a busca e usar IDs de memória/histórico

### REGRA 4 — RESPOSTAS CONCISAS
- Nunca repita informações que o técnico já sabe
- Perguntas são CURTAS: "Nome do cliente?" / "Confirma?" / "Usou material?"
- Não adicione explicações sobre o que você vai fazer — apenas faça
- Não se justifique quando o técnico reclamar — corrija e siga em frente

`;

  // Inserir ANTES de "## SUA FUNÇÃO"
  const insertPoint = sysMsg.indexOf('## SUA FUNÇÃO');
  if (insertPoint !== -1) {
    sysMsg = sysMsg.substring(0, insertPoint) + newRules + '\n' + sysMsg.substring(insertPoint);
    console.log('✅ FIX 3b: Regras anti-delirada V2 inseridas');
  }

  vandaNode.parameters.options.systemMessage = sysMsg;
}

// ─── FIX 4: Garantir modelo e temperatura corretos ───────────────────────────
const vandaLLM = w1.nodes.find(n => n.name === 'gpt-4.1 Vanda');
if (vandaLLM) {
  vandaLLM.parameters.model.value = 'gpt-4.1';
  vandaLLM.parameters.options = { temperature: 0.2 }; // Mais restritivo ainda
  console.log('✅ FIX 4: gpt-4.1, temperatura 0.2');
} else {
  // Tentar com nome antigo
  const llm = w1.nodes.find(n => n.name === 'gpt-4.1-mini Vanda');
  if (llm) {
    llm.parameters.model.value = 'gpt-4.1';
    llm.name = 'gpt-4.1 Vanda';
    llm.parameters.options = { temperature: 0.2 };
    
    // Atualizar conexões
    if (w1.connections['gpt-4.1-mini Vanda']) {
      w1.connections['gpt-4.1 Vanda'] = w1.connections['gpt-4.1-mini Vanda'];
      delete w1.connections['gpt-4.1-mini Vanda'];
    }
    for (const [, nodeConns] of Object.entries(w1.connections)) {
      for (const [, connGroups] of Object.entries(nodeConns || {})) {
        if (Array.isArray(connGroups)) {
          for (const connArray of connGroups) {
            if (Array.isArray(connArray)) {
              for (const conn of connArray) {
                if (conn && conn.node === 'gpt-4.1-mini Vanda') {
                  conn.node = 'gpt-4.1 Vanda';
                }
              }
            }
          }
        }
      }
    }
    console.log('✅ FIX 4: Renomeado e ajustado LLM');
  }
}

// ─── FIX 5: Atualizar descrição da tool criarOS para reforçar ────────────────
const criarOSTool = w1.nodes.find(n => n.name === 'criarOS');
if (criarOSTool) {
  criarOSTool.parameters.description = 
    'Abre nova OS no Bom Saldo. REGRA OBRIGATÓRIA: Você SÓ pode chamar esta ferramenta DEPOIS de ter chamado buscarCliente nesta conversa e o técnico ter confirmado o cliente. Passe: cliente_id (ID numérico retornado pelo buscarCliente NESTA conversa) e observacoes (motivo do atendimento). NUNCA use um cliente_id de memória ou conversa anterior.';
  console.log('✅ FIX 5: Descrição criarOS reforçada');
}

// ─── SALVAR E RESUMO ─────────────────────────────────────────────────────────
fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('\n💾 W1 salvo');
console.log('\n📋 RESUMO V2:');
console.log('  1. sessionKey: phone_number → id_conversa (memória isolada por conversa)');
console.log('  2. contextWindow: 20 → 12 mensagens');
console.log('  3. System prompt: regras de RESET + busca obrigatória');
console.log('  4. Temperatura: 0.3 → 0.2 (mais restritiva)');
console.log('  5. criarOS: descrição reforçada com obrigatoriedade de busca');
console.log('\n🔄 Uploading...');
