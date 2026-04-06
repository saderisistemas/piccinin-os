const fs = require('fs');
const path = require('path');

const w6Path = path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json');
const w6 = JSON.parse(fs.readFileSync(w6Path, 'utf8'));

const montarPayloadNode = w6.nodes.find(n => n.name === 'Montar Payload');
if (montarPayloadNode) {
  // Fix IDs in the payment mapping logic
  // OLD (wrong): 4354384 PIX, 4354366 Dinheiro, 4354368 Boleto
  // NEW (confirmed real): 4354384 PIX NUBANK, 4354377 Dinheiro, 4366641 Boleto NUBANK (default), 4365900 Boleto INTER
  let code = montarPayloadNode.parameters.jsCode;

  // Fix Dinheiro ID: 4354366 -> 4354377
  code = code.replace(/fallbackForma = "4354366"/g, 'fallbackForma = "4354377"');
  
  // Fix default Boleto ID: 4354368 -> 4366641 (Boleto NUBANK as default)
  code = code.replace(/let fallbackForma = "4354368"/g, 'let fallbackForma = "4366641"');
  code = code.replace(/fallbackForma = "4354368"/g, 'fallbackForma = "4366641"');

  // Fix Boleto for warranty (garantia) section - also use 4366641
  code = code.replace(/forma_pagamento_id: '4354368'/g, "forma_pagamento_id: '4366641'");

  // Also update the Pix check - keep 4354384 (PIX NUBANK is correct)
  // And add PIX Inter as fallback variant
  code = code.replace(
    "if (tp.includes(\"pix\")) {\n  fallbackForma = \"4354384\";",
    "if (tp.includes(\"pix\") && (tp.includes(\"nubank\") || !tp.includes(\"inter\") && !tp.includes(\"cora\"))) {\n  fallbackForma = \"4354384\"; // PIX NUBANK\n} else if (tp.includes(\"pix\") && tp.includes(\"inter\")) {\n  fallbackForma = \"4377571\"; // PIX Inter\n} else if (tp.includes(\"pix\")){"
  );

  montarPayloadNode.parameters.jsCode = code;
  console.log('✅ W6: Payment method IDs corrected with real Bom Saldo values');
  console.log('   Dinheiro: 4354377 (was 4354366)');
  console.log('   Boleto default: 4366641/Boleto NUBANK (was 4354368 - not found)');
  console.log('   PIX NUBANK: 4354384 (confirmed correct)');
  console.log('   PIX Inter: 4377571 (new)');
}

fs.writeFileSync(w6Path, JSON.stringify(w6, null, 2), 'utf8');
console.log('✅ W6 saved with corrected payment IDs');
