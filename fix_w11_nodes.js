const fs = require('fs');
const path = require('path');
const w11Path = path.join(__dirname, 'workflows', 'W11 - Gerenciador Contexto OS.json');
let w11 = JSON.parse(fs.readFileSync(w11Path, 'utf8'));

w11.nodes.forEach(n => {

  // ── FIX 1: INSERT Transicao — .item → .first()
  if (n.name === 'INSERT Transicao') {
    n.parameters.fieldsUi.fieldValues = [
      { fieldId: 'tecnico_id',       fieldValue: "={{ $('setarInputs').first().json.tecnico_id }}" },
      { fieldId: 'tecnico_nome',     fieldValue: "={{ $('setarInputs').first().json.tecnico_nome }}" },
      { fieldId: 'os_id_anterior',   fieldValue: "={{ $('GET Atual para Switch').first().json.os_id || '' }}" },
      { fieldId: 'os_codigo_anterior',fieldValue: "={{ $('GET Atual para Switch').first().json.os_codigo || '' }}" },
      { fieldId: 'os_id_novo',       fieldValue: "={{ $('setarInputs').first().json.os_id_novo }}" },
      { fieldId: 'os_codigo_novo',   fieldValue: "={{ $('setarInputs').first().json.os_codigo_novo }}" },
      { fieldId: 'motivo',           fieldValue: 'switch_manual' },
    ];
    console.log('✅ INSERT Transicao: .item → .first()');
  }

  // ── FIX 2: UPDATE Switch OS — .item → .first() + remove empty fields (null them via Code instead)
  if (n.name === 'UPDATE Switch OS') {
    n.parameters.filters.conditions[0].keyValue = "={{ $('setarInputs').first().json.tecnico_id }}";
    // Remove nil-clearing fields that cause the orange warning — only set meaningful values
    n.parameters.fieldsUi.fieldValues = [
      { fieldId: 'os_id',        fieldValue: "={{ $('setarInputs').first().json.os_id_novo }}" },
      { fieldId: 'os_codigo',    fieldValue: "={{ $('setarInputs').first().json.os_codigo_novo }}" },
      { fieldId: 'fase',         fieldValue: 'identificacao' },
      { fieldId: 'atualizado_em',fieldValue: "={{ $now }}" },
      // checkin/checkout/aguardando_switch cleared via explicit empty string only if column accepts it
      { fieldId: 'checkin_at',
        fieldValue: "={{ '' }}" },
      { fieldId: 'checkout_at',
        fieldValue: "={{ '' }}" },
      { fieldId: 'aguardando_switch',
        fieldValue: "={{ '' }}" },
    ];
    console.log('✅ UPDATE Switch OS: .item → .first(), expressions cleaned');
  }

  // ── FIX 3: PATCH Bom Saldo Checkin — fix body format for typeVersion 4.2
  if (n.name === 'PATCH Bom Saldo Checkin') {
    n.parameters = {
      method: 'PUT',
      url: "=https://bomsaldo.com/api/ordens_servicos/{{ $('Preparar Checkin Payload').first().json.os_id }}/",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'access-token',        value: '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8' },
          { name: 'secret-access-token', value: '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a' },
          { name: 'Content-Type',        value: 'application/json' },
        ]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ observacoes_interna: $('Preparar Checkin Payload').first().json.observacoes_interna }) }}",
      options: { ignoreResponseCode: true }
    };
    console.log('✅ PATCH Bom Saldo Checkin: body format fixed (specifyBody: json)');
  }

  // ── FIX 4: UPDATE Checkin Contexto — fix .item if present
  if (n.name === 'UPDATE Checkin Contexto') {
    if (n.parameters.filters) {
      n.parameters.filters.conditions.forEach(c => {
        if (c.keyValue && c.keyValue.includes('.item.')) {
          c.keyValue = c.keyValue.replace('.item.', '.first().');
        }
      });
    }
    console.log('✅ UPDATE Checkin Contexto: .item → .first()');
  }

  // ── FIX 5: UPDATE Checkout — fix .item if present  
  if (n.name === 'UPDATE Checkout') {
    if (n.parameters.filters) {
      n.parameters.filters.conditions.forEach(c => {
        if (c.keyValue && c.keyValue.includes('.item.')) {
          c.keyValue = c.keyValue.replace('.item.', '.first().');
        }
      });
    }
    console.log('✅ UPDATE Checkout: .item → .first()');
  }

  // ── FIX 6: UPDATE Archive — fix .item if present
  if (n.name === 'UPDATE Archive') {
    if (n.parameters.filters) {
      n.parameters.filters.conditions.forEach(c => {
        if (c.keyValue && c.keyValue.includes('.item.')) {
          c.keyValue = c.keyValue.replace('.item.', '.first().');
        }
      });
    }
    if (n.parameters.fieldsUi) {
      n.parameters.fieldsUi.fieldValues.forEach(f => {
        if (f.fieldValue && f.fieldValue.includes('.item.')) {
          f.fieldValue = f.fieldValue.replace('.item.', '.first().');
        }
      });
    }
    console.log('✅ UPDATE Archive: .item → .first()');
  }

  // ── FIX 7: GET Contexto Ativo — fix .item if present
  if (n.name === 'GET Contexto Ativo') {
    if (n.parameters.filters) {
      n.parameters.filters.conditions.forEach(c => {
        if (c.keyValue && c.keyValue.includes('.item.')) {
          c.keyValue = c.keyValue.replace('.item.', '.first().');
        }
      });
    }
    console.log('✅ GET Contexto Ativo: .item → .first()');
  }

  // ── FIX 8: GET Buffer OS — fix .item if present
  if (n.name === 'GET Buffer OS') {
    if (n.parameters.filters) {
      n.parameters.filters.conditions.forEach(c => {
        if (c.keyValue && c.keyValue.includes('.item.')) {
          c.keyValue = c.keyValue.replace('.item.', '.first().');
        }
      });
    }
    console.log('✅ GET Buffer OS: .item → .first()');
  }
});

fs.writeFileSync(w11Path, JSON.stringify(w11, null, 2));
console.log('\n💾 W11 saved');

// Verify: scan ALL nodes for remaining .item.json
let remaining = 0;
w11.nodes.forEach(n => {
  const str = JSON.stringify(n.parameters || {});
  if (str.includes('.item.json') || str.includes('.item.json')) {
    console.log('  ⚠️ Still has .item.json:', n.name);
    remaining++;
  }
});
if (remaining === 0) console.log('✅ No more .item.json references');
