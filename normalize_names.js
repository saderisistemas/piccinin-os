const fs = require('fs');

function standardizeName(name) {
    if (!name) return "";
    let n = name.toUpperCase().trim();
    
    // Remove múltiplos espaços
    n = n.replace(/\s+/g, ' ');

    // Padronização de prefixos comuns (com ou sem acentos)
    n = n.replace(/^C[AÁ]MERA\s+DE\s+SEGURAN[CÇ]A/g, 'CÂMERA');
    n = n.replace(/^C[AÁ]MERA\s+/g, 'CÂMERA ');
    n = n.replace(/^CABO\s+DE\s+REDE/g, 'CABO UTP');
    n = n.replace(/^CENTRAL\s+DE\s+ALARME\s+CONTRA\s+ROUBO/g, 'CENTRAL DE ALARME');
    n = n.replace(/^CENTRAL\s+DE\s+CHOQUE/g, 'CENTRAL DE CHOQUE');
    n = n.replace(/^FONTE\s+DE\s+ALIMENTA[CÇ][AÃ]O/g, 'FONTE');
    
    // Correções de digitação comuns ou plurais
    n = n.replace(/ BATERIAS? /g, ' BATERIA ');
    n = n.replace(/ SENSORES? /g, ' SENSOR ');
    n = n.replace(/ CONECTORES? /g, ' CONECTOR ');
    
    // Tratamento de voltagens padrão para ficar limpo
    n = n.replace(/ 12\s*V/g, ' 12V');
    n = n.replace(/ 24\s*V/g, ' 24V');
    
    // Title Case (Opcional, mas UPPERCASE costuma ser recomendado padrão em ERP)
    // Vamos manter Uppercase para evitar problemas de mix de case em códigos (ex: Intelbras ANM 24 NET)
    return n.trim();
}

console.log("=== PREVIEW DE PADRONIZAÇÃO DE PRODUTOS ===");
const produtos = JSON.parse(fs.readFileSync('produtos.json', 'utf8')).flat().filter(p => p.ativo === '1' && !(p.nome||'').startsWith('[INATIVO]'));

let nomesAgrupados = {};

produtos.forEach(p => {
    let original = (p.nome || '').trim();
    let norm = standardizeName(original);
    
    if (!nomesAgrupados[norm]) nomesAgrupados[norm] = [];
    nomesAgrupados[norm].push({ original, id: p.id, obj: p });
});

let toRename = 0;
let toInactivate = 0;

for (const norm in nomesAgrupados) {
    const list = nomesAgrupados[norm];
    
    list.forEach(item => {
        if (item.original !== norm) {
            toRename++;
        }
    });

    if (list.length > 1) {
        toInactivate += (list.length - 1);
        if (toInactivate < 15) { // Mostrar alguns exemplos de fusão
             console.log(`\n[FUSÃO PARA]: ${norm}`);
             list.forEach(i => console.log(`  - Original: ${i.original} (ID: ${i.id})`));
        }
    }
}

console.log(`\nResumo da Simulação de Produtos:`);
console.log(`- Produtos que terão o nome limpo e padronizado: ${toRename}`);
console.log(`- Produtos que serão INATIVADOS por se tornarem duplicatas após padronização: ${toInactivate}`);

console.log("\n=== PREVIEW DE SERVIÇOS RESTANTES ===");
const servicos = JSON.parse(fs.readFileSync('servicos.json', 'utf8')).flat().filter(p => !((p.nome||'').startsWith('[INATIVO]')));

servicos.forEach(s => {
    let original = (s.nome || '').trim();
    let norm = standardizeName(original);
    if(original !== norm) console.log(`${original}  --->  ${norm}`);
});
