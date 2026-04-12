const fs = require('fs');
const path = require('path');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

const w1Path = path.join("C:/Users/famil/OneDrive/Documentos/Protek OS/11-04-2026", "W1 - Piccinin Security OS - Agente Principal.json");
const w1LiveId = "BZ429y5KhQxWZ76O";

async function fixW1() {
    const data = JSON.parse(fs.readFileSync(w1Path, 'utf8'));
    const vandaNode = data.nodes.find(n => n.name === 'Vanda' || n.name === 'AI Agent');

    if (!vandaNode) return console.log("Nó Vanda não encontrado.");

    let prompt = vandaNode.parameters.options.systemMessage || vandaNode.parameters.prompt;

    // 1. Remover duplicações feitas pelo último script
    const regraProdutos = "REGRA EXTRA PRODUTOS: Quando o técnico confirmar itens escolhidos, chame salvarContexto passando dados completos em produtos_json/servicos_json.";
    const regraHorarios = "REGRA DE HORÁRIOS: Ao registrar hora de chegada (check-in) na mensagem do técnico (ex: \"iniciando OS\"), chame salvarContexto com hora_entrada em ISO format (ex: 2024-01-15T14:30:00). Ao registrar saída/finalização: chame salvarContexto com hora_saida e preencha fase_ia como \"encerramento\".";

    // Regex global to strip out multiple repeats of these blocks
    prompt = prompt.split(regraProdutos).join("");
    prompt = prompt.split(regraHorarios).join("");

    // 2. Localizar o bloco de salvamento problemático
    const salvarContextoBlock = "## REGRA DE SALVAMENTO DE CONTEXTO (MUITO IMPORTANTE)\nSempre que o técnico fornecer UMA NOVA INFORMAÇÃO (ex: equipamento, defeito, causa, solução, observação, nome do cliente, etc.), você DEVE chamar a tool 'salvarContexto' IMEDIATAMENTE para persistir os dados da OS no banco. NÃO ESPERE o final do atendimento ou o fechamento para salvar. Salve conforme os dados vão chegando!\n";
    
    // Substituir pela regra correta E SEGURA
    const novoSalvarContextoBlock = `## REGRA DE SALVAMENTO DE CONTEXTO (MUITO IMPORTANTE)
Sempre que o técnico fornecer UMA NOVA INFORMAÇÃO (ex: equipamento, defeito, causa, resolução, etc.), você DEVE chamar a tool 'salvarContexto' para persistir os dados.
🚫 LIMITAÇÃO CRÍTICA: Você NUNCA pode chamar salvarContexto se ainda não existir um 'os_codigo'. Se a OS ainda não foi aberta no ERP (via criarOS), NÃO CHAME salvarContexto.
`;

    if (prompt.includes(salvarContextoBlock)) {
        prompt = prompt.replace(salvarContextoBlock, novoSalvarContextoBlock);
    } else if (!prompt.includes("LIMITAÇÃO CRÍTICA")) {
        prompt += "\n" + novoSalvarContextoBlock;
    }

    // 3. Adicionar as regras de produto e hora uma vez só.
    prompt += `\n${regraProdutos}\n\n${regraHorarios}\n`;

    // Apply back
    if (vandaNode.parameters.options.systemMessage !== undefined) {
        vandaNode.parameters.options.systemMessage = prompt;
    } else {
        vandaNode.parameters.prompt = prompt;
    }

    fs.writeFileSync(w1Path, JSON.stringify(data, null, 2));
    
    // 4. Deploy!
    const payload = {
        name: data.name,
        nodes: data.nodes || [],
        connections: data.connections || {},
        settings: { executionOrder: "v1" }
    };

    const resp = await fetch(`${baseUrl}/${w1LiveId}`, {
        method: 'PUT',
        headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (resp.status >= 200 && resp.status < 300) {
        console.log("✅ W1 Prompt Fixed & Deployed!");
    } else {
        console.log("❌ Failed to deploy W1: " + await resp.text());
    }
}

fixW1();
