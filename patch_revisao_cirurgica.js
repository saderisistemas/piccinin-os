const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, 'workflows');

function updateW8() {
  const file = path.join(WORKFLOWS_DIR, 'W8 - Tool - Salvar Contexto OS.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  // 1. Trigger
  const trigger = data.nodes.find(n => n.name === 'Trigger');
  if (trigger) {
    const values = trigger.parameters.workflowInputs.values;
    if (!values.find(v => v.name === 'produtos_json')) values.push({ name: 'produtos_json' });
    if (!values.find(v => v.name === 'servicos_json')) values.push({ name: 'servicos_json' });
  }

  // 2. Validar Params
  const validar = data.nodes.find(n => n.name === 'Validar Params');
  if (validar) {
    let script = validar.parameters.jsCode;
    // Add logic to include the JSON arrays safely
    if (!script.includes("'produtos_json'")) {
      script = script.replace(
        "  'status_os', 'fase_ia', 'motivo_cancelamento'",
        "  'status_os', 'fase_ia', 'motivo_cancelamento',\n  'produtos_json', 'servicos_json'"
      );
    }
    validar.parameters.jsCode = script;
  }

  // 3. Update OS
  const updateOS = data.nodes.find(n => n.name === 'UPDATE OS');
  if (updateOS) {
    const fields = updateOS.parameters.fieldsUi.fieldValues;
    if (!fields.find(f => f.fieldId === 'produtos_json')) {
      fields.push({ fieldId: 'produtos_json', fieldValue: '={{ $json.produtos_json !== undefined ? (typeof $json.produtos_json === \'string\' ? $json.produtos_json : JSON.stringify($json.produtos_json)) : null }}' });
    }
    if (!fields.find(f => f.fieldId === 'servicos_json')) {
      fields.push({ fieldId: 'servicos_json', fieldValue: '={{ $json.servicos_json !== undefined ? (typeof $json.servicos_json === \'string\' ? $json.servicos_json : JSON.stringify($json.servicos_json)) : null }}' });
    }
  }

  // 4. Insert OS
  const insertOS = data.nodes.find(n => n.name === 'INSERT OS');
  if (insertOS) {
    const fields = insertOS.parameters.fieldsUi.fieldValues;
    if (!fields.find(f => f.fieldId === 'produtos_json')) {
      fields.push({ fieldId: 'produtos_json', fieldValue: '={{ $json.produtos_json !== undefined ? (typeof $json.produtos_json === \'string\' ? $json.produtos_json : JSON.stringify($json.produtos_json)) : undefined }}' });
    }
    if (!fields.find(f => f.fieldId === 'servicos_json')) {
      fields.push({ fieldId: 'servicos_json', fieldValue: '={{ $json.servicos_json !== undefined ? (typeof $json.servicos_json === \'string\' ? $json.servicos_json : JSON.stringify($json.servicos_json)) : undefined }}' });
    }
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('✅ W8 atualizado');
}

function updateW4() {
  const file = path.join(WORKFLOWS_DIR, 'W4 - Tool - Buscar Produtos.json');
  if(!fs.existsSync(file)) {
      console.log('W4 File not found: ', file);      
  } else {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const formatar = data.nodes.find(n => n.name === 'Formatar Produtos');
    if (formatar) {
        let script = formatar.parameters.jsCode;
        if (!script.includes('codigo_interno: p.codigo')) {
            script = script.replace(
                "option_map[String(p.index)] = { id: p.id, variacao_id: p.variacao_id, nome: p.nome, valor_venda: p.valor_venda };",
                "option_map[String(p.index)] = { id: p.id, variacao_id: p.variacao_id, nome: p.nome, codigo_interno: p.codigo, valor_venda: p.valor_venda };"
            );
            formatar.parameters.jsCode = script;
        }
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log('✅ W4 atualizado');
  }
}

function updateW6() {
  const file = path.join(WORKFLOWS_DIR, 'W6 - Tool - Atualizar OS.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  // 1. Resolver OS ID (passing supabase items up and adjusting date)
  const resolver = data.nodes.find(n => n.name === 'Resolver OS ID');
  if (resolver) {
    let script = resolver.parameters.jsCode;
    
    // Replace the specific date fallback string
    script = script.replace(
        "const horaSaida = trigger.hora_saida || supabase.hora_saida || new Date().toISOString();",
        "const horaSaida = trigger.hora_saida || supabase.hora_saida || null;"
    );

    // Pass the supabase fields forward so Montar Payload can use them
    if(!script.includes('produtos_json_supabase')) {
        script = script.replace(
            "hora_saida: horaSaida",
            "hora_saida: horaSaida,\n  produtos_json_supabase: supabase.produtos_json,\n  servicos_json_supabase: supabase.servicos_json"
        );
    }
    resolver.parameters.jsCode = script;
  }

  // 2. Montar Payload
  const montar = data.nodes.find(n => n.name === 'Montar Payload');
  if (montar) {
    let script = montar.parameters.jsCode;
    
    // Replace the parsing block
    const oldBlock = `try { produtos = typeof triggerParams.produtos_json === 'string' ? JSON.parse(triggerParams.produtos_json) : (triggerParams.produtos_json || []); } catch(e) {}
try { servicos = typeof triggerParams.servicos_json === 'string' ? JSON.parse(triggerParams.servicos_json) : (triggerParams.servicos_json || []); } catch(e) {}`;
    
    const newBlock = `// Pegar JSON do trigger ou tentar fallback do Supabase
try { produtos = typeof triggerParams.produtos_json === 'string' ? JSON.parse(triggerParams.produtos_json) : (triggerParams.produtos_json || []); } catch(e) {}
if (produtos.length === 0 && triggerParams.produtos_json_supabase) {
  try { produtos = typeof triggerParams.produtos_json_supabase === 'string' ? JSON.parse(triggerParams.produtos_json_supabase) : triggerParams.produtos_json_supabase; } catch(e) {}
}

try { servicos = typeof triggerParams.servicos_json === 'string' ? JSON.parse(triggerParams.servicos_json) : (triggerParams.servicos_json || []); } catch(e) {}
if (servicos.length === 0 && triggerParams.servicos_json_supabase) {
  try { servicos = typeof triggerParams.servicos_json_supabase === 'string' ? JSON.parse(triggerParams.servicos_json_supabase) : triggerParams.servicos_json_supabase; } catch(e) {}
}`;

    if (!script.includes('triggerParams.produtos_json_supabase')) {
        script = script.replace(oldBlock, newBlock);
        
        // Also fix the checkin/checkout string appending behavior.
        // If they are null, we don't append. This works properly naturally if we don't force 'new Date()' in step above.
        
        montar.parameters.jsCode = script;
    }
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('✅ W6 atualizado');
}

updateW8();
updateW4();
updateW6();
