const fs = require('fs');
const path = require('path');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

const basePath = path.join("C:/Users/famil/OneDrive/Documentos/Protek OS", "11-04-2026");

const updates = [
    { file: "W6 - Tool - Atualizar OS Bom Saldo.json", id: "hhFMx49xvO5WSxW9" },
    { file: "W1 - Piccinin Security OS - Agente Principal.json", id: "BZ429y5KhQxWZ76O" }
];

async function fixAndDeploy() {
    for (const item of updates) {
        const filePath = path.join(basePath, item.file);
        if(!fs.existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado: ${filePath}`);
            continue;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // ================= W6 =================
        if (item.file.includes("W6")) {
            const montar = data.nodes.find(n => n.name === 'Montar Payload');
            if (montar) {
                let script = montar.parameters.jsCode;
                
                // 1. Rewrite the time parsing to handle "10:00" explicitly
                if (!script.includes("parseTimeStr")) {
                    const findTimeBlock = `// ── Timestamps de chegada e saída ──`;
                    const timeBlockIndex = script.indexOf(findTimeBlock);
                    if (timeBlockIndex !== -1) {
                        const replaceUntil = `// Relatório técnico + timestamps`;
                        const replaceUntilIndex = script.indexOf(replaceUntil);
                        
                        if (replaceUntilIndex !== -1) {
                            const newTimeLogic = `// ── Timestamps de chegada e saída ──
let tempoMin = null;
let checkinBR = null;
let checkoutBR = null;

const parseTimeStr = (tStr) => {
  if (!tStr) return null;
  if (String(tStr).includes('T')) {
    try {
      const d = new Date(tStr);
      if (!isNaN(d)) return { ms: d.getTime(), str: d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) };
    } catch {}
  }
  const match = String(tStr).match(/([0-9]{1,2}):([0-9]{2})/);
  if (match) {
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    return { ms: (h * 60 + m) * 60000, str: \`\${String(h).padStart(2,'0')}:\${String(m).padStart(2,'0')}\` };
  }
  return null;
}

if (triggerParams.hora_entrada && triggerParams.hora_saida) {
  const p1 = parseTimeStr(triggerParams.hora_entrada);
  const p2 = parseTimeStr(triggerParams.hora_saida);

  if (p1) checkinBR = p1.str;
  if (p2) checkoutBR = p2.str;

  if (p1 && p2) {
    let diff = Math.round((p2.ms - p1.ms) / 60000);
    if (diff < 0) diff += 24 * 60; // crossed midnight
    tempoMin = diff;
  }
} else {
  if (triggerParams.hora_entrada) {
     const p1 = parseTimeStr(triggerParams.hora_entrada);
     if (p1) checkinBR = p1.str;
  }
  if (triggerParams.hora_saida) {
     const p2 = parseTimeStr(triggerParams.hora_saida);
     if (p2) checkoutBR = p2.str;
  }
}

`;
                            script = script.substring(0, timeBlockIndex) + newTimeLogic + script.substring(replaceUntilIndex);
                        }
                    }
                }
                
                // 2. Ensure produtos payload uses fallback if 'produto_id' vs 'id'
                if (!script.includes("const sid = s.servico_id || s.id || s.ID")) {
                    script = script.replace(/const pid = p\.produto_id \|\| p\.id;/g, "const pid = p.produto_id || p.id || p.ID || p.codigo;");
                    script = script.replace(/const sid = s\.servico_id \|\| s\.id;/g, "const sid = s.servico_id || s.id || s.ID || s.codigo;");
                }
                
                // Make sure to also inject hora_entrada/saida in output
                if (!script.includes("hora_entrada: triggerParams.hora_entrada")) {
                  script = script.replace(
                    "return [{ json: { os_id: triggerParams.os_id, os_codigo: triggerParams.os_codigo, payload, tempo_atendimento_min: tempoMin } }];",
                    "return [{ json: { hora_entrada: triggerParams.hora_entrada, hora_saida: triggerParams.hora_saida, os_id: triggerParams.os_id, os_codigo: triggerParams.os_codigo, payload, tempo_atendimento_min: tempoMin } }];"
                  );
                }

                montar.parameters.jsCode = script;
            }

            const supabaseNode = data.nodes.find(n => n.name === 'Fechar OS Supabase');
            if (supabaseNode) {
                const fields = supabaseNode.parameters.fieldsUi.fieldValues;
                const fieldIds = fields.map(f => f.fieldId);
                
                if (!fieldIds.includes('relatorio_tecnico')) {
                    fields.push({ fieldId: 'relatorio_tecnico', fieldValue: "={{ $('Resolver OS ID').first().json.relatorio_tecnico || $('Resolver OS ID').first().json.laudo || '' }}" });
                }
                if (!fieldIds.includes('laudo')) {
                    fields.push({ fieldId: 'laudo', fieldValue: "={{ $('Resolver OS ID').first().json.laudo || $('Resolver OS ID').first().json.relatorio_tecnico || '' }}" });
                }
                if (!fieldIds.includes('equipamento')) {
                    fields.push({ fieldId: 'equipamento', fieldValue: "={{ $('Resolver OS ID').first().json.equipamento || '' }}" });
                }
                if (!fieldIds.includes('defeito')) {
                    fields.push({ fieldId: 'defeito', fieldValue: "={{ $('Resolver OS ID').first().json.defeito || '' }}" });
                }
                if (!fieldIds.includes('solucao')) {
                    fields.push({ fieldId: 'solucao', fieldValue: "={{ $('Resolver OS ID').first().json.solucao || '' }}" });
                }
                if (!fieldIds.includes('produtos_json')) {
                    fields.push({ fieldId: 'produtos_json', fieldValue: "={{ typeof $('Resolver OS ID').first().json.produtos_json === 'string' ? $('Resolver OS ID').first().json.produtos_json : JSON.stringify($('Resolver OS ID').first().json.produtos_json || [])}}" });
                }
                if (!fieldIds.includes('servicos_json')) {
                    fields.push({ fieldId: 'servicos_json', fieldValue: "={{ typeof $('Resolver OS ID').first().json.servicos_json === 'string' ? $('Resolver OS ID').first().json.servicos_json : JSON.stringify($('Resolver OS ID').first().json.servicos_json || [])}}" });
                }
                if (!fieldIds.includes('hora_entrada')) {
                     fields.push({ fieldId: 'hora_entrada', fieldValue: "={{ $('Montar Payload').first().json.hora_entrada }}"});
                } else {
                     const f = fields.find(x => x.fieldId === 'hora_entrada');
                     f.fieldValue = "={{ $('Montar Payload').first().json.hora_entrada }}";
                }
                
                if (!fieldIds.includes('hora_saida')) {
                     fields.push({ fieldId: 'hora_saida', fieldValue: "={{ $('Montar Payload').first().json.hora_saida }}"});
                } else {
                     const f = fields.find(x => x.fieldId === 'hora_saida');
                     f.fieldValue = "={{ $('Montar Payload').first().json.hora_saida }}";
                }
            }
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Patch local aplicado no W6`);
        }

        // ================= W1 =================
        if (item.file.includes("W1")) {
            const atualizarOSNode = data.nodes.find(n => n.name === 'atualizarOS');
            if (atualizarOSNode) {
                const inputs = atualizarOSNode.parameters.workflowInputs.value;
                if (inputs.produtos_json) {
                    inputs.produtos_json = "={{ $fromAI('produtos_json', 'JSON array de produtos. Use produto_id (do option_map), quantidade e valor_venda. Exemplo: [{\"produto_id\":\"123\",\"quantidade\":\"1\",\"valor_venda\":\"350.00\"}]. Se nao houver produtos, envie string vazia.', 'string') }}";
                }
                if (inputs.servicos_json) {
                    inputs.servicos_json = "={{ $fromAI('servicos_json', 'JSON array de servicos. Use servico_id (do option_map), quantidade e valor_venda. Exemplo: [{\"servico_id\":\"456\",\"quantidade\":\"1\",\"valor_venda\":\"200.00\"}]. Se nao houver servicos, envie string vazia.', 'string') }}";
                }
            }
            
            const vandaNode = data.nodes.find(n => n.name === 'Vanda' || n.name === 'AI Agent');
            if (vandaNode) {
                let prompt = vandaNode.parameters?.options?.systemMessage || vandaNode.parameters?.prompt || '';
                
                // Remove the old rule if exists
                if (!prompt.includes("Use SEMPRE os IDs das ferramentas")) {
                    prompt += "\n\nREGRA REFORÇADA PARA IDS DE PRODUTOS/SERVIÇOS:\nQuando usar a ferramenta 'atualizarOS' OU 'salvarContexto', NUNCA envie apenas o nome do produto/serviço. VOCÊ DEVE pegar o 'id' ou 'codigo_interno' que retornou da ferramenta buscarProdutos/buscarServicos, e passar no array do JSON como `produto_id` e `servico_id`. Ex: [{\"produto_id\": \"123\", \"quantidade\": \"1\", \"valor_venda\": \"15.50\"}]. O Bom Saldo VAI RECUSAR se não tiver o ID.";
                }

                if (vandaNode.parameters?.options?.systemMessage !== undefined) {
                    vandaNode.parameters.options.systemMessage = prompt;
                } else {
                    vandaNode.parameters.prompt = prompt;
                }
            }
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Patch local aplicado no W1`);
        }

        // ================= DEPLOY =================
        const payload = {
            name: data.name,
            nodes: data.nodes || [],
            connections: data.connections || {},
            settings: { executionOrder: "v1" }
        };

        try {
            const resp = await fetch(`${baseUrl}/${item.id}`, {
                method: 'PUT',
                headers: {
                    'X-N8N-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const body = await resp.text();
            
            if (resp.status >= 200 && resp.status < 300) {
                console.log(`🚀 [Deploy N8N] ${item.file} RESTAURADO E ATUALIZADO! (ID: ${item.id})`);
            } else {
                console.error(`❌ [Erro Deploy N8N] ${item.file} (${resp.status}): ${body}`);
            }
        } catch (e) {
            console.error(`❌ EXCEPTION deploy ${item.file}: ${e.message}`);
        }
    }
}

fixAndDeploy();
