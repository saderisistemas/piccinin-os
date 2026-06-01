/**
 * help.js - Módulo de Ajuda e Tooltips Globais (Piccinin OS)
 * Implementação premium e performática de UX assistiva.
 */

document.addEventListener('DOMContentLoaded', () => {
    initGlobalTooltip();
    initHelpDrawer();
});

/**
 * Inicializa a tooltip flutuante global
 */
function initGlobalTooltip() {
    // Cria o elemento da tooltip no body se não existir
    let tooltip = document.getElementById('global-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        document.body.appendChild(tooltip);
    }

    let activeTooltipTarget = null;

    // Helper para mostrar tooltip
    const showTooltip = (target) => {
        const text = target.getAttribute('data-tooltip');
        if (!text || text.trim() === '') return;

        tooltip.textContent = text;
        tooltip.classList.add('active');
        updateTooltipPosition(target, tooltip);
        activeTooltipTarget = target;
    };

    // Helper para esconder tooltip
    const hideTooltip = () => {
        tooltip.classList.remove('active');
        activeTooltipTarget = null;
    };

    // Delegação de eventos de Mouseover (Hover - Desktop)
    document.addEventListener('mouseover', (e) => {
        // Evita disparar hover se estiver em telas pequenas (mobile/touch)
        if (window.innerWidth <= 768) return;

        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        showTooltip(target);
    });

    document.addEventListener('mouseout', (e) => {
        if (window.innerWidth <= 768) return;

        const target = e.target.closest('[data-tooltip]');
        if (target) {
            hideTooltip();
        }
    });

    // Suporte a Toque/Clique (Mobile e Acessibilidade)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-tooltip]');
        
        if (target) {
            // Se clicou no mesmo elemento ativo, fecha. Caso contrário, abre.
            if (activeTooltipTarget === target) {
                hideTooltip();
            } else {
                showTooltip(target);
            }
            
            // Impede cliques em ícones de informação de disparar ações indesejadas
            if (e.target.closest('.info-icon')) {
                e.preventDefault();
                e.stopPropagation();
            }
        } else {
            // Clicou fora, fecha a tooltip ativa
            hideTooltip();
        }
    });

    // Se o elemento alvo for scrollado, fecha para evitar flutuar solto
    window.addEventListener('scroll', () => {
        hideTooltip();
    }, { passive: true });
}

/**
 * Atualiza a posição da tooltip dinamicamente em relação ao elemento alvo
 */
function updateTooltipPosition(target, tooltip) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Centraliza acima do elemento
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    let top = targetRect.top - tooltipRect.height - 8; // 8px de gap

    // Valida limites da tela (Esquerda)
    if (left < 10) {
        left = 10;
    }
    // Valida limites da tela (Direita)
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    // Valida limites da tela (Topo - se não couber acima, joga para baixo)
    if (top < 10) {
        top = targetRect.bottom + 8;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

/**
 * Inicializa a lógica do Drawer de Ajuda lateral
 */
function initHelpDrawer() {
    const helpModal = document.getElementById('helpModal');
    const closeBtn = document.getElementById('closeHelpModal');
    const triggers = document.querySelectorAll('#btn-help-trigger');

    if (!helpModal || !closeBtn) return;

    // Configura os triggers de abertura
    triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            renderContextualHelp();
            helpModal.classList.add('active');
        });
    });

    // Fechar ao clicar no botão 'X'
    closeBtn.addEventListener('click', () => {
        helpModal.classList.remove('active');
    });

    // Fechar ao clicar fora (no overlay)
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.remove('active');
        }
    });

    // Fechar ao apertar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.classList.contains('active')) {
            helpModal.classList.remove('active');
        }
    });
}

/**
 * Injeta o conteúdo de ajuda baseado na URL/página ativa
 */
function renderContextualHelp() {
    const body = document.getElementById('helpModalBody');
    if (!body) return;

    const path = window.location.pathname;
    let content = '';

    if (path.includes('relatorios.html')) {
        content = getRelatoriosHelp();
    } else if (path.includes('apelidos.html')) {
        content = getApelidosHelp();
    } else {
        content = getDashboardHelp();
    }

    body.innerHTML = content;
}

/**
 * Conteúdo de ajuda para a página principal (index.html)
 */
