const fs = require('fs');
const w1 = JSON.parse(fs.readFileSync('workflows/W1 - Protek OS - Agente Principal.json', 'utf8'));
const w6 = JSON.parse(fs.readFileSync('workflows/W6 - Tool - Atualizar OS.json', 'utf8'));

// Check W1
const vanda = w1.nodes.find(n => n.name === 'Vanda');
const atualizarOS = w1.nodes.find(n => n.name === 'atualizarOS');
const msg = vanda && vanda.parameters && vanda.parameters.options && vanda.parameters.options.systemMessage ? vanda.parameters.options.systemMessage : '';
console.log('W1 name:', w1.name);
console.log('Vanda IDENTIDADE ok:', msg.includes('Piccinin Security'));
console.log('Vanda GARANTIA rules ok:', msg.includes('REGRAS DE GARANTIA'));
console.log('Vanda FOTO rules ok:', msg.includes('REGRAS DE FOTOS'));
console.log('Vanda MAPEAMENTO ok:', msg.includes('MAPEAMENTO DE CAMPOS'));
console.log('Vanda horario entrada ok:', msg.includes('Horario de entrada') || msg.includes('rário de entrada'));
console.log('Vanda garantia no pagamento ok:', msg.includes('for garantia'));
console.log('atualizarOS em_garantia param ok:', !!(atualizarOS && atualizarOS.parameters && atualizarOS.parameters.workflowInputs && atualizarOS.parameters.workflowInputs.value && atualizarOS.parameters.workflowInputs.value.em_garantia));
console.log('atualizarOS hora_entrada param ok:', !!(atualizarOS && atualizarOS.parameters && atualizarOS.parameters.workflowInputs && atualizarOS.parameters.workflowInputs.value && atualizarOS.parameters.workflowInputs.value.hora_entrada));

// Check W6
const montarPayload = w6.nodes.find(n => n.name === 'Montar Payload');
const code = montarPayload && montarPayload.parameters && montarPayload.parameters.jsCode ? montarPayload.parameters.jsCode : '';
console.log('');
console.log('W6 name:', w6.name);
console.log('W6 emGarantia logic ok:', code.includes('emGarantia'));
console.log('W6 observacoes_orientacao ok:', code.includes('observacoes_orientacao'));
console.log('W6 horarios ok:', code.includes('hora_entrada'));
console.log('W6 garantia pagamento zero ok:', code.includes('0.00'));
console.log('W6 valor zero para garantia prod:', code.includes("emGarantia ? '0'"));
