const fs = require('fs');
const path = require('path');

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzc3MTFiOS03YjU5LTRlZDctYWRlNi1kZDYzNjMxOTVlZTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NDg1NjkxfQ.LylKOiQ1uccqMiOL5A067Db7IeI2g5JffL6oWAWAuYY";
const baseUrl = "https://piccininsecurity-n8n.cloudfy.live/api/v1/workflows";

const w7Path = path.join("C:/Users/famil/OneDrive/Documentos/Protek OS/11-04-2026", "W7 - Tool - Salvar Evidencias Drive (1).json");
const w7LiveId = "0HxglGmNg0W0JYIs";

async function fixW7Supabase() {
    console.log("🛠️ Iniciando patch no W7 (Correção de Update nulo do link)...");
    
    if(!fs.existsSync(w7Path)) {
        console.error("Arquivo W7 não encontrado em:", w7Path);
        return;
    }

    const data = JSON.parse(fs.readFileSync(w7Path, 'utf8'));

    const updateNode = data.nodes.find(n => n.name === 'Atualizar Evidencia Supabase');
    if (updateNode) {
        // Fix link_pasta_drive mapping
        const fieldValues = updateNode.parameters.fieldsUi.fieldValues;
        for (let field of fieldValues) {
            if (field.fieldId === 'link_pasta_drive') {
                field.fieldValue = "={{ $('Retornar Link').first().json.link_drive }}";
                console.log("✅ Atualizado mapeamento de link_pasta_drive!");
            }
            if (field.fieldId === 'qtd_evidencias') {
                // Ensure it reads from the $json (output of Buscar OS)
                field.fieldValue = "={{ ($json.qtd_evidencias || 0) + 1 }}";
            }
        }
    }

    fs.writeFileSync(w7Path, JSON.stringify(data, null, 2));

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

        if (resp.status >= 200 && resp.status < 300) {
            console.log(`🚀 [Deploy N8N] W7 ATUALIZADO NO SERVIDOR! (ID: ${w7LiveId})`);
        } else {
            console.error(`❌ [Erro Deploy N8N] (${resp.status}): ${await resp.text()}`);
        }
    } catch (e) {
        console.error(`❌ EXCEPTION: ${e.message}`);
    }
}

fixW7Supabase();
