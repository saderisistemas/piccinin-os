// relatorios.js - Centro de Inteligência Tática (Piccinin OS)
// Analisa OS diretamente do Supabase — sem depender de n8n

// ===== NORMALIZAÇÃO DE TEXTO (remove acentos para matching) =====
function normalizeText(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ');
}

// Técnicos que são contas de teste — excluídos dos rankings
const TECH_BLACKLIST = ['test', 'e2e', 'dev', 'prompt', 'conducao', 'imagem', 'step', 'ia (group)'];
function isRealTech(nome) {
    if (!nome) return false;
    const n = normalizeText(nome);
    return !TECH_BLACKLIST.some(b => n.includes(b));
}

// ===== KEYWORDS DE DEFEITO =====
const DEFEITO_KEYWORDS = {
    'Cremalheira':  ['cremalheira', 'crema'],
    'Motor':        ['motor', 'aquecendo', 'aquecimento', 'queimado'],
    'Bateria':      ['bateria', 'bat ', 'energia'],
    'Controle RF':  ['controle', 'rf', 'controles', 'comando', 'remoto'],
    'Fim de Curso': ['fim de curso', 'curso', 'limit switch'],
    'Placa Eletr.': ['placa', 'central', 'eletronica', 'eletrônica'],
    'Câmera/CFTV':  ['camera', 'câmera', 'cftv', 'dvr', 'nvr'],
    'Portão':       ['portao', 'portão', 'porta', 'basculante', 'corrediço'],
    'Interfone':    ['interfone', 'porteiro', 'hdl', 'audio'],
    'Instalação':   ['instalação', 'instalacao', 'instalar', 'instalando'],
    'Sensor':       ['sensor', 'infravermelho', 'ivp', 'pir'],
    'Alarme':       ['alarme', 'central de alarme', 'amt'],
};

document.addEventListener('DOMContentLoaded', () => {
    initRelatorios();
});

async function initRelatorios() {
    try {
        const { data: osData, error } = await supabaseClient
            .from('ordens_servico')
            .select('os_codigo, tecnico_nome, status_os, em_garantia, defeito, causa, equipamento, marca, criado_em, fechado_em, valor_total, tempo_atendimento_min, ia_acertou_primeira')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        const allOS = osData || [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // OS fechadas/concluídas nos últimos 30 dias
        const fechadas = allOS.filter(os =>
            (os.status_os === 'fechada' || os.status_os === 'concluida') &&
            os.criado_em && new Date(os.criado_em) >= thirtyDaysAgo
        );

        renderKPIs(fechadas, allOS);
        renderDefeitosChart(fechadas);
        renderWarrantyChart(fechadas);
        renderTecnicoCharts(fechadas);
        renderEquipamentosChart(fechadas);
        renderRiskRadar(fechadas);
        renderVolumeDiario(allOS.filter(os => os.criado_em && new Date(os.criado_em) >= thirtyDaysAgo));
        renderHeatmap(allOS);

    } catch(e) {
        console.error('Erro ao carregar relatórios:', e);
    }
}

// ===== KPIs EXECUTIVOS =====
function renderKPIs(fechadas, allOS) {
    // Total OS
    const elTotal = document.getElementById('kpi-total-os');
    if (elTotal) elTotal.innerText = fechadas.length;

    // Taxa de garantia
    const garantias = fechadas.filter(os => os.em_garantia === true);
    const taxa = fechadas.length > 0 ? ((garantias.length / fechadas.length) * 100).toFixed(1) : 0;
    const elGarantia = document.getElementById('kpi-taxa-garantia');
    if (elGarantia) elGarantia.innerText = taxa + '%';

    // Defeito mais comum
    const defCounts = countKeywords(fechadas);
    const topDefeito = Object.entries(defCounts).sort((a,b) => b[1]-a[1])[0];
    const elDefeito = document.getElementById('kpi-top-defeito');
    if (elDefeito && topDefeito) elDefeito.innerText = topDefeito[0];

    // Técnico mais produtivo (excluindo contas de teste)
    const tecCounts = {};
    fechadas.filter(os => isRealTech(os.tecnico_nome)).forEach(os => {
        const nome = os.tecnico_nome.trim().split(' ').slice(0, 2).join(' ');
        tecCounts[nome] = (tecCounts[nome] || 0) + 1;
    });
    const topTec = Object.entries(tecCounts).sort((a,b) => b[1]-a[1])[0];
    const elTec = document.getElementById('kpi-top-tecnico');
    if (elTec && topTec) elTec.innerText = topTec[0].split(' ')[0] + ' (' + topTec[1] + ' OS)';
}

// ===== HELPER: conta keywords nos defeitos (com normalização de acentos) =====
function countKeywords(osList) {
    const counts = {};
    osList.forEach(os => {
        const raw = (os.defeito || '') + ' ' + (os.causa || '');
        const text = normalizeText(raw);
        if (!text.trim() || text.trim() === 'sem defeito') return; // ignora OS sem info
        let matched = false;
        for (const [label, keywords] of Object.entries(DEFEITO_KEYWORDS)) {
            if (keywords.some(k => text.includes(normalizeText(k)))) {
                counts[label] = (counts[label] || 0) + 1;
                matched = true;
            }
        }
        if (!matched) {
            counts['Outros'] = (counts['Outros'] || 0) + 1;
        }
    });
    return counts;
}

// ===== GRÁFICO: Top Defeitos =====
function renderDefeitosChart(fechadas) {
    const counts = countKeywords(fechadas);
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10);
    const categories = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);

    new ApexCharts(document.querySelector('#chart-defeitos'), {
        series: [{ name: 'Ocorrências', data: values }],
        chart: { type: 'bar', height: 320, toolbar: { show: false }, background: 'transparent' },
        colors: ['#00ff88'],
        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
        dataLabels: { enabled: true, offsetX: 20, style: { colors: ['#fff'], fontSize: '12px' } },
        xaxis: { categories, labels: { style: { colors: '#888' } }, axisBorder: { show: false } },
        yaxis: { labels: { style: { colors: '#ccc' } } },
        grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
        theme: { mode: 'dark' }
    }).render();
}

