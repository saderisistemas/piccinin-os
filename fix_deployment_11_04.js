const fs = require('fs');
const path = require('path');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

const basePath = path.join("C:/Users/famil/OneDrive/Documentos/Protek OS", "11-04-2026");

const updates = [
    { file: "W4 - Tool - Buscar Produtos Bom Saldo.json", id: "iJRYEqsLzCVACG0j" },
    { file: "W6 - Tool - Atualizar OS Bom Saldo.json", id: "hhFMx49xvO5WSxW9" },
    { file: "W8 - Tool - Salvar Contexto OS.json", id: "cYIrVtfY8qfkwj38" },
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

        /* APLICA AS CORREÇÕES CIRÚRGICAS PARA CADA ARQUIVO ESPECÍFICO */

        // ================= W8 =================
        if (item.file.includes("W8")) {
            const trigger = data.nodes.find(n => n.name === 'Trigger');
            if (trigger) {
                const values = trigger.parameters.workflowInputs.values;
                if (!values.find(v => v.name === 'produtos_json')) values.push({ name: 'produtos_json' });
                if (!values.find(v => v.name === 'servicos_json')) values.push({ name: 'servicos_json' });
            }

            const validar = data.nodes.find(n => n.name === 'Validar Params');
            if (validar) {
                let script = validar.parameters.jsCode;
                if (!script.includes("'produtos_json'")) {
                    script = script.replace(
                        "  'status_os', 'fase_ia', 'motivo_cancelamento'",
                        "  'status_os', 'fase_ia', 'motivo_cancelamento',\n  'produtos_json', 'servicos_json'"
                    );
                }
                validar.parameters.jsCode = script;
            }

            const updateOS = data.nodes.find(n => n.name === 'UPDATE OS');
            if (updateOS) {
                const fields = updateOS.parameters.fieldsUi.fieldValues;
                if (!fields.find(f => f.fieldId === 'produtos_json')) {
                    fields.push({ fieldId: 'produtos_json', fieldValue: '={{ $json.produtos_json !== undefined ? (typeof $json.produtos_json === \'string\' ? $json.produtos_json : JSON.stringify($json.produtos_json)) : null }}' });
                }
                if (!fields.find(f => f.fieldId === 'servicos_json')) {
                    fields.push({ fieldId: 'servicos_json', fieldValue: '={{ $json.servicos_json !== undefined ? (typeof $json.servicos_json === \'string\' ? $json.servicos_json : JSON.stringify($json.servicos_json)) : null }}' });
                }
            }

            const insertOS = data.nodes.find(n => n.name === 'INSERT OS');
            if (insertOS) {
                const fields = insertOS.parameters.fieldsUi.fieldValues;
                if (!fields.find(f => f.fieldId === 'produtos_json')) {
                    fields.push({ fieldId: 'produtos_json', fieldValue: '={{ $json.produtos_json !== undefined ? (typeof $json.produtos_json === \'string\' ? $json.produtos_json : JSON.stringify($json.produtos_json)) : undefined }}' });
                }
                if (!fields.find(f => f.fieldId === 'servicos_json')) {
                    fields.push({ fieldId: 'servicos_json', fieldValue: '={{ $json.servicos_json !== undefined ? (typeof $json.servicos_json === \'string\' ? $json.servicos_json : JSON.stringify($json.servicos_json)) : undefined }}' });
                }
            }
            // Save modified file back
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Patch local aplicado no W8`);
        }

        // ================= W4 =================
        if (item.file.includes("W4")) {
            const formatar = data.nodes.find(n => n.name === 'Formatar Produtos');
            if (formatar) {
                let script = formatar.parameters.jsCode;
                if (!script.includes('codigo_interno: p.codigo')) {
                    script = script.replace(
                        "option_map[String(p.index)] = { id: p.id, variacao_id: p.variacao_id, nome: p.nome, valor_venda: p.valor_venda };",
                        "option_map[String(p.index)] = { id: p.id, variacao_id: p.variacao_id, nome: p.nome, codigo_interno: p.codigo, valor_venda: p.valor_venda };"
                    );
                    formatar.parameters.jsCode = script;
                }
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Patch local aplicado no W4`);
        }

        // ================= W6 =================
        if (item.file.includes("W6")) {
            const resolver = data.nodes.find(n => n.name === 'Resolver OS ID');
            if (resolver) {
                let script = resolver.parameters.jsCode;
                script = script.replace(
                    "const horaSaida = trigger.hora_saida || supabase.hora_saida || new Date().toISOString();",
                    "const horaSaida = trigger.hora_saida || supabase.hora_saida || null;"
                );
                if(!script.includes('produtos_json_supabase')) {
                    script = script.replace(
                        "hora_saida: horaSaida",
                        "hora_saida: horaSaida,\n  produtos_json_supabase: supabase.produtos_json,\n  servicos_json_supabase: supabase.servicos_json"
                    );
                }
                resolver.parameters.jsCode = script;
            }

            const montar = data.nodes.find(n => n.name === 'Montar Payload');
            if (montar) {
                let script = montar.parameters.jsCode;
                const oldBlock = `try { produtos = typeof triggerParams.produtos_json === 'string' ? JSON.parse(triggerParams.produtos_json) : (triggerParams.produtos_json || []); } catch(e) {}\n    try { servicos = typeof triggerParams.servicos_json === 'string' ? JSON.parse(triggerParams.servicos_json) : (triggerParams.servicos_json || []); } catch(e) {}`;
                
                const newBlock = `// Pegar JSON do trigger ou tentar fallback do Supabase
    try { produtos = typeof triggerParams.produtos_json === 'string' ? JSON.parse(triggerParams.produtos_json) : (triggerParams.produtos_json || []); } catch(e) {}
    if (produtos.length === 0 && triggerParams.produtos_json_supabase) {
      try { produtos = typeof triggerParams.produtos_json_supabase === 'string' ? JSON.parse(triggerParams.produtos_json_supabase) : triggerParams.produtos_json_supabase; } catch(e) {}
    }

    try { servicos = typeof triggerParams.servicos_json === 'string' ? JSON.parse(triggerParams.servicos_json) : (triggerParams.servicos_json || []); } catch(e) {}
    if (servicos.length === 0 && triggerParams.servicos_json_supabase) {
      try { servicos = typeof triggerParams.servicos_json_supabase === 'string' ? JSON.parse(triggerParams.servicos_json_supabase) : triggerParams.servicos_json_supabase; } catch(e) {}
    }`;

                if (!script.includes('triggerParams.produtos_json_supabase')) {
                    if (script.includes("try { produtos = typeof trigger")) {
                         script = script.replace(oldBlock, newBlock);
                         montar.parameters.jsCode = script;
                    }
                }
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Patch local aplicado no W6`);
        }

        // ================= W1 =================
        if (item.file.includes("W1")) {
            const vandaNode = data.nodes.find(n => n.name === 'Vanda' || n.name === 'AI Agent');
            if (vandaNode) {
                let prompt = vandaNode.parameters?.options?.systemMessage || vandaNode.parameters?.prompt || '';
                
                const regrasItensMarker = "3.2 Para a INCLUSÃO na OS de PRODUTOS, SERVICOS ou equipamentos utilize buscarProdutos e/ou buscarServicos.";
                const novaRegraItens = `${regrasItensMarker}\nIMPORTANTE: Quando o técnico CONFIRMAR o produto ou serviço a ser adicionado (após você ter listado as opções), chame IMEDIATAMENTE a ferramenta salvarContexto passando a lista confirmada de itens nos arrays produtos_json ou servicos_json (incluindo produto_id/servico_id, variacao_id, codigo_interno, nome e valor_venda). Nunca deixe isso para o final.`;
                
                if (prompt.includes(regrasItensMarker) && !prompt.includes("produtos_json ou servicos_json")) {
                    prompt = prompt.replace(regrasItensMarker, novaRegraItens);
                } else if (!prompt.includes("produtos_json ou servicos_json")) {
                    prompt += "\n\nREGRA EXTRA PRODUTOS: Quando o técnico confirmar itens escolhidos, chame salvarContexto passando dados completos em produtos_json/servicos_json.";
                }

                const regraHorarioMarker = "3.4 FECHAMENTO E AUDITORIA";
                const horarioInstrucao = `\nREGRA DE HORÁRIOS: Ao registrar hora de chegada (check-in) na mensagem do técnico (ex: "iniciando OS"), chame salvarContexto com hora_entrada em ISO format (ex: 2024-01-15T14:30:00). Ao registrar saída/finalização: chame salvarContexto com hora_saida e preencha fase_ia como "encerramento".`;
                
                if (!prompt.includes("REGRA DE HORÁRIOS:")) {
                    if (prompt.includes(regraHorarioMarker)) {
                        prompt = prompt.replace(regraHorarioMarker, regraHorarioMarker + "\n" + horarioInstrucao);
                    } else {
                        prompt += "\n" + horarioInstrucao;
                    }
                }

                if (vandaNode.parameters?.options?.systemMessage !== undefined) {
                    vandaNode.parameters.options.systemMessage = prompt;
                } else {
                    vandaNode.parameters.prompt = prompt;
                }
                
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`✅ Patch local aplicado no W1`);
            } else {
                console.warn(`⚠️ Nó principal da Vanda não encontrado no W1.`);
            }
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
