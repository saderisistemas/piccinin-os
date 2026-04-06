// Conexão Supabase
const SUPABASE_URL = 'https://bnghvmromtukmflzeojd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WhaoNheZP7ydc_KFbjg0xw_aytkd7ti';

// O client Supabase foi injetado globalmente pela tag <script> no index.html
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado Global
let dbData = [];

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    setupEventListeners();
    await fetchOrdensServico();
}

async function fetchOrdensServico() {
    try {
        const loadingBox = document.getElementById('loadingIndicator');
        loadingBox.style.display = 'block';

        const { data, error } = await supabaseClient
            .from('ordens_servico')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) {
            console.error('Erro ao buscar dados:', error);
            alert('Falha ao conectar no Supabase: ' + error.message);
            loadingBox.style.display = 'none';
            return;
        }

        dbData = data || [];
        loadingBox.style.display = 'none';
        
        renderKPIs();
        renderAIPerformance(dbData);
        renderOSList(dbData);

    } catch (err) {
        console.error('Erro de requisição', err);
        alert('Falha na requisição de rede com o Supabase.');
    }
}

function renderKPIs() {
    const total = dbData.length;
    const fechadas = dbData.filter(d => d.status_os === 'fechada' || d.status_os === 'concluida').length;
    
    const docsValidos = dbData.filter(d => d.tempo_atendimento_min !== null);
    const sumTMA = docsValidos.reduce((acc, curr) => acc + Number(curr.tempo_atendimento_min), 0);
    const avgTMA = docsValidos.length ? Math.round(sumTMA / docsValidos.length) : 0;
    
    // Calcula somatório total de peças de evidencias
    const qtdEvidencias = dbData.reduce((acc, curr) => acc + Number(curr.qtd_evidencias || 0), 0);

    document.getElementById('kpi-total').textContent = total;
    document.getElementById('kpi-fechadas').textContent = fechadas;
    document.getElementById('kpi-tma').textContent = avgTMA;
    document.getElementById('kpi-evidencias').textContent = qtdEvidencias;
}

function renderAIPerformance(data) {
    if(!data || data.length === 0) return;

    // 1. Horas Poupadas (Estimativa de 15min por OS automatizada)
    const totalOS = data.length;
    const horasPoupadas = (totalOS * 15) / 60;
    document.getElementById('vanda-hours').textContent = `${horasPoupadas.toFixed(1)}h`;

    // 2. Acurácia Zero-Touch (sem revisão manual)
    const zeroTouchCount = data.filter(d => !d.houve_revisao_manual).length;
    const accuracy = totalOS > 0 ? Math.round((zeroTouchCount / totalOS) * 100) : 0;
    document.getElementById('vanda-accuracy').textContent = `${accuracy}%`;

    // 3. Capital Auditado (Apenas OS validadas/fechadas com valores)
    const validadas = data.filter(d => d.status_os === 'fechada' || d.status_os === 'concluida');
    const capitalAuditado = validadas.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
    
    // Formatando para BRL
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('vanda-capital').textContent = formatter.format(capitalAuditado);
}

function renderOSList(data) {
    const container = document.getElementById('osContainer');
    
    // Removendo itens existentes, se for re-pesquisa
    const oldRows = container.querySelectorAll('.os-row');
    oldRows.forEach(row => row.remove());

    data.forEach(os => {
        const row = document.createElement('div');
        row.className = 'os-row';
        
        // Mapeamento dos nomes do banco public.ordens_servico
        const numero_os = os.os_codigo || '-';
        const cliente_nome = os.cliente_nome || '-';
        const equipamento = os.equipamento && os.equipamento !== 'null' ? os.equipamento : '-';
        const tecnico_nome = os.tecnico_nome || '-';
        const tma = os.tempo_atendimento_min ? os.tempo_atendimento_min + 'min' : '-';
        const status = os.status_os ? os.status_os.toLowerCase() : 'aberta';

        row.innerHTML = `
            <div class="os-col">
                <span class="os-col-title">Número OS</span>
                <span class="os-col-value" style="color:var(--piccinin-green); font-family: 'Poppins', sans-serif;">${numero_os}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Cliente</span>
                <span class="os-col-value">${cliente_nome}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Sistema/Planta</span>
                <span class="os-col-value">${equipamento}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Técnico Operante</span>
                <span class="os-col-value">${tecnico_nome}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">TMA</span>
                <span class="os-col-value">${tma}</span>
            </div>
            <div class="os-col" style="align-items: flex-end;">
                <span class="tag tag-${status.replace(' ', '-')}">${status.toUpperCase()}</span>
            </div>
        `;
        row.addEventListener('click', () => openModal(os));
        container.appendChild(row);
    });
}

