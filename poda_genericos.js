const fs = require('fs');

const TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const SECRET = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';
const API_URL = 'https://bomsaldo.com/api';

async function fetchAll(endpoint) {
    let page = 1;
    let all = [];
    while (true) {
        let r = await fetch(API_URL + endpoint + '?pagina=' + page + '&limit=100', { headers: { 'access-token': TOKEN, 'secret-access-token': SECRET } });
        let j = await r.json();
        let items = j.data || [];
        if (items.length === 0) break;
        all.push(...items);
        page++;
    }
    return all;
}

async function updateItem(endpoint, id, payload) {
    const url = new URL(`${API_URL}${endpoint}/${id}`);
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'access-token': TOKEN, 'secret-access-token': SECRET, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch(e) {
        return false;
    }
}

async function run() {
    console.log("Baixando catálogo para análise genérica...");
    let produtos = await fetchAll('/produtos');
    const ativos = produtos.filter(p => p.ativo === '1' && !(p.nome||'').startsWith('[INATIVO]'));
    
    // Agrupamento Semântico
    let grupos = {
        'CÂMERA': [],
        'CABO': [],
        'FONTE': [],
        'CENTRAL': [],
        'SENSOR': [],
        'BATERIA': [],
        'CONECTOR': []
    };

    let ociososParaInativar = [];

    // Classificação de itens genéricos vs específicos
    ativos.forEach(p => {
        let n = p.nome.toUpperCase();
        
        let targetGroup = null;
        for (const k in grupos) {
            if (n.includes(k)) { targetGroup = k; break; }
        }

        if (targetGroup) {
            // Se o nome tem 3 palavras ou menos e não tem números, é altamente genérico (ex: CÂMERA DOME, CABO UTP AZUL)
            // Se tem marca/modelo (INTELBRAS, HIKVISION, VHD 3230) é específico e útil.
            const hasBrand = n.includes('INTELBRAS') || n.includes('HIKVISION') || n.includes('VIZZION') || n.includes('JFL') || n.includes('GIGA');
            const hasNumbers = /\d{2,}/.test(n); // tem números de modelo (ex: 3230, 1120, 24NET)
            const words = n.split(' ').length;
            
            const isGeneric = (!hasBrand && !hasNumbers && words <= 4) || n === targetGroup;

            if (isGeneric) {
                grupos[targetGroup].push(p);
            }
        }
    });

    for (const k in grupos) {
        let items = grupos[k];
        if (items.length === 0) continue;
        
        // Regra de Ociosidade:
        // Mantemos apenas 1 ou 2 genéricos de cada tipo (o mais modificado recentemente ou com > 0 estoque)
        items.sort((a,b) => {
            let aEst = parseFloat(a.estoque || 0);
            let bEst = parseFloat(b.estoque || 0);
            if (aEst !== bEst) return bEst - aEst; // Prioriza quem tem estoque
            return new Date(b.modificado_em).getTime() - new Date(a.modificado_em).getTime(); // Prioriza recentes
        });

        // O item [0] é o nosso "Genérico Oficial Campeão" (ex: "CÂMERA", "CABO UTP").
        // Do índice 1 em diante, inativamos como ocioso/desprezível.
        
        // Em casos que os nomes divergem significativamente (ex: "CÂMERA BULLET" vs "CÂMERA DOME"),
        // vamos manter 1 campeão por nome exato!
        let subGruposNomeExato = {};
        items.forEach(i => {
            if (!subGruposNomeExato[i.nome]) subGruposNomeExato[i.nome] = [];
            subGruposNomeExato[i.nome].push(i);
        });

        for (const subNome in subGruposNomeExato) {
            let subItems = subGruposNomeExato[subNome];
            // Para "CÂMERA BULLET", mantém 1, apaga o resto.
            let principal = subItems[0];
            for (let i = 1; i < subItems.length; i++) {
                ociososParaInativar.push(subItems[i]);
            }
        }
        
        // Agora avaliamos itens com "valor venda == 0.00" (Geralmente lixo do sistema)
        items.forEach(i => {
            if (parseFloat(i.valor_venda || 0) === 0 && parseFloat(i.estoque || 0) === 0) {
                 if (!ociososParaInativar.find(x => x.id === i.id)) {
                     ociososParaInativar.push(i); // Venda zero e estoque zero é lixo genérico
                 }
            }
        });
    }

    console.log(`Identificados ${ociososParaInativar.length} produtos genéricos/ociosos absolutos.`);
    
    let processados = 0;
    for (let p of ociososParaInativar) {
        let payload = { ...p };
        delete payload.id;
        payload.ativo = '0';
        payload.nome = '[INATIVO/GENERICO] ' + payload.nome;
        
        console.log(`[LIMPEZA INTELIGENTE] Inativando: ${p.nome} (Estoque: ${p.estoque||0}, Venda: R$${p.valor_venda||0})`);
        await updateItem('/produtos', p.id, payload);
        await new Promise(r => setTimeout(r, 150));
        processados++;
    }

    console.log(`Feito! ${processados} itens genéricos desativados do sistema.`);
}

run();
