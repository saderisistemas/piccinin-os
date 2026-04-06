// lib/data_transformers.js
// Exporta utilitários puros de processamento

const cleanString = (s) => (s || '').trim().toLowerCase();
const getDoc = (c) => (c.cnpj || c.cpf || '').replace(/[^\d]/g, '');
const getModTime = (item) => new Date(item.modificado_em || item.cadastrado_em || 0).getTime();

const normalize = (str) => !str ? '' : str
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const tokenize = (str) => {
  const STOP = ['ltda','eireli','epp','me','sa','ss','comercio','comercial',
    'industria','servico','servicos','grupo','brasil','do','da','de','dos','das','e'];
  return normalize(str).split(' ').filter(t => t.length > 2 && !STOP.includes(t));
};

module.exports = {
  cleanString,
  getDoc,
  getModTime,
  normalize,
  tokenize
};
