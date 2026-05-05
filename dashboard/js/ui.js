// ui.js - Gerenciamento de Interface e Modais (Piccinin OS)

/**
 * Renderiza os cards de KPI principais
 */
function renderKPIs(data) {
    const totalOS = data.length;
    const emAndamento = data.filter(d => d.status_os === 'em_andamento').length;
    const concluidas = data.filter(d => d.status_os === 'concluida' || d.status_os === 'fechada').length;
    
    // Calcula TMA e Evidencias
    const somaTma = data.reduce((acc, curr) => acc + (Number(curr.tempo_atendimento_min) || 0), 0);
    const mediaTma = concluidas > 0 ? Math.round(somaTma / concluidas) : 0;
    const totalEvidencias = data.reduce((acc, curr) => acc + (Number(curr.qtd_evidencias) || 0), 0);

    const setContentIfExist = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // Atualiza KPIs se existirem na página atual
    setContentIfExist('kpi-total', totalOS);
    setContentIfExist('kpi-andamento', emAndamento);
    setContentIfExist('kpi-concluidas', concluidas);
    
    // Específicos do index.html
    setContentIfExist('kpi-fechadas', concluidas);
    setContentIfExist('kpi-tma', mediaTma);
    setContentIfExist('kpi-evidencias', totalEvidencias);
}

/**
 * Renderiza os indicadores de performance da IA (Vanda)
 */
