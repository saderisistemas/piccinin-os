const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'workflows', 'W1 - Protek OS - Agente Principal.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const vandaNode = data.nodes.find(n => n.name === 'Vanda');
if (vandaNode) {
    let prompt = vandaNode.parameters.options.systemMessage || '';

    // 1. Injetar instrução sobre salvar produtos_json/servicos_json
    const regrasItensMarker = "3.2 Para a INCLUSÃO na OS de PRODUTOS, SERVICOS ou equipamentos utilize buscarProdutos e/ou buscarServicos.";
    const novaRegraItens = `${regrasItensMarker}
IMPORTANTE: Quando o técnico CONFIRMAR o produto ou serviço a ser adicionado (após você ter listado as opções), chame IMEDIATAMENTE a ferramenta salvarContexto passando a lista confirmada de itens nos arrays produtos_json ou servicos_json (incluindo produto_id/servico_id, variacao_id, codigo_interno, nome e valor_venda). Nunca deixe isso para o final.`;
    
    if (prompt.includes(regrasItensMarker) && !prompt.includes("produtos_json ou servicos_json")) {
        prompt = prompt.replace(regrasItensMarker, novaRegraItens);
    } else if (!prompt.includes("produtos_json ou servicos_json")) {
        // Fallback genérico se não encontrou o marcador exato
        prompt += "\n\nREGRA EXTRA PRODUTOS: Quando o técnico confirmar itens escolhidos, chame salvarContexto passando dados completos em produtos_json/servicos_json.";
    }

    // 2. Injetar instrução sobre salvar horários
    const regraHorarioMarker = "3.4 FECHAMENTO E AUDITORIA"; // fallback marker
    const horarioInstrucao = `\nREGRA DE HORÁRIOS: Ao registrar hora de chegada (check-in) na mensagem do técnico (ex: \"iniciando OS\"), chame salvarContexto com hora_entrada em ISO format (ex: 2024-01-15T14:30:00). Ao registrar saída/finalização: chame salvarContexto com hora_saida e preencha fase_ia como \"encerramento\".`;
    
    if (!prompt.includes("REGRA DE HORÁRIOS:")) {
        if (prompt.includes(regraHorarioMarker)) {
             prompt = prompt.replace(regraHorarioMarker, regraHorarioMarker + "\n" + horarioInstrucao);
        } else {
             prompt += "\n" + horarioInstrucao;
        }
    }

    vandaNode.parameters.options.systemMessage = prompt;
} else {
    console.log("Nó Vanda não encontrado em W1.");
}

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('✅ W1 (Prompt da Vanda) atualizado.');