function getDashboardHelp() {
    return `
        <div class="help-section">
            <h3><i class="ri-dashboard-3-line"></i> Comando Ao Vivo</h3>
            <p>O painel <strong>Comando Ao Vivo</strong> fornece monitoramento em tempo real do ecossistema Piccinin OS. Aqui você acompanha a validação das ordens de serviço (OS) feitas pela <strong>Vanda AI</strong>.</p>
        </div>

        <div class="help-section">
            <h3><i class="ri-pulse-line"></i> Glossário de KPIs</h3>
            
            <div class="help-glossary-item">
                <strong>Volume Processado</strong>
                <span>Número total de atendimentos identificados e carregados a partir da base do Supabase no período.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Taxa de Conclusão</strong>
                <span>Percentual de chamados marcados como Concluídos ou Fechados, indicando resoluções finais efetuadas.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Tempo Médio (TMA)</strong>
                <span>Tempo Médio de Atendimento operacional por OS. Um TMA ideal ajuda a manter a eficiência operacional alta.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Evidências Coletadas</strong>
                <span>Quantidade total de mídias e fotos anexadas aos chamados que foram identificadas e indexadas no Google Drive.</span>
            </div>
        </div>

        <div class="help-section">
            <h3><i class="ri-robot-2-line"></i> Produtividade Vanda AI</h3>
            
            <div class="help-glossary-item">
                <strong>Tempo Poupado</strong>
                <span>Tempo operacional economizado na auditoria e faturamento automático. O cálculo base é de 15 minutos por OS auditada.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Precisão Zero-Touch</strong>
                <span>Métricas de assertividade da Vanda AI. Representa a taxa de auditorias automatizadas efetuadas com sucesso total na primeira tentativa, sem necessidade de reajustes ou intervenção manual humana.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Capital Auditado</strong>
                <span>Montante faturado que passou pela validação inteligente e cruzamento forense da Vanda AI antes de ser liberado.</span>
            </div>
        </div>

        <div class="help-section">
            <h3><i class="ri-cursor-line"></i> Dicas de Navegação</h3>
            <p>Clique em qualquer linha do <strong>Histórico de Atendimentos</strong> para abrir o <strong>Dossiê Forense</strong> completo de cada OS. Lá você poderá visualizar laudos, peças utilizadas e fotos das evidências.</p>
        </div>
    `;
}

/**
 * Conteúdo de ajuda para a página de inteligência (relatorios.html)
 */
function getRelatoriosHelp() {
    return `
        <div class="help-section">
            <h3><i class="ri-bar-chart-2-line"></i> Inteligência Tática</h3>
            <p>O <strong>Centro de Inteligência Tática</strong> analisa dados operacionais retroativos de 30 dias para identificar anomalias, otimizar faturamento e prevenir prejuízos.</p>
        </div>

        <div class="help-section">
            <h3><i class="ri-shield-check-line"></i> Análise de Garantia</h3>
            
            <div class="help-glossary-item">
                <strong>Taxa de Garantia</strong>
                <span>Percentual de OS classificadas como garantia/retrabalho. Taxas acima de 10% requerem atenção imediata da gerência para treinar equipes ou auditar qualidade de componentes.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Garantia vs Cobrado</strong>
                <span>Gráfico que contrapõe a receita gerada contra o custo de serviços de retrabalho sem custo ao cliente.</span>
            </div>
        </div>

        <div class="help-section">
            <h3><i class="ri-team-line"></i> Controle de Técnicos e Defeitos</h3>
            
            <div class="help-glossary-item">
                <strong>Técnico Top</strong>
                <span>Profissional operacional com o maior volume absoluto de ordens concluídas nos últimos 30 dias.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Radar de Risco por Categoria</strong>
                <span>Diferencia os defeitos por criticidade. Ajuda a planejar preventivas para evitar quebras recorrentes de equipamentos.</span>
            </div>
        </div>

        <div class="help-section">
            <h3><i class="ri-line-chart-line"></i> Evolução Temporal</h3>
            <p>O <strong>Heatmap</strong> indica picos horários e dias da semana em que os incidentes ocorrem. Utilize esta informação para redimensionar a equipe de plantão nos momentos críticos.</p>
        </div>
    `;
}

/**
 * Conteúdo de ajuda para a página de aliases (apelidos.html)
 */
function getApelidosHelp() {
    return `
        <div class="help-section">
            <h3><i class="ri-user-settings-line"></i> Dicionário de Apelidos</h3>
            <p>A Vanda AI realiza cruzamento inteligente de dados. No entanto, técnicos frequentemente escrevem nomes de clientes ou de peças com abreviações. O dicionário de aliases serve para ensinar à IA os sinônimos oficiais.</p>
        </div>

        <div class="help-section">
            <h3><i class="ri-settings-4-line"></i> Regras de Cadastro</h3>
            
            <div class="help-glossary-item">
                <strong>Termo de Busca (Alias)</strong>
                <span>Como o técnico escreve no campo de chat/OS. Exemplo: se o técnico digita "againdustria" ou "aga ind", registre esse termo (sempre minúsculo, sem acentos nem caracteres especiais).</span>
            </div>

            <div class="help-glossary-item">
                <strong>ID Oficial (Bom Saldo)</strong>
                <span>Código numérico único do cliente ou do produto no ERP oficial (Bom Saldo). Isso é crítico para garantir faturamento automático sem erros.</span>
            </div>

            <div class="help-glossary-item">
                <strong>Nome Oficial</strong>
                <span>O nome oficial cadastrado no ERP, usado para exibições e relatórios administrativos.</span>
            </div>
        </div>

        <div class="help-section">
            <h3><i class="ri-lightbulb-line"></i> Por que gerenciar apelidos?</h3>
            <p>Ao manter o dicionário atualizado, você reduz a taxa de auditorias que caem em <strong>Revisão Manual</strong> para 0%, aumentando a precisão <strong>Zero-Touch</strong> do sistema operacional.</p>
        </div>
    `;
}
