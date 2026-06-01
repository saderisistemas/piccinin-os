// Estado Global
let dbData = [];

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();

    // Força o desregistro de qualquer Service Worker legado para evitar falhas de cache
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister().then(boolean => {
                    if(boolean) console.log('Service Worker legado desregistrado com sucesso.');
                });
            }
        });
    }
});

async function initDashboard() {
    setupEventListeners();
    await fetchOrdensServico();
    
    // Configura o Live Command Center
    subscribeOrdensServico((payload) => {
        handleRealtimeUpdate(payload);
    });
}

function handleRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
        dbData.unshift(newRecord); // Add to beginning
    } else if (eventType === 'UPDATE') {
        const index = dbData.findIndex(d => d.id === newRecord.id);
        if (index !== -1) {
            dbData[index] = newRecord;
        }
    } else if (eventType === 'DELETE') {
        dbData = dbData.filter(d => d.id !== oldRecord.id);
    }
    
    // Re-render
    renderKPIs(dbData);
    renderAIPerformance(dbData);
    if(typeof renderCharts === 'function') renderCharts(dbData);
    
    // Check if there is an active search filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        const val = searchInput.value;
        const filtered = dbData.filter(d => matchOS(d, val));
        renderOSList(filtered);
    } else {
        renderOSList(dbData);
    }
}

async function fetchOrdensServico() {
    const loadingBox = document.getElementById('loadingIndicator');
    try {
        if (loadingBox) loadingBox.style.display = 'block';

        const { data, error } = await fetchOrdensServicoAPI();

        if (error) {
            console.error('Erro ao buscar dados:', error);
            if (loadingBox) loadingBox.style.display = 'none';
            if (typeof renderErrorState === 'function') {
                renderErrorState('Falha ao conectar no Supabase: ' + error.message);
            }
            return;
        }

        dbData = data || [];
        if (loadingBox) loadingBox.style.display = 'none';
        
        renderKPIs(dbData);
        renderAIPerformance(dbData);
        renderOSList(dbData);
        if(typeof renderCharts === 'function') renderCharts(dbData);

    } catch (err) {
        console.error('Erro de requisição', err);
        if (loadingBox) loadingBox.style.display = 'none';
        if (typeof renderErrorState === 'function') {
            renderErrorState('Falha na requisição de rede com o Supabase. Verifique sua conexão de rede.');
        }
    }
}

function setupEventListeners() {
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('osModal').classList.remove('active');
    });

    document.getElementById('osModal').addEventListener('click', (e) => {
        if(e.target.id === 'osModal') {
            document.getElementById('osModal').classList.remove('active');
        }
    });

    // Tecla Esc para fechar modal (acessibilidade e controle)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('osModal');
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        }
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const val = e.target.value;
        const filtered = dbData.filter(d => matchOS(d, val));
        renderOSList(filtered);
    });
}

/**
 * Função de busca avançada multi-parâmetro para as OSs.
 * Mapeia código, cliente, técnico, equipamento (marca/modelo), sintomas/laudos e itens aplicados.
 */
function matchOS(os, val) {
    if (!val) return true;
    const term = val.toLowerCase().trim();
    if (term === '') return true;
    
    // Mapeamento textual direto
    if (os.os_codigo && os.os_codigo.toLowerCase().includes(term)) return true;
    if (os.os_id_bomsaldo && os.os_id_bomsaldo.toLowerCase().includes(term)) return true;
    if (os.cliente_nome && os.cliente_nome.toLowerCase().includes(term)) return true;
    if (os.tecnico_nome && os.tecnico_nome.toLowerCase().includes(term)) return true;
    if (os.equipamento && os.equipamento.toLowerCase().includes(term)) return true;
    if (os.marca && os.marca.toLowerCase().includes(term)) return true;
    if (os.modelo && os.modelo.toLowerCase().includes(term)) return true;
    if (os.defeito && os.defeito.toLowerCase().includes(term)) return true;
    if (os.causa && os.causa.toLowerCase().includes(term)) return true;
    if (os.solucao && os.solucao.toLowerCase().includes(term)) return true;
    if (os.relatorio_tecnico && os.relatorio_tecnico.toLowerCase().includes(term)) return true;
    
    // Busca dentro dos produtos JSON
    if (os.produtos_json && Array.isArray(os.produtos_json)) {
        for (let item of os.produtos_json) {
            const prod = item.produto || item;
            if (prod.nome_produto && prod.nome_produto.toLowerCase().includes(term)) return true;
            if (prod.produto_id && String(prod.produto_id).toLowerCase().includes(term)) return true;
        }
    }
    
    // Busca dentro dos serviços JSON
    if (os.servicos_json && Array.isArray(os.servicos_json)) {
        for (let item of os.servicos_json) {
            const serv = item.servico || item;
            if (serv.nome_servico && serv.nome_servico.toLowerCase().includes(term)) return true;
            if (serv.servico_id && String(serv.servico_id).toLowerCase().includes(term)) return true;
        }
    }
    
    return false;
}