function renderAIPerformance(data) {
    const totalIA = data.filter(d => d.qtd_interacoes_ia > 0).length;
    const acertosPrimeira = data.filter(d => d.ia_acertou_primeira === true).length;
    const taxaAcerto = totalIA > 0 ? Math.round((acertosPrimeira / totalIA) * 100) : 0;
    
    const elAccuracy = document.getElementById('vanda-accuracy');
    if (elAccuracy) elAccuracy.textContent = `${taxaAcerto}%`;
    
    const elHours = document.getElementById('vanda-hours');
    if (elHours) {
        const hoursSaved = Math.round((totalIA * 15) / 60);
        elHours.textContent = `${hoursSaved}h`;
    }

    const elCapital = document.getElementById('vanda-capital');
    if (elCapital) {
        const capital = data.filter(d => d.qtd_interacoes_ia > 0).reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
        elCapital.textContent = `R$ ${capital.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

/**
 * Renderiza a lista de Ordens de Serviço no grid principal
 */
function renderOSList(data) {
    const container = document.getElementById('osContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    data.forEach(os => {
        const row = document.createElement('div');
        row.className = 'os-row';
        
        const status = os.status_os || 'aberta';
        const criadoEm = os.criado_em ? new Date(os.criado_em).toLocaleDateString('pt-BR') : '-';
        const tma = os.tempo_atendimento_min ? `${Math.round(os.tempo_atendimento_min)}m` : '-';
        
        const entradaText = os.hora_entrada ? os.hora_entrada : '--:--';
        const saidaText = os.hora_saida ? os.hora_saida : '--:--';

        row.innerHTML = `
            <div class="os-col">
                <span class="os-col-title">Código</span>
                <span class="os-col-value" style="color:var(--piccinin-green); font-weight:700;">${os.os_codigo || '---'}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Cliente</span>
                <span class="os-col-value">${os.cliente_nome || 'Consumidor Final'}</span>
                <span style="font-size:0.6rem; color:var(--text-muted);">${os.cliente_endereco || ''}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Equipamento</span>
                <span class="os-col-value">${os.equipamento || '---'}</span>
                <span style="font-size:0.6rem; color:var(--text-muted);">${os.marca || ''} ${os.modelo || ''}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Técnico</span>
                <span class="os-col-value">${os.tecnico_nome || '---'}</span>
                <span style="font-size:0.7rem; color:var(--text-muted); margin-top:3px;"><i class="ri-login-circle-line"></i> In: ${entradaText} <br> <i class="ri-logout-circle-line"></i> Out: ${saidaText}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">TMA</span>
                <span class="os-col-value">${tma}</span>
            </div>
            <div class="os-col" style="align-items: flex-end;">
                <span class="tag tag-${status.replace(' ', '-')}">${status.toUpperCase()}</span>
            </div>
        `;
        row.addEventListener('click', () => openModal(os, entradaText, saidaText));
        container.appendChild(row);
    });
}

/**
 * Abre o modal de detalhes da OS de forma assíncrona para carregar evidências
 */
async function openModal(os, entradaText, saidaText) {
    const modal = document.getElementById('osModal');
    const body = document.getElementById('modalBody');
    
    // Reset e estado de carregamento
    document.getElementById('m-num').textContent = os.os_codigo || 'OS-###';
    let baseStatus = os.status_os ? os.status_os.toUpperCase() : 'DESCONHECIDO';
    document.getElementById('m-id').textContent = `BS-ID: ${os.os_id_bomsaldo || '-'} | Status: ${baseStatus}`;
    
    body.innerHTML = '<div style="text-align:center; padding:50px; color:var(--piccinin-green);"><i class="ri-loader-4-line ri-spin" style="font-size:2rem;"></i><p>Acessando Dossiê Forense...</p></div>';
    modal.classList.add('active');

    // Busca evidências reais da tabela associada no Supabase
    let evidences = [];
    try {
        if (typeof fetchEvidenciasOS === 'function') {
            const { data } = await fetchEvidenciasOS(os.id);
            evidences = data || [];
        }
    } catch (e) {
        console.error('Erro ao carregar evidências:', e);
    }

    const marcaModelo = (os.marca || '') + ' ' + (os.modelo || '');
    const garantiaStr = os.em_garantia ? 'Ativa' : 'Fora da Vigência';
    const numGarantia = os.em_garantia ? 'var(--piccinin-green)' : '#fff';
    
    const defectTxt = os.defeito || 'Sem relato inicial / Não preenchido.';
    const causeTxt = os.causa || 'Pendente / Não registrado';
    const solveTxt = os.solucao || 'Pendente / Não registrado';
    const reportTxt = os.relatorio_tecnico || 'Nenhum laudo final submetido ou aprovado pela Ia.';

    // Lógica da Galeria de Fotos
    let thumbsHtml = '';
    const qtdEvidenciasTotal = Math.max(evidences.length, Number(os.qtd_evidencias) || 0);

    if (evidences.length > 0) {
        evidences.slice(0, 4).forEach(ev => {
            const fileUrl = ev.link_arquivo || ev.arquivo_url || ev.link_arquivo_drive || ev.url_origem;
            const isImage = ev.tipo_arquivo ? ev.tipo_arquivo.includes('image') : (fileUrl && (fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null));
            
            thumbsHtml += `
                <div class="evidence-thumb" onclick="window.open('${fileUrl}', '_blank')" title="Abrir imagem individual">
                    ${isImage ? `<img src="${fileUrl}" alt="Evidência" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                    <i class="ri-image-line" style="display:none; font-size: 2rem; color: rgba(0,255,136,0.4);"></i>
                    <div class="evidence-overlay"><i class="ri-external-link-line"></i></div>
                </div>`;
        });

        if (evidences.length > 4) {
            thumbsHtml += `
                <div class="evidence-thumb more-evidences" onclick="window.open('${os.link_pasta_drive}', '_blank')">
                    <span>+${evidences.length - 4}</span>
                    <div style="font-size:0.6rem; text-transform:uppercase; margin-top:5px;">Ver Todas</div>
                </div>`;
        }
    } else if (qtdEvidenciasTotal > 0) {
        // Fallback para quando só há link da pasta
        for(let i=0; i<Math.min(qtdEvidenciasTotal, 4); i++) {
            thumbsHtml += `
                <div class="evidence-thumb" onclick="window.open('${os.link_pasta_drive}', '_blank')">
                    <i class="ri-folder-image-line" style="font-size: 2rem; color: rgba(0,255,136,0.4);"></i>
                    <div class="evidence-overlay"><i class="ri-external-link-line"></i></div>
                </div>`;
        }
    }

    let evidencesHtml = '';
    if (qtdEvidenciasTotal > 0) {
        evidencesHtml = `
            <div class="evidence-gallery">
                <h4 class="gallery-title"><i class="ri-focus-3-line"></i> Investigação Forense (Visual)</h4>
                <div class="gallery-grid">${thumbsHtml}</div>
                ${os.link_pasta_drive ? `<a href="${os.link_pasta_drive}" target="_blank" class="gallery-link">Abrir Dossiê Completo no Drive <i class="ri-arrow-right-up-line"></i></a>` : ''}
            </div>`;
    } else {
        evidencesHtml = `
            <div class="evidence-gallery empty-gallery">
                <i class="ri-image-circle-line"></i>
                <p>Nenhuma evidência fotográfica anexada.</p>
            </div>`;
    }

    body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap: 20px;">
            <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <h3 style="font-family:'Space Grotesk', sans-serif; color:var(--text-grey); font-size:0.9rem; letter-spacing:1px; text-transform:uppercase;">Contexto Operacional</h3>
                    <span class="tag tag-${os.fase_ia ? 'aberta' : ''}">Fase IA: ${os.fase_ia ? os.fase_ia.toUpperCase() : '-'}</span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Local Protegido</span><strong style="color:#fff;">${os.cliente_nome || '-'}</strong></div>
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Equipamento</span><strong style="color:#fff;">${marcaModelo.trim() ? marcaModelo : '-'}</strong></div>
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Especialista</span><strong style="color:#fff;">${os.tecnico_nome || '-'}</strong></div>
                    <div><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Garantia</span><strong style="color:${numGarantia};">${garantiaStr}</strong></div>
                    <div style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:10px;"><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Check-in</span><strong style="color:#fff;">${entradaText}</strong></div>
                    <div style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:10px;"><span style="display:block; font-size:0.75rem; color:var(--text-muted);">Check-out</span><strong style="color:#fff;">${saidaText}</strong></div>
                </div>
            </div>

            <div class="report-box">
                <div style="margin-bottom:15px;">
                    <strong>Relato do Incidente (Defeito):</strong><br>
                    ${defectTxt}
                </div>
                <div style="display:flex; gap:20px; margin-bottom:15px; padding-top:15px; border-top:1px dashed rgba(255,255,255,0.1);">
                    <div style="flex:1"><strong>Causa Verificada:</strong><br> ${causeTxt}</div>
                    <div style="flex:1"><strong>Solução:</strong><br> ${solveTxt}</div>
                </div>
                <div style="padding-top:15px; border-top:1px dashed rgba(255,255,255,0.1);">
                    <strong>Laudo Técnico Transcrito (Vanda):</strong><br>
                    <span style="font-style:italic; color:var(--text-white);">${reportTxt}</span>
                </div>
            </div>

            ${evidencesHtml}

            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--piccinin-green-dim); border:1px solid rgba(0,255,136,0.3); padding:20px; border-radius:10px; box-shadow: var(--glow-green-sm);">
                <div>
                     <span style="display:block; font-size:0.75rem; color:var(--piccinin-green); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; font-family:'Space Grotesk', sans-serif; font-weight:600;">Faturamento Audível</span>
                     <span style="font-size: 1.8rem; font-family:'Space Grotesk', sans-serif; font-weight:700; color:#fff;">R$ ${os.valor_total !== null && os.valor_total !== undefined ? Number(os.valor_total).toFixed(2) : '0.00'}</span>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}
