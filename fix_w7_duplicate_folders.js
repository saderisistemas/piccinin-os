const fs = require('fs');
const path = require('path');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

const w7Path = path.join("C:/Users/famil/OneDrive/Documentos/Protek OS/11-04-2026", "W7 - Tool - Salvar Evidencias Drive (1).json");
const w7LiveId = "0HxglGmNg0W0JYIs";

async function fixW7() {
    console.log("🛠️ Iniciando patch no W7 (Duplicação de Pastas & Link no Supabase)...");
    
    if(!fs.existsSync(w7Path)) {
        console.error("Arquivo W7 não encontrado em:", w7Path);
        return;
    }

    const data = JSON.parse(fs.readFileSync(w7Path, 'utf8'));

    // 1. Corrigir Nó 'Retornar Link'
    const retornarLink = data.nodes.find(n => n.name === 'Retornar Link');
    if (retornarLink) {
        let script = retornarLink.parameters.jsCode;
        
        // Substituindo o extraction falho de parent list pelo ID exato do Merge previo garantido.
        const brokenCode = "const pastaId = arquivo.parents ? arquivo.parents[0] : '';";
        const fixedCode = "const pastaId = $('Merge Upload').first().json.folderId;";
        
        if (script.includes(brokenCode)) {
            script = script.replace(brokenCode, fixedCode);
            retornarLink.parameters.jsCode = script;
            console.log("✅ Extract folderId corrigido no nó Retornar Link.");
        } else if (!script.includes("pastaId = $('Merge Upload')")) {
            console.log("⚠️ Nó Retornar Link parece já estar diferente.");
        }
    }

    // 2. Definir Controle de Simultaneidade nas configs do n8n 
    // Garante que uploads paralelos pela API Evolution fiquem na fila (wait) para não recriar a pasta antes do update no Supabase.
    data.settings = {
        executionOrder: "v1",
        callerPolicy: "workflowsFromSameOwner",
        concurrencyControl: true,
        concurrencyControlLimit: 1,
        concurrencyControlMode: "wait"
    };

    // Salvar o arquivo localmente
    fs.writeFileSync(w7Path, JSON.stringify(data, null, 2));

    // 3. Fazer o PUT da Payload inteira
    const payload = {
        name: data.name,
        nodes: data.nodes || [],
        connections: data.connections || {},
        settings: { executionOrder: "v1" }
    };

    try {
        const resp = await fetch(`${baseUrl}/${w7LiveId}`, {
            method: 'PUT',
            headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const respBody = await resp.text();

        if (resp.status >= 200 && resp.status < 300) {
            console.log(`🚀 [Deploy N8N] W7 ATUALIZADO NO SERVIDOR! (ID: ${w7LiveId})`);
        } else {
            console.error(`❌ [Erro Deploy N8N] (${resp.status}): ${respBody}`);
        }
    } catch (e) {
        console.error(`❌ EXCEPTION deploy W7: ${e.message}`);
    }
}

fixW7();
