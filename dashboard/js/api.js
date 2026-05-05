// Conexão Supabase
const SUPABASE_URL = 'https://bnghvmromtukmflzeojd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WhaoNheZP7ydc_KFbjg0xw_aytkd7ti';

// O client Supabase foi injetado globalmente pela tag <script> no index.html
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Busca todas as ordens de serviço da view/tabela do Supabase.
 * @returns {Promise<{data: any[], error: any}>}
 */
async function fetchOrdensServicoAPI() {
    return await supabaseClient
        .from('ordens_servico')
        .select('*')
        .order('criado_em', { ascending: false });
}

/**
 * Inscreve-se nas mudanças em tempo real da tabela ordens_servico.
 * @param {Function} callback Função que recebe o payload da mudança
 */
function subscribeOrdensServico(callback) {
    return supabaseClient
        .channel('live-os-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'ordens_servico' },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();
}

/**
 * Busca as agregações do Centro de Inteligência
 * @returns {Promise<{data: any[], error: any}>}
 */
async function fetchAnalyticsDiarioAPI() {
    return await supabaseClient
        .from('analytics_diario')
        .select('*')
        .order('data_ref', { ascending: false })
        .limit(1); // Pega o fechamento mais recente
}

/**
 * Busca as evid�ncias individuais (fotos) de uma OS espec�fica
 * @param {string} osId ID da OS no Supabase
 * @returns {Promise<{data: any[], error: any}>}
 */
async function fetchEvidenciasOS(osId) {
    return await supabaseClient
        .from('ordens_servico_evidencias')
        .select('*')
        .eq('os_id', osId)
        .order('criado_em', { ascending: true });
} 
