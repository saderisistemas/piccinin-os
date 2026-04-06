const fs = require('fs');

const TOKEN = '698a9f9846f8ea6d2b3a59d5cb99f4a9e32c17e8';
const SECRET = '874ac39b56dcf8a7b87e9bdafe88f833d0155c7a';
const API_URL = 'https://bomsaldo.com/api';

async function fetchAll(endpoint) {
  let allParams = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      console.log(`Buscando ${endpoint} - Página ${page}...`);
      
      const url = new URL(`${API_URL}${endpoint}`);
      url.searchParams.append('pagina', page);
      url.searchParams.append('limit', 100);
      
      const response = await fetch(url, {
        headers: {
          'access-token': TOKEN,
          'secret-access-token': SECRET,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (data[endpoint.replace('/', '')] && Array.isArray(data[endpoint.replace('/', '')])) {
        items = data[endpoint.replace('/', '')];
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else {
        items = [data]; // save structure anyway
      }
      
      if (items.length > 0) {
        allParams.push(...items);
        page++;
        // Stop if we received less than the requested limit
        // Wait, their pagination param might be 'pagina' like in the docs. Let's assume pagination limit per page is around 20 or 100 (docs say 100).
        if (items.length < 2) { // just to be safe, if we get fewer docs, usually < limit. Let me keep it simple. If we get something, keep going. But if empty, stop.
           // Actually, the api docs show it returns meta like "total_da_pagina": 1, "limite_por_pagina": 20
        }
        if (data.meta && data.meta.proxima_pagina === null) hasMore = false;
        if (items.length === 0) hasMore = false;
      } else {
        hasMore = false;
      }
      
      // Safety limit
      if (page > 100) hasMore = false;
      
    } catch (e) {
      console.error(`Erro buscando ${endpoint}:`, e.message);
      hasMore = false;
    }
  }
  
  return allParams;
}

async function run() {
  console.log("Iniciando extração...");
  
  const clientes = await fetchAll('/clientes');
  fs.writeFileSync('clientes.json', JSON.stringify(clientes, null, 2));
  console.log(`Total de clientes salvos: ${clientes.length}`);
  
  const produtos = await fetchAll('/produtos');
  fs.writeFileSync('produtos.json', JSON.stringify(produtos, null, 2));
  console.log(`Total de produtos salvos: ${produtos.length}`);
  
  const servicos = await fetchAll('/servicos');
  fs.writeFileSync('servicos.json', JSON.stringify(servicos, null, 2));
  console.log(`Total de serviços salvos: ${servicos.length}`);
  
  console.log("Extração concluída.");
}

run();
