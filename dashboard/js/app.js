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
        const val = searchInput.value.toLowerCase();
        const filtered = dbData.filter(d => 
            (d.os_codigo && d.os_codigo.toLowerCase().includes(val)) || 
            (d.os_id_bomsaldo && d.os_id_bomsaldo.toLowerCase().includes(val)) ||
            (d.cliente_nome && d.cliente_nome.toLowerCase().includes(val))
        );
        renderOSList(filtered);
    } else {
        renderOSList(dbData);
    }
}

async function fetchOrdensServico() {
    try {
        const loadingBox = document.getElementById('loadingIndicator');
        loadingBox.style.display = 'block';

        const { data, error } = await fetchOrdensServicoAPI();

        if (error) {
            console.error('Erro ao buscar dados:', error);
            alert('Falha ao conectar no Supabase: ' + error.message);
            loadingBox.style.display = 'none';
            return;
        }

        dbData = data || [];
        loadingBox.style.display = 'none';
        
        renderKPIs(dbData);
        renderAIPerformance(dbData);
        renderOSList(dbData);
        if(typeof renderCharts === 'function') renderCharts(dbData);

    } catch (err) {

        console.error('Erro de requisição', err);
        alert('Falha na requisição de rede com o Supabase.');
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

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = dbData.filter(d => 
            (d.os_codigo && d.os_codigo.toLowerCase().includes(val)) || 
            (d.os_id_bomsaldo && d.os_id_bomsaldo.toLowerCase().includes(val)) ||
            (d.cliente_nome && d.cliente_nome.toLowerCase().includes(val))
        );
        renderOSList(filtered);
    });
}
