const fs = require('fs');

const file = 'workflows/W6 - Tool - Atualizar OS.json';
const w6 = JSON.parse(fs.readFileSync(file, 'utf8'));

const codeNode = w6.nodes.find(n => n.name === 'Montar Payload');
let js = codeNode.parameters.jsCode;

const badCode = `    return [{ json: { os_id: triggerParams.os_id, error: "OS não encontrada ou sem permissão de leitura" } }];
}`;

if (js.includes(badCode)) {
    js = js.replace(badCode, '');
    codeNode.parameters.jsCode = js;
    fs.writeFileSync(file, JSON.stringify(w6, null, 2));
    console.log("W6 Syntax Patch Sucessful!");
} else {
    // If exact spacing is off, use aggressive regex
    const rogueRegex = /return \[\{ json: \{ os_id: triggerParams\.os_id, error: "OS n.o encontrada ou sem permiss.o de leitura" \} \}\];\s*\}/g;
    if (rogueRegex.test(js)) {
        js = js.replace(rogueRegex, '');
        codeNode.parameters.jsCode = js;
        fs.writeFileSync(file, JSON.stringify(w6, null, 2));
        console.log("W6 Syntax Patch Sucessful via Regex!");
    } else {
        console.log("W6 No Syntax err found.");
    }
}
