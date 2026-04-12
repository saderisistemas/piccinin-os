/**
 * lib/w6/parse_time.js
 * Utilitários para parse de tempo da OS
 */

// Normaliza qualquer formato de hora para string 'HH:MM'
// NUNCA cria new Date() a partir de strings simples (evita UTC offset)
const parseHoraStr = (raw) => {
  if (!raw || raw === '') return null;
  const s = String(raw).trim();
  // Ja e HH:MM ou HH:MM:SS
  const mColon = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (mColon) return `${mColon[1].padStart(2,'0')}:${mColon[2]}`;
  // HHhMM ou HHh (ex: '15h45', '15h')
  const mH = s.match(/^(\d{1,2})h(\d{2})?$/i);
  if (mH) return `${mH[1].padStart(2,'0')}:${(mH[2]||'00').padStart(2,'0')}`;
  // ISO timestamp do Supabase (ex: '2026-04-05T18:45:00+00:00')
  // Estes JA foram convertidos para texto 'HH:MM' no W8, mas por seguranca:
  if (s.includes('T') || s.includes(' ')) {
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch {}
  }
  return null;
};

// Calcular diferenca em minutos entre duas strings 'HH:MM'
const calcMinutos = (hhmm1, hhmm2) => {
  if (!hhmm1 || !hhmm2) return null;
  const [h1, m1] = hhmm1.split(':').map(Number);
  const [h2, m2] = hhmm2.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff : null;
};

module.exports = { parseHoraStr, calcMinutos };