// ===== GRÁFICO: Garantia vs Cobrado =====
function renderWarrantyChart(fechadas) {
    const garantia = fechadas.filter(os => os.em_garantia === true).length;
    const cobrado = fechadas.length - garantia;

    new ApexCharts(document.querySelector('#chart-warranty'), {
        series: [garantia, cobrado],
        chart: { type: 'donut', height: 320, background: 'transparent' },
        labels: ['Em Garantia (Retrabalho)', 'Serviço Cobrado'],
        colors: ['#ff4d4d', '#00ff88'],
        stroke: { show: true, colors: ['#111'], width: 2 },
        dataLabels: { enabled: true, style: { colors: ['#fff'] }, dropShadow: { enabled: false } },
        plotOptions: { pie: { donut: { size: '65%', labels: { show: true, name: { color: '#888' }, value: { color: '#fff', fontSize: '1.4rem', fontWeight: 700 }, total: { show: true, label: 'Total', color: '#888', formatter: (w) => w.globals.seriesTotals.reduce((a,b) => a+b, 0) } } } } },
        theme: { mode: 'dark' },
        legend: { position: 'bottom', labels: { colors: '#888' } }
    }).render();
}

// ===== GRÁFICOS: Técnicos =====
function renderTecnicoCharts(fechadas) {
    const tecData = {};
    // Filtra contas de teste
    fechadas.filter(os => isRealTech(os.tecnico_nome)).forEach(os => {
        // Pega primeiro nome real (ex: "Danilo Saderi" → "Danilo", "Filipe Protek" → "Filipe")
        const parts = os.tecnico_nome.trim().split(' ');
        const nome = parts[0] !== 'Tecnico' ? parts[0] : (parts[1] || parts[0]);
        if (!tecData[nome]) tecData[nome] = { total: 0, garantia: 0 };
        tecData[nome].total++;
        if (os.em_garantia) tecData[nome].garantia++;
    });

    const sorted = Object.entries(tecData).sort((a,b) => b[1].total - a[1].total).slice(0, 8);
    const nomes = sorted.map(e => e[0]);
    const totais = sorted.map(e => e[1].total);
    const taxas = sorted.map(e => e[1].total > 0 ? ((e[1].garantia / e[1].total) * 100).toFixed(1) : 0);

    // OS por técnico
    new ApexCharts(document.querySelector('#chart-tecnico-os'), {
        series: [{ name: 'OS Fechadas', data: totais }],
        chart: { type: 'bar', height: 300, toolbar: { show: false }, background: 'transparent' },
        colors: ['#00ff88'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        dataLabels: { enabled: true, style: { colors: ['#fff'] } },
        xaxis: { categories: nomes, labels: { style: { colors: '#888' } }, axisBorder: { show: false } },
        yaxis: { labels: { style: { colors: '#888' } } },
        grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
        theme: { mode: 'dark' }
    }).render();

    // Taxa de garantia por técnico
    new ApexCharts(document.querySelector('#chart-tecnico-garantia'), {
        series: [{ name: 'Garantia %', data: taxas.map(Number) }],
        chart: { type: 'bar', height: 300, toolbar: { show: false }, background: 'transparent' },
        colors: ['#ff4d4d'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        dataLabels: { enabled: true, formatter: (v) => v + '%', style: { colors: ['#fff'] } },
        xaxis: { categories: nomes, labels: { style: { colors: '#888' } }, axisBorder: { show: false } },
        yaxis: { max: 100, labels: { formatter: (v) => v + '%', style: { colors: '#888' } } },
        grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
        theme: { mode: 'dark' }
    }).render();
}

// ===== GRÁFICO: Equipamentos =====
function renderEquipamentosChart(fechadas) {
    const equip = {};
    fechadas.forEach(os => {
        let key = os.marca || os.equipamento || 'Sem Identificação';
        key = key.length > 25 ? key.substring(0, 22) + '...' : key;
        equip[key] = (equip[key] || 0) + 1;
    });

    const sorted = Object.entries(equip).filter(e => e[0] !== 'Sem Identificação').sort((a,b) => b[1]-a[1]).slice(0,8);
    if (sorted.length === 0) {
        document.querySelector('#chart-equipamentos').innerHTML = '<p style="color:#666; padding:40px; text-align:center; font-size:0.9rem;">Dados de marca/equipamento ainda não preenchidos nas OS</p>';
        return;
    }

    new ApexCharts(document.querySelector('#chart-equipamentos'), {
        series: sorted.map(e => e[1]),
        chart: { type: 'pie', height: 300, background: 'transparent' },
        labels: sorted.map(e => e[0]),
        colors: ['#00ff88','#00bfff','#f0c040','#ff4d4d','#a855f7','#f97316','#ec4899','#14b8a6'],
        stroke: { show: true, colors: ['#111'], width: 1 },
        dataLabels: { style: { colors: ['#fff'] }, dropShadow: { enabled: false } },
        theme: { mode: 'dark' },
        legend: { position: 'bottom', labels: { colors: '#888' } }
    }).render();
}

// ===== GRÁFICO: Radar de Risco =====
function renderRiskRadar(fechadas) {
    const counts = countKeywords(fechadas);
    const labels = ['Cremalheira', 'Motor', 'Controle RF', 'Bateria', 'Fim de Curso', 'Placa Eletr.'];
    const values = labels.map(l => counts[l] || 0);
    const maxVal = Math.max(...values, 1);
    const normalized = values.map(v => Math.round((v / maxVal) * 100));

    new ApexCharts(document.querySelector('#chart-risk'), {
        series: [{ name: 'Frequência de Defeito', data: normalized }],
        chart: { type: 'radar', height: 300, toolbar: { show: false }, background: 'transparent' },
        labels,
        colors: ['#00ff88'],
        stroke: { width: 2 },
        fill: { opacity: 0.25 },
        markers: { size: 4, colors: ['#fff'], strokeColors: '#00ff88', strokeWidth: 2 },
        yaxis: { show: false },
        xaxis: { labels: { style: { colors: Array(6).fill('#888') } } },
        plotOptions: { radar: { polygons: { strokeColors: 'rgba(255,255,255,0.1)', fill: { colors: ['rgba(0,0,0,0.05)', 'rgba(0,255,136,0.02)'] } } } },
        theme: { mode: 'dark' }
    }).render();
}

// ===== GRÁFICO: Volume Diário =====
function renderVolumeDiario(osRecentes) {
    const byDate = {};
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        byDate[key] = 0;
    }

    osRecentes.forEach(os => {
        const key = os.criado_em ? os.criado_em.split('T')[0] : null;
        if (key && byDate.hasOwnProperty(key)) byDate[key]++;
    });

    const dates = Object.keys(byDate).sort();
    const values = dates.map(d => byDate[d]);
    const labels = dates.map(d => {
        const parts = d.split('-');
        return parts[2] + '/' + parts[1];
    });

    new ApexCharts(document.querySelector('#chart-volume-diario'), {
        series: [{ name: 'OS Abertas', data: values }],
        chart: { type: 'area', height: 300, toolbar: { show: false }, background: 'transparent' },
        colors: ['#00ff88'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.02, stops: [0, 90, 100] } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: labels, labels: { style: { colors: '#666' }, rotate: -30 }, axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: 10 },
        yaxis: { labels: { style: { colors: '#888' } } },
        grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
        tooltip: { x: { show: true } },
        theme: { mode: 'dark' }
    }).render();
}