function openModal(os) {
    const modal = document.getElementById('osModal');
    
    document.getElementById('m-num').textContent = os.os_codigo || 'OS-###';
    
    let baseStatus = os.status_os ? os.status_os.toUpperCase() : 'DESCONHECIDO';
    document.getElementById('m-id').textContent = `BS-ID: ${os.os_id_bomsaldo || '-'} | Status: ${baseStatus}`;
    
    const body = document.getElementById('modalBody');
    
    const marcaModelo = (os.marca || '') + ' ' + (os.modelo || '');
    const garantiaStr = os.em_garantia ? 'Ativa' : 'Fora da Vigência';
    const numGarantia = os.em_garantia ? 'var(--piccinin-green)' : '#fff';
    
    const defectTxt = os.defeito || 'Sem relato inicial / Não preenchido.';
    const causeTxt = os.causa || 'Pendente / Não registrado';
    const solveTxt = os.solucao || 'Pendente / Não registrado';
    const reportTxt = os.relatorio_tecnico || 'Nenhum laudo final submetido ou aprovado pela Ia.';

    body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap: 20px;">
            <div style="background:var(--piccinin-dark); border:1px solid var(--piccinin-border); border-radius:10px; padding:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <h3 style="font-family:'Poppins'; color:var(--text-grey); font-size:0.9rem; letter-spacing:1px; text-transform:uppercase;">Contexto Operacional</h3>
                    <span class="tag tag-${os.fase_ia ? 'aberta' : ''}">Fase IA: ${os.fase_ia ? os.fase_ia.toUpperCase() : '-'}</span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Local Protegido</span><strong style="color:#fff;">${os.cliente_nome || '-'}</strong></div>
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Equipamento</span><strong style="color:#fff;">${marcaModelo.trim() ? marcaModelo : '-'}</strong></div>
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Especialista</span><strong style="color:#fff;">${os.tecnico_nome || '-'}</strong></div>
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Garantia</span><strong style="color:${numGarantia};">${garantiaStr}</strong></div>
                </div>
            </div>

            <div class="report-box">
                <div style="margin-bottom:15px;">
                    <strong>Relato do Incidente (Defeito):</strong>
                    ${defectTxt}
                </div>
                <div style="display:flex; gap:20px; margin-bottom:15px; padding-top:15px; border-top:1px dashed var(--piccinin-border);">
                    <div style="flex:1"><strong>Causa Verificada:</strong> ${causeTxt}</div>
                    <div style="flex:1"><strong>Solução:</strong> ${solveTxt}</div>
                </div>
                <div style="padding-top:15px; border-top:1px dashed var(--piccinin-border);">
                    <strong>Laudo Técnico Transcrito (Vanda):</strong>
                    <span style="font-style:italic; color:var(--text-white);">${reportTxt}</span>
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,156,93,0.05); border:1px solid rgba(0,156,93,0.2); padding:20px; border-radius:10px;">
                <div>
                     <span style="display:block; font-size:0.75rem; color:var(--piccinin-green); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Faturamento</span>
                     <span style="font-size: 1.8rem; font-family:'Poppins'; font-weight:600; color:#fff;">R$ ${os.valor_total !== null && os.valor_total !== undefined ? Number(os.valor_total).toFixed(2) : '0.00'}</span>
                </div>
                ${os.link_pasta_drive 
                    ? `<a href="${os.link_pasta_drive}" target="_blank" style="text-decoration:none;"><button class="btn-solid"><i class="ri-folder-shield-2-line"></i> Acessar Evidências (${os.qtd_evidencias || 0})</button></a>`
                    : `<span style="color:var(--text-muted)"><i class="ri-forbid-line"></i> Sem Evidências</span>`
                }
            </div>

        </div>
    `;

    modal.classList.add('active');
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
