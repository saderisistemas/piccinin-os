// Gerenciador de Abas e Modais
let currentTab = 'clientes';
let allClientes = [];
let allItens = [];

document.addEventListener('DOMContentLoaded', () => {
    loadClientes();
    loadItens();
});

function switchTab(tab) {
    currentTab = tab;
    
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const clickedBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');

    // Atualizar conteúdos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const targetContent = document.getElementById(`tab-${tab}`);
    if (targetContent) targetContent.classList.add('active');
}

// ================= SUPABASE ACTIONS =================

async function loadClientes() {
    showLoading('clientes', true);
    try {
        const { data, error } = await supabaseClient
            .from('cliente_aliases')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        allClientes = data || [];
        renderClientes(allClientes);
    } catch (err) {
        console.error('Erro ao carregar cliente_aliases:', err);
        alert('Erro ao sincronizar com Supabase para clientes: ' + err.message);
    } finally {
        showLoading('clientes', false);
    }
}

async function loadItens() {
    showLoading('itens', true);
    try {
        const { data, error } = await supabaseClient
            .from('item_aliases')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        allItens = data || [];
        renderItens(allItens);
    } catch (err) {
        console.error('Erro ao carregar item_aliases:', err);
        alert('Erro ao sincronizar com Supabase para itens: ' + err.message);
    } finally {
        showLoading('itens', false);
    }
}

// ================= RENDERING =================

function renderClientes(list) {
    const tbody = document.getElementById('table-clientes-body');
    const emptyDiv = document.getElementById('empty-clientes');
    tbody.innerHTML = '';

    if (list.length === 0) {
        emptyDiv.style.display = 'block';
        return;
    }
    emptyDiv.style.display = 'none';

    list.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHTML(c.alias)}</td>
            <td>${escapeHTML(c.cliente_nome)}</td>
            <td><code style="background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px; font-size: 0.85rem;">${escapeHTML(c.cliente_id)}</code></td>
            <td style="color: var(--text-muted); font-size: 0.9rem;">${formatDate(c.criado_em)}</td>
            <td style="text-align: right;">
                <button class="btn-delete" onclick="deleteAlias('cliente', '${c.id}', '${c.alias}')">
                    <i class="ri-delete-bin-line"></i> Excluir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderItens(list) {
    const tbody = document.getElementById('table-itens-body');
    const emptyDiv = document.getElementById('empty-itens');
    tbody.innerHTML = '';

    if (list.length === 0) {
        emptyDiv.style.display = 'block';
        return;
    }
    emptyDiv.style.display = 'none';

    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHTML(item.alias)}</td>
            <td><span class="badge-type ${item.item_tipo}">${escapeHTML(item.item_tipo)}</span></td>
            <td>${escapeHTML(item.item_nome)}</td>
            <td><code style="background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px; font-size: 0.85rem;">${escapeHTML(item.item_id)}</code></td>
            <td style="color: var(--text-muted); font-size: 0.9rem;">${formatDate(item.criado_em)}</td>
            <td style="text-align: right;">
                <button class="btn-delete" onclick="deleteAlias('item', '${item.id}', '${item.alias}')">
                    <i class="ri-delete-bin-line"></i> Excluir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================= ACTIONS =================

async function deleteAlias(type, id, alias) {
    if (!confirm(`Tem certeza de que deseja excluir o alias "${alias}"?`)) return;

    try {
        const table = type === 'cliente' ? 'cliente_aliases' : 'item_aliases';
        const { error } = await supabaseClient
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (type === 'cliente') {
            allClientes = allClientes.filter(c => c.id !== id);
            renderClientes(allClientes);
        } else {
            allItens = allItens.filter(item => item.id !== id);
            renderItens(allItens);
        }
    } catch (err) {
        console.error('Erro ao excluir alias:', err);
        alert('Erro ao excluir alias: ' + err.message);
    }
}

async function saveAlias(event) {
    event.preventDefault();
    const type = document.getElementById('form-entity-type').value;
    const rawAlias = document.getElementById('form-alias').value;
    const targetId = document.getElementById('form-target-id').value.trim();
    const targetNome = document.getElementById('form-target-nome').value.trim();

    // Normalização estrita do alias
    const alias = rawAlias.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

    if (alias.length < 3) {
        alert('O alias deve ter pelo menos 3 caracteres válidos após normalização.');
        return;
    }

    try {
        if (type === 'cliente') {
            const { error } = await supabaseClient
                .from('cliente_aliases')
                .insert([
                    { alias, cliente_id: targetId, cliente_nome: targetNome }
                ]);

            if (error) throw error;
            loadClientes();
        } else {
            const item_tipo = document.getElementById('form-item-tipo').value;
            const { error } = await supabaseClient
                .from('item_aliases')
                .insert([
                    { alias, item_id: targetId, item_nome: targetNome, item_tipo }
                ]);

            if (error) throw error;
            loadItens();
        }
        closeModal();
    } catch (err) {
        console.error('Erro ao salvar alias:', err);
        alert('Erro ao cadastrar alias (Verifique se o termo de busca já existe): ' + err.message);
    }
}

// ================= FILTERING =================

function filterClientes() {
    const query = document.getElementById('searchCliente').value.toLowerCase().trim();
    const filtered = allClientes.filter(c => 
        c.alias.toLowerCase().includes(query) || 
        c.cliente_nome.toLowerCase().includes(query) ||
        c.cliente_id.includes(query)
    );
    renderClientes(filtered);
}

function filterItens() {
    const query = document.getElementById('searchItem').value.toLowerCase().trim();
    const filtered = allItens.filter(item => 
        item.alias.toLowerCase().includes(query) || 
        item.item_nome.toLowerCase().includes(query) ||
        item.item_tipo.toLowerCase().includes(query) ||
        item.item_id.includes(query)
    );
    renderItens(filtered);
}

// ================= MODAL CONTROLS =================

function openModal(type) {
    const modal = document.getElementById('aliasModal');
    document.getElementById('form-entity-type').value = type;
    document.getElementById('aliasForm').reset();

    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const typeGroup = document.getElementById('form-item-type-group');
    const labelId = document.getElementById('label-target-id');
    const labelNome = document.getElementById('label-target-nome');
    const inputId = document.getElementById('form-target-id');
    const inputNome = document.getElementById('form-target-nome');

    if (type === 'cliente') {
        title.innerText = 'Novo Mapeamento de Cliente';
        subtitle.innerText = 'Crie um alias que redireciona diretamente ao cliente no Bom Saldo';
        typeGroup.style.display = 'none';
        labelId.innerText = 'ID do Cliente (Bom Saldo)';
        inputId.placeholder = 'Ex: 34472768';
        labelNome.innerText = 'Nome do Cliente Oficial';
        inputNome.placeholder = 'Ex: A G A Industria Ltda';
    } else {
        title.innerText = 'Novo Sinônimo de Item';
        subtitle.innerText = 'Crie um alias para produto ou serviço específico';
        typeGroup.style.display = 'flex';
        labelId.innerText = 'ID/Código do Item (Bom Saldo)';
        inputId.placeholder = 'Ex: 852781';
        labelNome.innerText = 'Nome Oficial do Item';
        inputNome.placeholder = 'Ex: Câmera Bullet Multi HD VHD 1120 B';
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('aliasModal').classList.remove('active');
}

// ================= UTILITIES =================

function showLoading(tab, isLoading) {
    const loadingDiv = document.getElementById(`loading-${tab}`);
    if (loadingDiv) loadingDiv.style.display = isLoading ? 'block' : 'none';
}

function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
