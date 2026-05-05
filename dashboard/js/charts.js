let chartRevenueInstance = null;
let chartWarrantyInstance = null;

function renderCharts(data) {
    if (!data || data.length === 0) return;

    // --- Preparando Dados: Evolução do Capital Auditado ---
    // Filtra apenas OS fechadas/concluidas que tenham valor
    const validas = data.filter(d => (d.status_os === 'fechada' || d.status_os === 'concluida') && d.valor_total);
    
    // Agrupa por data de entrada
    const revenueByDate = {};
    validas.forEach(d => {
        // Pega apenas a data YYYY-MM-DD
        const dateStr = d.data_entrada ? d.data_entrada.split('T')[0] : 'Desconhecida';
        if (!revenueByDate[dateStr]) revenueByDate[dateStr] = 0;
        revenueByDate[dateStr] += Number(d.valor_total);
    });

    // Ordena as chaves de data cronologicamente
    const sortedDates = Object.keys(revenueByDate).sort();
    const revenueCategories = sortedDates;
    const revenueSeries = sortedDates.map(date => revenueByDate[date].toFixed(2));

    const revenueOptions = {
        series: [{
            name: 'Capital Auditado (R$)',
            data: revenueSeries
        }],
        chart: {
            type: 'area',
            height: 300,
            toolbar: { show: false },
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 }
            }
        },
        colors: ['#00ff88'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: revenueCategories,
            labels: { style: { colors: '#888' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { colors: '#888' },
                formatter: (value) => { return "R$ " + value }
            }
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.05)',
            strokeDashArray: 4,
            yaxis: { lines: { show: true } }
        },
        theme: { mode: 'dark' },
        tooltip: { theme: 'dark' }
    };

    // --- Preparando Dados: Garantia vs Custo ---
    let qtdGarantia = 0;
    let qtdCobrado = 0;

    data.forEach(d => {
        const valGarantia = String(d.em_garantia).toLowerCase();
        if (d.em_garantia === true || valGarantia === 'sim' || valGarantia === 'true') {
            qtdGarantia++;
        } else {
            qtdCobrado++;
        }
    });

    const warrantyOptions = {
        series: [qtdGarantia, qtdCobrado],
        chart: {
            type: 'donut',
            height: 300,
            background: 'transparent'
        },
        labels: ['Em Garantia', 'Fora de Garantia'],
        colors: ['#00ff88', '#1a1a1a'],
        stroke: { show: true, colors: ['#222'], width: 1 },
        dataLabels: {
            enabled: true,
            style: { colors: ['#111', '#fff'] },
            dropShadow: { enabled: false }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: { color: '#888' },
                        value: { color: '#fff', fontSize: '1.2rem', fontWeight: 600 }
                    }
                }
            }
        },
        theme: { mode: 'dark' },
        legend: { position: 'bottom', labels: { colors: '#888' } },
        tooltip: { theme: 'dark' }
    };

    // --- Renderização ---
    if (chartRevenueInstance) {
        chartRevenueInstance.updateOptions(revenueOptions);
    } else {
        chartRevenueInstance = new ApexCharts(document.querySelector("#chart-revenue"), revenueOptions);
        chartRevenueInstance.render();
    }

    if (chartWarrantyInstance) {
        chartWarrantyInstance.updateOptions(warrantyOptions);
    } else {
        chartWarrantyInstance = new ApexCharts(document.querySelector("#chart-warranty"), warrantyOptions);
        chartWarrantyInstance.render();
    }
}
