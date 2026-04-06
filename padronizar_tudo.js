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

async function updateItem(endpoint, id, originalObj, newName, inativar) {
    const url = new URL(`${API_URL}${endpoint}/${id}`);
    let payload = { ...originalObj };
    delete payload.id;
    
    payload.nome = newName;
    if (inativar) {
        payload.ativo = '0';
        payload.nome = '[INATIVO] ' + newName.replace(/^\[INATIVO\]\s*/, '');
    }
    
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

function normalizeName(name) {
    let n = (name||'').toUpperCase().replace(/\s+/g, ' ').trim();
    n = n.replace(/^C[AÁ]MERA\s+DE\s+SEGURAN[CÇ]A\s+BULLET/g, 'CÂMERA BULLET');
    n = n.replace(/^C[AÁ]MERA\s+DE\s+SEGURAN[CÇ]A\s+DOME/g, 'CÂMERA DOME');
    n = n.replace(/^C[AÁ]MERA\s+DE\s+SEGURAN[CÇ]A\s+IP/g, 'CÂMERA IP');
    n = n.replace(/^C[AÁ]MERA\s+DE\s+SEGURAN[CÇ]A/g, 'CÂMERA');
    n = n.replace(/^CABO\s+DE\s+REDE/g, 'CABO UTP');
    n = n.replace(/^CENTRAL\s+DE\s+ALARME\s+CONTRA\s+ROUBO/g, 'CENTRAL DE ALARME');
    n = n.replace(/^CENTRAL\s+DE\s+CHOQUE/g, 'CENTRAL DE CHOQUE');
    n = n.replace(/^FONTE\s+DE\s+ALIMENTA[CÇ][AÃ]O/g, 'FONTE');
    n = n.replace(/ BATERIAS? /g, ' BATERIA ');
    n = n.replace(/ SENSORES? /g, ' SENSOR ');
    n = n.replace(/ CONECTORES? /g, ' CONECTOR ');
    n = n.replace(/ 12\s*V/g, ' 12V');
    n = n.replace(/ 24\s*V/g, ' 24V');
    return n;
}

async function run() {
    console.log("Baixando produtos atualizados...");
    let produtos = await fetchAll('/produtos');
    const ativos = produtos.filter(p => p.ativo === '1' && !(p.nome||'').startsWith('[INATIVO]'));
    
    let grouped = {};
    ativos.forEach(p => {
        let norm = normalizeName(p.nome);
        if(!grouped[norm]) grouped[norm] = [];
        grouped[norm].push(p);
    });

    let patches = [];
    
    for (const norm in grouped) {
        const list = grouped[norm];
        list.sort((a,b) => new Date(b.modificado_em).getTime() - new Date(a.modificado_em).getTime());
        
        const principal = list[0];
        
        // Se o nome atual do principal for diferente do normalizado, renomear!
        if (principal.nome !== norm) {
            patches.push({ end: '/produtos', id: principal.id, obj: principal, newName: norm, inativar: false });
        }
        
        // Os demais desativam
        for (let i = 1; i < list.length; i++) {
            patches.push({ end: '/produtos', id: list[i].id, obj: list[i], newName: norm, inativar: true });
        }
    }

    console.log(`\nSerão renomeados/padronizados/inativados: ${patches.length} produtos.`);
    let done = 0;
    for (let patch of patches) {
        let op = patch.inativar ? 'INATIVANDO/DUPLICADO' : 'RENOMEANDO/PADRONIZANDO';
        console.log(`[${op}] ${patch.obj.nome} -> ${patch.newName}`);
        await updateItem(patch.end, patch.id, patch.obj, patch.newName, patch.inativar);
        await new Promise(r => setTimeout(r, 150));
        done++;
        if (done % 50 === 0) console.log(`${done}/${patches.length} concluídos...`);
    }

    console.log("\nAtualizando serviços ativos fujões...");
    let servicos = await fetchAll('/servicos');
    let sAtivos = servicos.filter(s => !(s.nome||'').startsWith('[INATIVO]'));
    let sMod = 0;
    
    // Lista severa de serviços unificados
    const genericos = [
        { chave: 'MÃO DE OBRA', val: 'MÃO DE OBRA' },
        { chave: 'MANUTENÇÃO', val: 'MANUTENÇÃO' },
        { chave: 'INSTALAÇÃO', val: 'INSTALAÇÃO' },
        { chave: 'CONFIGURAÇÃO', val: 'CONFIGURAÇÃO' },
        { chave: 'VISITA TÉCNICA', val: 'VISITA TÉCNICA' }
    ];

    let basesId = new Set();
    // Encontra as chaves mestre
    genericos.forEach(g => {
        let master = sAtivos.find(s => s.nome.toUpperCase().trim() === g.val);
        if (master) basesId.add(master.id);
    });

    for (let s of sAtivos) {
        if (basesId.has(s.id)) continue;
        let n = s.nome.toUpperCase().trim();
        
        let found = genericos.find(g => n.startsWith(g.chave));
        if (found) {
            console.log(`[INATIVANDO SERVIÇO FUJÃO] ${s.nome} -> Pertence a ${found.val}`);
            await updateItem('/servicos', s.id, s, s.nome, true);
            sMod++;
        } else {
            // Apenas capitaliza os restantes pra ficar limpo
            if (s.nome !== n) {
                console.log(`[PADRONIZANDO SERVIÇO] ${s.nome} -> ${n}`);
                await updateItem('/servicos', s.id, s, n, false);
                sMod++;
            }
        }
    }
    
    console.log(`Feito! Servicos modificados: ${sMod}`);
}
run();
