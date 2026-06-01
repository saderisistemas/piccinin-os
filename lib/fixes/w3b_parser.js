/**
 * lib/fixes/w3b_parser.js
 * Retorna os nós e conexões corrigidos para o W3b.
 * Refatorado para reduzir token context.
 */
const { getW3bNodes } = require('./w3b_nodes');
const { getW3bConnections } = require('./w3b_connections');

module.exports = { getW3bNodes, getW3bConnections };
