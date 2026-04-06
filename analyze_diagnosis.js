const fs = require('fs');

function levenshtein(a, b) {
    if(a.length === 0) return b.length;
    if(b.length === 0) return a.length;
    const matrix = [];
    for(let i = 0; i <= b.length; i++){ matrix[i] = [i]; }
    for(let j = 0; j <= a.length; j++){ matrix[0][j] = j; }
    for(let i = 1; i <= b.length; i++){
        for(let j = 1; j <= a.length; j++){
            if(b.charAt(i-1) === a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function similar(a, b) {
    if (!a || !b) return false;
    a = a.toLowerCase().trim();
    b = b.toLowerCase().trim();
    if (a === b) return true;
    const desc = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return (desc / maxLen) < 0.15; // 85% chamamos de similar
}

function processClientes() {
    console.log("\n=== DIAGNÓSTICO DE CLIENTES ===");
    let raw = JSON.parse(fs.readFileSync('clientes.json', 'utf8'));
    // Flatten array just in case there are nested
    const clientes = raw.flat().filter(c => c && c.id);
    
    let ativos = clientes.filter(c => String(c.ativo) === '1');
    let inativos = clientes.filter(c => String(c.ativo) === '0');
    console.log(`Total Extraído: ${clientes.length} | Ativos: ${ativos.length} | Inativos: ${inativos.length}`);

    // Identificar duplicidades por CNPJ/CPF
    let docs = {};
    let nomes = {};
    let duplicadosDoc = [];
    let duplicadosNome = [];
    let cadastrosRuins = [];

    ativos.forEach(c => {
        let doc = (c.cnpj || c.cpf || '').replace(/[^\d]/g, '');
        let nomeLimpo = (c.nome || '').toLowerCase().trim();

        if (doc && doc.length > 5) {
            if (!docs[doc]) docs[doc] = [];
            docs[doc].push(c);
        }
        
        if (nomeLimpo.length > 3) {
            if (!nomes[nomeLimpo]) nomes[nomeLimpo] = [];
            nomes[nomeLimpo].push(c);
        }

        // Regras de nome ruim
        if (!nomeLimpo || nomeLimpo.length <= 3 || nomeLimpo.includes('teste') || nomeLimpo.startsWith('.')) {
            cadastrosRuins.push(c);
        }
    });

    for (let k in docs) {
        if (docs[k].length > 1) duplicadosDoc.push(docs[k]);
    }
    for (let k in nomes) {
        if (nomes[k].length > 1) duplicadosNome.push(nomes[k]);
    }

    console.log(`Clientes com CPF/CNPJ duplicado: ${duplicadosDoc.length} grupos`);
    console.log(`Clientes com Nome Exato duplicado: ${duplicadosNome.length} grupos`);
    console.log(`Cadastros ruins/testes (nomes curtos ou inválidos): ${cadastrosRuins.length}`);
    
    // Pegar algumas amostras de bagunça
    console.log("\n-> Amostra Cadastros Ruins:");
    cadastrosRuins.slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.nome}`));
}

function processProdutos() {
    console.log("\n=== DIAGNÓSTICO DE PRODUTOS ===");
    let raw = JSON.parse(fs.readFileSync('produtos.json', 'utf8'));
    const produtos = raw.flat().filter(p => p && p.id);
    let ativos = produtos.filter(p => String(p.ativo).trim() !== '0' && String(p.apagado) !== '1');
    console.log(`Total Produtos: ${produtos.length} | Ativos: ${ativos.length}`);

    let duplicadosNome = {};
    let cadastrosRuins = [];
    
    ativos.forEach(p => {
        let n = (p.nome || p.descricao || '').toLowerCase().trim();
        if (!duplicadosNome[n]) duplicadosNome[n] = [];
        duplicadosNome[n].push(p);

        if (n.includes('teste') || n.length <= 2) {
            cadastrosRuins.push(p);
        }
    });

    let gruposDup = Object.values(duplicadosNome).filter(arr => arr.length > 1);
    console.log(`Produtos com Nome Exato duplicado: ${gruposDup.length} grupos`);
    console.log(`Cadastros ruins em Produtos: ${cadastrosRuins.length}`);
    
    // Check semelhanças (Apenas para nomes parecidos e de mesmo fabricante ou tipo)
    // To keep it simple, checking for identical ignoring spaces
}

function processServicos() {
    console.log("\n=== DIAGNÓSTICO DE SERVIÇOS ===");
    let raw = JSON.parse(fs.readFileSync('servicos.json', 'utf8'));
    const servicos = raw.flat().filter(s => s && s.id);
    let ativos = servicos.filter(s => String(s.ativo).trim() !== '0');
    console.log(`Total Serviços: ${servicos.length} | Ativos: ${ativos.length}`);

    let nomes = {};
    ativos.forEach(s => {
        let n = (s.descricao || s.nome || '').toLowerCase().trim();
        if (!nomes[n]) nomes[n] = [];
        nomes[n].push(s);
    });

    let gruposDup = Object.values(nomes).filter(arr => arr.length > 1);
    console.log(`Serviços com Nomes Exatos duplicados: ${gruposDup.length} grupos`);
    
    // Identify redundant services (similar meaning/text)
    let sortedNomes = Object.keys(nomes).sort();
    let redundant = [];
    for (let i = 0; i < sortedNomes.length; i++) {
        for (let j = i+1; j < sortedNomes.length; j++) {
            if (similar(sortedNomes[i], sortedNomes[j])) {
                 redundant.push([sortedNomes[i], sortedNomes[j]]);
                 break;
            }
        }
    }
    console.log(`Pares de serviços muito similares (redundância): ${redundant.length}`);
    if (redundant.length > 0) {
        console.log("-> Amostra Redundantes:");
        redundant.slice(0, 5).forEach(p => console.log(`  "${p[0]}" <-> "${p[1]}"`));
    }
}

try {
    processClientes();
    processProdutos();
    processServicos();
} catch(e) { console.error("Erro processando:", e) }