// ===== GRÁFICO: Heatmap por Dia x Hora =====
function renderHeatmap(allOS) {
    const heatmapData = {
        'Sex': Array(12).fill(0), 'Qui': Array(12).fill(0),
        'Qua': Array(12).fill(0), 'Ter': Array(12).fill(0), 'Seg': Array(12).fill(0)
    };
    const daysMap = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];

    allOS.forEach(os => {
        if (!os.criado_em) return;
        const d = new Date(os.criado_em);
        const dayStr = daysMap[d.getDay()];
        const hour = d.getHours();
        if (hour >= 8 && hour <= 19 && heatmapData[dayStr]) {
            heatmapData[dayStr][hour - 8]++;
        }
    });

    const series = Object.keys(heatmapData).map(k => ({ name: k, data: heatmapData[k] }));

    new ApexCharts(document.querySelector('#chart-heatmap'), {
        series,
        chart: { type: 'heatmap', height: 280, toolbar: { show: false }, background: 'transparent' },
        plotOptions: { heatmap: { shadeIntensity: 0.6, colorScale: { ranges: [
            { from: 0, to: 1, color: '#1a1a1a', name: 'Nenhum' },
            { from: 2, to: 5, color: '#006633', name: 'Baixo' },
            { from: 6, to: 15, color: '#00aa44', name: 'Médio' },
            { from: 16, to: 999, color: '#00ff88', name: 'Alto' }
        ]}}},
        dataLabels: { enabled: false },
        xaxis: { categories: ['08h','09h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h'], labels: { style: { colors: '#888' } } },
        yaxis: { labels: { style: { colors: '#888' } } },
        theme: { mode: 'dark' }
    }).render();
}
