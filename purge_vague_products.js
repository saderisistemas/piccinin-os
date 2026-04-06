const fs = require('fs');

const TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const SECRET = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';
const API_URL = 'https://bomsaldo.com/api';

async function fetchAll(endpoint) {
    let page = 1, all = [];
    while (true) {
        let r = await fetch(API_URL + endpoint + '?pagina=' + page + '&limit=100', { headers: { 'access-token': TOKEN, 'secret-access-token': SECRET } });
        let j = await r.json();
        if (!j.data || j.data.length === 0) break;
        all.push(...j.data);
        page++;
    }
    return all;
}

const BRANDS = ['INTELBRAS', 'HIKVISION', 'VIZZION', 'JFL', 'GIGA', 'POSITRON', 'PPA', 'ROSSI', 'PECCININ', 'NICE', 'CONTROL ID'];

// The definitive "Keep" list for generic archetypes
const KEEP_GENERIC = [
    'CÂMERA', 'CÂMERA BULLET', 'CÂMERA DOME', 'CÂMERA IP', 'CÂMERA SPEED DOME',
    'CABO UTP', 'CABO COAXIAL', 'CABO DE ALARME', 'CABO CFTV', 'CABO ÓPTICO',
    'FONTE 12V', 'FONTE 24V', 'FONTE POE', 'FONTE COLMEIA', 'FONTE CHAVEADA',
    'CENTRAL DE ALARME', 'CENTRAL DE CHOQUE', 'CENTRAL DE CHOQUE E ALARME', 'CENTRAL PABX', 'CENTRAL DE PORTARIA',
    'SENSOR INFRAVERMELHO', 'SENSOR MAGNÉTICO', 'SENSOR DE BARREIRA', 'SENSOR PASSIVO',
    'BATERIA 12V', 'BATERIA 12V 7A', 'BATERIA SELADA', 'BATERIA CONTROLE',
    'CONECTOR BNC', 'CONECTOR P4', 'CONECTOR RJ45', 'CONECTOR RJ11'
];

async function updateItem(endpoint, id, payload) {
    const url = new URL(`${API_URL}${endpoint}/${id}`);
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'access-token': TOKEN, 'secret-access-token': SECRET, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch(e) { return false; }
}

async function run() {
    console.log("Baixando catálogo...");
    let produtos = await fetchAll('/produtos');
    const ativos = produtos.filter(p => String(p.ativo) === '1' && !(p.nome||'').startsWith('[INATIVO]'));
    
    let paraInativar = [];
    let toKeepInfo = [];

    // Core Target Keywords
    const TARGETS = ['CÂMERA', 'CABO', 'FONTE', 'CENTRAL', 'SENSOR', 'BATERIA', 'CONECTOR'];

    ativos.forEach(p => {
        let n = p.nome.toUpperCase().trim();
        
        // Find if this product belongs to a targeted cluttured category
        let category = TARGETS.find(t => n.startsWith(t));
        if (!category) return; // Keep anything else we don't understand

        let isBrand = BRANDS.some(b => n.includes(b));
        // Se tem números seguidos de letras/formatos longos, é modelo. Ex: VHD 3230, DS-2CE, 1120 B
        let isModel = /\b([A-Z]+-?\d{2,}[A-Z]*|\d{4,})\b/.test(n) || /\b(VHD|VHC|VHL|VIP|IMX|HDCVI|ANM|AMT)\b/.test(n);
        
        let isArchetype = KEEP_GENERIC.includes(n);

        // Se o produto NÃO TIVER MARCA, NÃO TIVER UM CÓDIGO CLARO DE MODELO, e NÃO ESTIVER NA LISTA ARQUÉTIPO DA FAMÍLIA... Vai pro ralo!
        if (!isBrand && !isModel && !isArchetype) {
            paraInativar.push({p: p, reason: 'Vague/Ocioso'});
        } else {
            toKeepInfo.push(n);
        }
    });

    console.log(`\n=== ANÁLISE DE CÂMERAS/CABOS/FONTES/CENTRAIS ===`);
    console.log(`- Produtos a MANTIDOS na vitrine: ${toKeepInfo.length}`);
    let samplesKeep = toKeepInfo.filter(x=>x.includes('CÂMERA')).slice(0, 10);
    console.log(`  Exemplos mantidos (CÂMERAS):`, samplesKeep);

    console.log(`\n- Produtos marcados como LIXO GENÉRICO para inativar: ${paraInativar.length}`);
    let samplesLixo = paraInativar.filter(x=>x.p.nome.includes('CÂMERA')).map(x=>x.p.nome).slice(0, 10);
    console.log(`  Exemplos que serão INATIVADOS:`, samplesLixo);

    // EXECUTION
    if (process.argv.includes('--execute')) {
        console.log(`\nEXECUTANDO INATIVAÇÃO EM MASSA (${paraInativar.length} itens)...`);
        let count = 0;
        for (let item of paraInativar) {
            let payload = { ...item.p };
            delete payload.id;
            payload.ativo = '0';
            payload.nome = '[INATIVO/GENERICO] ' + payload.nome; // Renomeia p/ sumir msm
            console.log(`Inativando: ${item.p.nome}`);
            await updateItem('/produtos', item.p.id, payload);
            await new Promise(r => setTimeout(r, 150));
            count++;
        }
        console.log(`Limpeza radical finalizada! ${count} itens despachados.`);
    } else {
        console.log("\nExecute com '--execute' para consolidar as inativações no Banco.");
    }
}
run();
