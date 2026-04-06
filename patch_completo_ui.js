const fs = require('fs');

const TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const SECRET = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';
const API_URL = 'https://bomsaldo.com/api';

async function patchFull(endpoint, id, originalObj) {
    const url = new URL(`${API_URL}${endpoint}/${id}`);
    
    // Create the full payload matching everything the API sent us
    let payload = { ...originalObj };
    delete payload.id; // Usually ID is in URL, not body

    // Apply the visual flag and status change
    const currentName = payload.nome || payload.descricao || '';
    if (!currentName.includes('[INATIVO]')) {
         payload.nome = '[INATIVO] ' + currentName;
    }
    payload.ativo = '0';
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'access-token': TOKEN,
                'secret-access-token': SECRET,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            console.error(`Falha ${endpoint}/${id} - Status: ${response.status} - ${response.statusText}`);
            console.error(await response.text());
            return false;
        }
        return true;
    } catch(e) {
        console.error(`Erro ${endpoint}/${id}: ${e.message}`);
        return false;
    }
}

const getModTime = (item) => new Date(item.modificado_em || item.cadastrado_em || 0).getTime();
const cleanString = (s) => (s || '').trim().toLowerCase();

async function run() {
    console.log("=== PATCH VISUAL COMPLETO: PRODUTOS E SERVIÇOS ===");
    
    let stats = { prod: 0, serv: 0 };

    // --- PRODUTOS ---
    const produtos = JSON.parse(fs.readFileSync('produtos.json', 'utf8')).flat().filter(p => String(p.ativo) === '1');
    let nomesMap = {};
    let produtosToDeactivate = new Map();
    let toKeep = new Set();
    
    produtos.forEach(p => {
        let n = cleanString(p.nome);
        if (!nomesMap[n]) nomesMap[n] = [];
        nomesMap[n].push(p);

        if (n.includes('teste') || n.length <= 2) {
            produtosToDeactivate.set(p.id, p);
        }
    });

    Object.values(nomesMap).filter(arr => arr.length > 1).forEach(arr => {
        arr.sort((a,b) => getModTime(b) - getModTime(a) || parseInt(b.id) - parseInt(a.id));
        const principal = arr[0];
        toKeep.add(principal.id);
        for(let i=1; i<arr.length; i++) {
             if (!produtosToDeactivate.has(arr[i].id)) {
                 produtosToDeactivate.set(arr[i].id, arr[i]);
             }
        }
    });

    console.log(`\nIniciando Produtos... (${produtosToDeactivate.size} para corrigir)`);
    for (const [id, originalObj] of produtosToDeactivate) {
        if(originalObj.nome.startsWith('[INATIVO]')) continue;
        console.log(`Patechando Produto: ${id} - ${originalObj.nome}`);
        const ok = await patchFull('/produtos', id, originalObj);
        if(ok) stats.prod++;
        await new Promise(r => setTimeout(r, 200));
    }

    // --- SERVIÇOS ---
    const servicos = JSON.parse(fs.readFileSync('servicos.json', 'utf8')).flat();
    const categoriasBase = [
        { chave: 'mão de obra', padraoId: null, menorNomeLen: 999 },
        { chave: 'manutenção', padraoId: null, menorNomeLen: 999 },
        { chave: 'instalação', padraoId: null, menorNomeLen: 999 },
        { chave: 'configuração', padraoId: null, menorNomeLen: 999 }
    ];

    servicos.forEach(s => {
        let n = cleanString(s.nome);
        categoriasBase.forEach(cat => {
            if (n.startsWith(cat.chave)) {
                if (n.length < cat.menorNomeLen) {
                    cat.menorNomeLen = n.length;
                    cat.padraoId = s.id;
                }
            }
        });
    });

    let padroesIds = new Set(categoriasBase.map(c => c.padraoId).filter(id => id));
    let servicosToDeactivate = new Map();

    servicos.forEach(s => {
        let n = cleanString(s.nome);
        if (padroesIds.has(s.id)) return;

        let matchedCat = categoriasBase.find(c => n.startsWith(c.chave));
        if (matchedCat && matchedCat.padraoId !== s.id) {
            servicosToDeactivate.set(s.id, s);
            return;
        }

        if (!matchedCat) {
             let exatoMatch = servicos.find(other => cleanString(other.nome) === n && getModTime(other) > getModTime(s));
             if (exatoMatch) servicosToDeactivate.set(s.id, s);
        }
    });

    console.log(`\nIniciando Serviços... (${servicosToDeactivate.size} para corrigir)`);
    for (const [id, originalObj] of servicosToDeactivate) {
        if((originalObj.nome || '').startsWith('[INATIVO]')) continue;
        console.log(`Patchando Serviço: ${id} - ${originalObj.nome}`);
        const ok = await patchFull('/servicos', id, originalObj);
        if(ok) stats.serv++;
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\nPROCESSO CONCLUÍDO. Produtos: ${stats.prod} | Serviços: ${stats.serv}`);
}

run();
