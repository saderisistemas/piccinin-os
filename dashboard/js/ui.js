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
                <span class="os-col-value os-col-code">${os.os_codigo || '---'}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Cliente</span>
                <span class="os-col-value">${os.cliente_nome || 'Consumidor Final'}</span>
                <span class="os-col-subtext">${os.cliente_endereco || ''}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Equipamento</span>
                <span class="os-col-value">${os.equipamento || '---'}</span>
                <span class="os-col-subtext">${os.marca || ''} ${os.modelo || ''}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">Técnico</span>
                <span class="os-col-value">${os.tecnico_nome || '---'}</span>
                <span class="os-col-subtext-tech"><i class="ri-login-circle-line"></i> In: ${entradaText} <br> <i class="ri-logout-circle-line"></i> Out: ${saidaText}</span>
            </div>
            <div class="os-col">
                <span class="os-col-title">TMA</span>
                <span class="os-col-value">${tma}</span>
            </div>
            <div class="os-col os-col-end">
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
    
    body.innerHTML = '<div class="loader-container" aria-live="polite" role="status"><i class="ri-loader-4-line ri-spin loader-icon"></i><p class="loader-text">Acessando Dossiê Forense...</p></div>';
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
        evidences = null;
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
                    <i class="ri-image-line modal-gallery-icon-fallback"></i>
                    <div class="evidence-overlay"><i class="ri-external-link-line"></i></div>
                </div>`;
        });
 
        if (evidences.length > 4) {
            thumbsHtml += `
                <div class="evidence-thumb more-evidences" onclick="window.open('${os.link_pasta_drive}', '_blank')">
                    <span>+${evidences.length - 4}</span>
                    <div class="modal-gallery-badge-more">Ver Todas</div>
                </div>`;
        }
    } else if (qtdEvidenciasTotal > 0) {
        // Fallback para quando só há link da pasta
        for(let i=0; i<Math.min(qtdEvidenciasTotal, 4); i++) {
            thumbsHtml += `
                <div class="evidence-thumb" onclick="window.open('${os.link_pasta_drive}', '_blank')">
                    <i class="ri-folder-image-line modal-gallery-icon-fallback" style="display:block;"></i>
                    <div class="evidence-overlay"><i class="ri-external-link-line"></i></div>
                </div>`;
        }
    }

    let evidencesHtml = '';
    if (evidences === null) {
        evidencesHtml = `
            <div class="evidence-gallery empty-gallery" style="border-color: rgba(255,100,100,0.3);">
                <i class="ri-error-warning-line" style="color: rgba(255,100,100,0.8); opacity: 1;"></i>
                <p style="color: var(--text-grey);">Falha ao carregar evidências no Supabase.</p>
            </div>`;
    } else if (qtdEvidenciasTotal > 0) {
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

    // Alerta de erro de integração com a API do BomSaldo
    let errorApiHtml = '';
    if (os.erro_integracao_api) {
        errorApiHtml = `
            <div class="error-container" style="padding:1.5rem; margin-bottom:1.5rem; border-color:rgba(255,100,100,0.3); background:rgba(255,50,50,0.03); text-align:left; align-items:flex-start; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <i class="ri-error-warning-line" style="color:rgba(255,100,100,0.9); font-size:1.3rem;"></i>
                    <strong style="color:#fff; font-family:'Space Grotesk',sans-serif; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px; display:inline; margin:0;">Erro de Integração BomSaldo</strong>
                </div>
                <p style="color:var(--text-grey); font-size:0.85rem; margin:0; line-height:1.4;">${os.mensagem_erro_api || 'Falha desconhecida no sincronismo do faturamento com o BomSaldo.'}</p>
            </div>
        `;
    }

    // Tags de Auditoria/Revisão e Fase IA
    let tagsHtml = '';
    if (os.houve_revisao_manual) {
        tagsHtml += `<span class="tag" style="background:rgba(240,192,64,0.1); color:#f0c040; border:1px solid rgba(240,192,64,0.2); box-shadow: inset 0 0 10px rgba(240,192,64,0.05); margin-right:8px;">Revisão Manual</span>`;
    }
    tagsHtml += `<span class="tag tag-${os.fase_ia ? 'aberta' : ''}">Fase IA: ${os.fase_ia ? os.fase_ia.toUpperCase() : '-'}</span>`;

    // Metadados adicionais do Grid
    const checkinIcon = os.checkin_registrado ? '<i class="ri-checkbox-circle-fill" style="color:var(--piccinin-green); font-size:0.95rem; vertical-align:middle; margin-left:4px;" title="Registrado via GPS/Sistema"></i>' : '';
    const checkoutIcon = os.checkout_registrado ? '<i class="ri-checkbox-circle-fill" style="color:var(--piccinin-green); font-size:0.95rem; vertical-align:middle; margin-left:4px;" title="Registrado via GPS/Sistema"></i>' : '';
    const duracaoText = os.tempo_atendimento_min ? `${Math.round(os.tempo_atendimento_min)} min` : '-';
    const tipoPagamentoText = os.tipo_pagamento || '-';

    // Lógica para renderizar Peças & Serviços Lançados pelo técnico
    let itemsHtml = '';
    const produtos = os.produtos_json || [];
    const servicos = os.servicos_json || [];
    
    if (produtos.length > 0 || servicos.length > 0) {
        let prodRows = '';
        let servRows = '';
        
        if (produtos.length > 0) {
            produtos.forEach(p => {
                const prod = p.produto || p;
                const qtd = Number(prod.quantidade) || 0;
                const valorVenda = Number(prod.valor_venda) || 0;
                const total = Number(prod.valor_total) || (qtd * valorVenda);
                prodRows += `
                    <div class="modal-item-row" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:10px 15px; border-radius:4px; margin-bottom:6px;">
                        <div>
                            <strong style="color:#fff; font-size:0.9rem; display:inline;">${prod.nome_produto || 'Produto sem nome'}</strong>
                            <div style="color:var(--text-grey); font-size:0.75rem; margin-top:2px;">Qtd: ${qtd.toFixed(2)} | Unitário: R$ ${valorVenda.toFixed(2)}</div>
                        </div>
                        <strong style="color:var(--piccinin-green); font-size:0.9rem; font-family:'Space Grotesk', sans-serif;">R$ ${total.toFixed(2)}</strong>
                    </div>
                `;
            });
        }
        
        if (servicos.length > 0) {
            servicos.forEach(s => {
                const serv = s.servico || s;
                const qtd = Number(serv.quantidade) || 0;
                const valorVenda = Number(serv.valor_venda) || 0;
                const total = Number(serv.valor_total) || (qtd * valorVenda);
                servRows += `
                    <div class="modal-item-row" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:10px 15px; border-radius:4px; margin-bottom:6px;">
                        <div>
                            <strong style="color:#fff; font-size:0.9rem; display:inline;">${serv.nome_servico || 'Serviço sem nome'}</strong>
                            <div style="color:var(--text-grey); font-size:0.75rem; margin-top:2px;">Qtd: ${qtd.toFixed(2)} | Unitário: R$ ${valorVenda.toFixed(2)}</div>
                        </div>
                        <strong style="color:var(--piccinin-green); font-size:0.9rem; font-family:'Space Grotesk', sans-serif;">R$ ${total.toFixed(2)}</strong>
                    </div>
                `;
            });
        }
        
        itemsHtml = `
            <div class="modal-section-card" style="margin-top: 1.5rem;">
                <div class="modal-card-header" style="margin-bottom: 1rem;">
                    <h3 class="modal-card-title"><i class="ri-tools-line" style="color:var(--piccinin-green); margin-right:8px;"></i> Insumos & Serviços Aplicados</h3>
                </div>
                ${prodRows ? `
                    <div class="modal-products-list" style="margin-bottom: 1.2rem;">
                        <h4 style="font-family:'Space Grotesk', sans-serif; font-size:0.8rem; text-transform:uppercase; color:var(--text-grey); letter-spacing:1px; margin-bottom:8px;">Peças / Materiais</h4>
                        ${prodRows}
                    </div>
                ` : ''}
                ${servRows ? `
                    <div class="modal-services-list">
                        <h4 style="font-family:'Space Grotesk', sans-serif; font-size:0.8rem; text-transform:uppercase; color:var(--text-grey); letter-spacing:1px; margin-bottom:8px;">Serviços Realizados</h4>
                        ${servRows}
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        itemsHtml = `
            <div class="modal-section-card" style="margin-top: 1.5rem;">
                <div class="modal-card-header" style="margin-bottom: 1rem;">
                    <h3 class="modal-card-title"><i class="ri-tools-line" style="color:var(--text-grey); margin-right:8px;"></i> Insumos & Serviços Aplicados</h3>
                </div>
                <div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1.5rem 0; border:1px dashed rgba(255,255,255,0.08); border-radius:4px;">
                    <i class="ri-inbox-line" style="font-size:1.5rem; display:block; margin-bottom:6px; opacity:0.5;"></i>
                    Nenhuma peça ou serviço adicional lançado pelo técnico.
                </div>
            </div>
        `;
    }

    body.innerHTML = `
        <div class="modal-body-wrapper">
            ${errorApiHtml}
            <div class="modal-section-card">
                <div class="modal-card-header">
                    <h3 class="modal-card-title">Contexto Operacional</h3>
                    <div style="display:flex; align-items:center;">${tagsHtml}</div>
                </div>
                <div class="modal-grid-2col">
                    <div><span class="modal-grid-label">Local Protegido</span><strong class="modal-grid-value">${os.cliente_nome || '-'}</strong></div>
                    <div><span class="modal-grid-label">Equipamento</span><strong class="modal-grid-value">${marcaModelo.trim() ? marcaModelo : '-'}</strong></div>
                    <div><span class="modal-grid-label">Especialista</span><strong class="modal-grid-value">${os.tecnico_nome || '-'}</strong></div>
                    <div><span class="modal-grid-label">Garantia</span><strong class="modal-grid-value ${os.em_garantia ? 'warranty-active' : ''}">${garantiaStr}</strong></div>
                    <div><span class="modal-grid-label">Duração de Atendimento</span><strong class="modal-grid-value">${duracaoText}</strong></div>
                    <div><span class="modal-grid-label">Forma de Faturamento</span><strong class="modal-grid-value">${tipoPagamentoText}</strong></div>
                    <div class="modal-grid-cell-divider"><span class="modal-grid-label">Check-in</span><strong class="modal-grid-value">${entradaText}${checkinIcon}</strong></div>
                    <div class="modal-grid-cell-divider"><span class="modal-grid-label">Check-out</span><strong class="modal-grid-value">${saidaText}${checkoutIcon}</strong></div>
                </div>
            </div>

            <div class="report-box">
                <div class="modal-report-paragraph">
                    <strong>Relato do Incidente (Defeito):</strong>
                    ${defectTxt}
                </div>
                <div class="modal-report-grid">
                    <div class="modal-report-col"><strong>Causa Verificada:</strong> ${causeTxt}</div>
                    <div class="modal-report-col"><strong>Solução:</strong> ${solveTxt}</div>
                </div>
                <div class="modal-report-divider-top">
                    <strong>Laudo Técnico Transcrito (Vanda):</strong>
                    <span class="modal-report-italic">${reportTxt}</span>
                </div>
            </div>

            ${itemsHtml}

            ${evidencesHtml}

            <div class="modal-billing-card">
                <div>
                     <span class="modal-billing-label">Faturamento Audível</span>
                     <span class="modal-billing-value">R$ ${os.valor_total !== null && os.valor_total !== undefined ? Number(os.valor_total).toFixed(2) : '0.00'}</span>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

/**
 * Renderiza um estado de erro amigável na listagem principal com botão de recarregar
 */
function renderErrorState(message) {
    const container = document.getElementById('osContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-container">
            <i class="ri-error-warning-line error-icon"></i>
            <h3 class="error-title">Falha de Sincronização</h3>
            <p class="error-text">${message || 'Não foi possível conectar ao banco de dados Supabase.'}</p>
            <button class="btn-retry" id="btnRetryOS"><i class="ri-refresh-line"></i> Tentar Novamente</button>
        </div>
    `;
    
    const btnRetry = document.getElementById('btnRetryOS');
    if (btnRetry) {
        btnRetry.addEventListener('click', async () => {
            container.innerHTML = `
                <div class="loader-container" aria-live="polite" role="status">
                    <i class="ri-loader-4-line ri-spin loader-icon"></i>
                    <p class="loader-text">Tentando reconectar à Vanda AI...</p>
                </div>
            `;
            if (typeof fetchOrdensServico === 'function') {
                await fetchOrdensServico();
            }
        });
    }
}
