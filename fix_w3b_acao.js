const fs = require('fs');
const w3b = JSON.parse(fs.readFileSync('./workflows/W3b - Tool - Criar OS.json'));
const fr = w3b.nodes.find(n => n.name === 'Formatar Resposta');

// Replace the success case to include acao and fase
const oldReturn = `    nome_cliente: os.nome_cliente,
    sucesso: true`;
const newReturn = `    nome_cliente: os.nome_cliente,
    acao: 'set_os',
    fase: 'abertura_os',
    sucesso: true`;

fr.parameters.jsCode = fr.parameters.jsCode.replace(oldReturn, newReturn);
fs.writeFileSync('./workflows/W3b - Tool - Criar OS.json', JSON.stringify(w3b, null, 2));

// Verify
const verify = JSON.parse(fs.readFileSync('./workflows/W3b - Tool - Criar OS.json'));
const v = verify.nodes.find(n => n.name === 'Formatar Resposta');
console.log('Contains acao:', v.parameters.jsCode.includes("acao: 'set_os'"));
console.log('Contains fase:', v.parameters.jsCode.includes("fase: 'abertura_os'"));
console.log('Done!');
