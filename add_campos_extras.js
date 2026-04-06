const fs = require('fs');
const path = require('path');

// IDs dos campos extras confirmados no Bom Saldo:
// 58528 = Descrição do Serviço Realizado:
// 58529 = Tipo do Serviço:
// 58530 = Orientação do serviço a ser realizado:

const w6Path = path.join(__dirname, 'workflows', 'W6 - Tool - Atualizar OS.json');
const w6 = JSON.parse(fs.readFileSync(w6Path, 'utf8'));

const montarPayloadNode = w6.nodes.find(n => n.name === 'Montar Payload');
if (!montarPayloadNode) { console.error('Node Montar Payload not found!'); process.exit(1); }

// Append campos_extras logic to the existing jsCode, just before the final return statements
let code = montarPayloadNode.parameters.jsCode;

// Find a good injection point — just before the garantia return
const garantiaReturnMarker = '// Se em garantia: não gerar pagamento financeiro real (total zero)';
if (!code.includes(garantiaReturnMarker)) {
  console.error('Marker not found in code!');
  process.exit(1);
}

const camposExtrasCode = `
// ─── CAMPOS EXTRAS (atributos_os) ────────────────────────────────────────────
// ID 58528 = Descrição do Serviço Realizado (fechamento técnico final)
// ID 58529 = Tipo do Serviço (ex: Garantia / Manutenção / Instalação)
// ID 58530 = Orientação do serviço a ser realizado (motivo/contexto inicial)
const camposExtras = [];

// Campo: Orientação do serviço (motivo inicial do chamado)
if (triggerParams.observacoes_orientacao || triggerParams.observacoes) {
  camposExtras.push({
    atributo_os: {
      atributo_id: '58530',
      valor: triggerParams.observacoes_orientacao || triggerParams.observacoes || ''
    }
  });
}

// Campo: Descrição do Serviço Realizado (fechamento técnico da IA)
if (triggerParams.relatorio_tecnico || triggerParams.laudo) {
  camposExtras.push({
    atributo_os: {
      atributo_id: '58528',
      valor: triggerParams.relatorio_tecnico || triggerParams.laudo || ''
    }
  });
}

// Campo: Tipo do Serviço (Garantia ou tipo informado pelo técnico)
const tipoServico = emGarantia ? 'Garantia' : (triggerParams.tipo_servico || '');
if (tipoServico) {
  camposExtras.push({
    atributo_os: {
      atributo_id: '58529',
      valor: tipoServico
    }
  });
}

if (camposExtras.length > 0) {
  payload.atributos_os = camposExtras;
}

`;

code = code.replace(garantiaReturnMarker, camposExtrasCode + garantiaReturnMarker);
montarPayloadNode.parameters.jsCode = code;

fs.writeFileSync(w6Path, JSON.stringify(w6, null, 2), 'utf8');
console.log('✅ W6: Campos extras adicionados ao payload:');
console.log('   ID 58530 → Orientação do serviço a ser realizado');
console.log('   ID 58528 → Descrição do Serviço Realizado');
console.log('   ID 58529 → Tipo do Serviço (Garantia quando em garantia)');
console.log('✅ W6 salvo');
