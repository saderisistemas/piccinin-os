const fs = require('fs');
const path = require('path');

const w1Path = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const w1 = JSON.parse(fs.readFileSync(w1Path, 'utf8'));

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 1: Configurar temperatura BAIXA no modelo da Vanda (anti-delirada)
// ═══════════════════════════════════════════════════════════════════════════════
const vandaLLM = w1.nodes.find(n => n.name === 'gpt-4.1-mini Vanda');
if (vandaLLM) {
  // Mudar modelo para gpt-4.1 (completo, não mini)
  vandaLLM.parameters.model.value = 'gpt-4.1';
  vandaLLM.name = 'gpt-4.1 Vanda';
  
  // Temperatura 0.3 — criativo o suficiente para conversar naturalmente,
  // mas baixo o suficiente para não inventar coisas
  vandaLLM.parameters.options = {
    temperature: 0.3
  };
  console.log('✅ FIX 1: Modelo -> gpt-4.1, temperatura -> 0.3');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 2: Configurar temperatura 0 no quebrar_mensagem (zero criatividade aqui)
// ═══════════════════════════════════════════════════════════════════════════════
const quebrarLLM = w1.nodes.find(n => n.name === 'gpt-4o-mini Quebrar');
if (quebrarLLM) {
  quebrarLLM.parameters.options = {
    temperature: 0
  };
  console.log('✅ FIX 2: Quebrar mensagem -> temperatura 0');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 3: Reduzir janela de contexto da memória (50 → 20)
// 50 mensagens carrega histórico demais e causa confusão entre atendimentos
// 20 é suficiente para manter o contexto de um atendimento inteiro
// ═══════════════════════════════════════════════════════════════════════════════
const memoria = w1.nodes.find(n => n.name === 'memoriaVanda');
if (memoria) {
  memoria.parameters.contextWindowLength = 20;
  console.log('✅ FIX 3: Janela de memória 50 → 20 mensagens');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 4: Adicionar regras anti-delirada no system prompt
// Injeta seção de contenção logo após o bloco de IDENTIDADE
// ═══════════════════════════════════════════════════════════════════════════════
const vandaNode = w1.nodes.find(n => n.name === 'Vanda');
if (vandaNode) {
  let sysMsg = vandaNode.parameters.options.systemMessage;
  
  const antiDelirioRules = `

---

## REGRAS DE COMPORTAMENTO — ANTI-DESVIO (PRIORIDADE MÁXIMA)

1. **Responda SOMENTE ao que foi perguntado.** Não faça sugestões, ofertas ou comentários extras que o técnico não pediu.
2. **Nunca mencione atendimentos anteriores, clientes de outras conversas, ou contexto passado** a menos que o técnico traga o assunto explicitamente.
3. **Uma pergunta, uma resposta.** Não envie múltiplas mensagens desnecessárias. Se a resposta cabe em uma frase, responda em uma frase.
4. **Não seja proativo demais.** Aguarde o técnico dizer o que precisa. Não ofereça "menu" de opções a menos que ele pergunte "o que você faz?" ou algo similar.
5. **Saudações simples.** Se o técnico cumprimentar ("oi", "como vai", "e aí"), responda com UMA frase curta e espere ele dizer o que precisa. Exemplo: "Fala, Danilo! No que posso ajudar?"
6. **Não repita informações** que o técnico já sabe (nome dele, sua função, etc.) a cada interação.
7. **Nunca invente dados.** Se não tem certeza de algo, pergunte — não assuma.
8. **Sobre horários e datas:** informe somente se o técnico perguntar. Não ofereça funcionalidades de registro de horário espontaneamente.

`;

  // Inserir as regras anti-delírio APÓS o bloco de IDENTIDADE e ANTES de SUA FUNÇÃO
  const insertPoint = sysMsg.indexOf('## SUA FUNÇÃO');
  if (insertPoint !== -1) {
    sysMsg = sysMsg.substring(0, insertPoint) + antiDelirioRules + '\n' + sysMsg.substring(insertPoint);
    console.log('✅ FIX 4: Regras anti-desvio inseridas no system prompt');
  } else {
    // Fallback: adicionar no início
    sysMsg = sysMsg.replace('## IDENTIDADE', '## IDENTIDADE') + antiDelirioRules;
    console.log('⚠️ FIX 4: Regras adicionadas no fim (não achou ponto ideal)');
  }

  vandaNode.parameters.options.systemMessage = sysMsg;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 5: Atualizar nome do workflow para refletir modelo correto
// ═══════════════════════════════════════════════════════════════════════════════
// Atualizar referências ao nome do LLM nas conexões
const oldLLMName = 'gpt-4.1-mini Vanda';
const newLLMName = 'gpt-4.1 Vanda';

if (w1.connections[oldLLMName]) {
  w1.connections[newLLMName] = w1.connections[oldLLMName];
  delete w1.connections[oldLLMName];
  console.log('✅ FIX 5a: Conexões de saída do LLM renomeadas');
}

// Renomear nas conexões de entrada de outros nós
for (const [nodeName, nodeConns] of Object.entries(w1.connections)) {
  if (nodeConns && nodeConns.ai_languageModel) {
    for (const connArray of nodeConns.ai_languageModel) {
      for (const conn of connArray) {
        if (conn.node === oldLLMName) {
          conn.node = newLLMName;
          console.log(`✅ FIX 5b: Conexão ${nodeName} -> LLM atualizada`);
        }
      }
    }
  }
  // Check all connection types
  for (const [connType, connGroups] of Object.entries(nodeConns || {})) {
    if (Array.isArray(connGroups)) {
      for (const connArray of connGroups) {
        if (Array.isArray(connArray)) {
          for (const conn of connArray) {
            if (conn && conn.node === oldLLMName) {
              conn.node = newLLMName;
            }
          }
        }
      }
    }
  }
}

console.log('');

// ═══════════════════════════════════════════════════════════════════════════════
// Salvar
// ═══════════════════════════════════════════════════════════════════════════════
fs.writeFileSync(w1Path, JSON.stringify(w1, null, 2), 'utf8');
console.log('💾 W1 salvo com todas as correções');
console.log('');
console.log('📋 RESUMO DAS MUDANÇAS:');
console.log('  1. Modelo: gpt-4.1-mini → gpt-4.1 (mais preciso)');
console.log('  2. Temperatura Vanda: default → 0.3 (controla criatividade)');
console.log('  3. Temperatura Quebrar: default → 0 (zero criatividade)');
console.log('  4. Memória: 50 → 20 mensagens (menos poluição de contexto)');
console.log('  5. System prompt: regras anti-desvio adicionadas');
console.log('');
console.log('🔄 Agora faça o upload do W1 para o n8n');
