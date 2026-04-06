# PRD Base — Piccinin Security | Agente IA + Bom Saldo

**Versão**: 3.0  
**Status**: Documento principal indexado (Otimizado).  
Este é o índice principal do produto, atualizado sob o fluxo da versão 3.

## Índice de Documentação

- [📖 Arquitetura e Integrações](./docs/architecture_piccinin.md): Decisões sobre MCP, n8n, Drive e Antigravity.
- [⚙️ Regras de Convenção e UX Conversacional](./docs/features/piccinin_features.md): Configuração da Vanda, preenchimento financeiro com `valor_venda = 0` para garantias, horários de técnico e observações.
- [🔌 Fluxo Operacional da API](./docs/api_piccinin.md): Documento de mapeamento PUT/POST de OS no Bom Saldo, incluindo payment IDs e arrays transacionais.

## Visão Geral 
A Piccinin Security implantará um agente que guiará as vistorias/serviços de seus técnicos de campo. Sua particularidade concentra-se em mapeamentos severos de campos da OS (`observacoes_interna` vs. `observacoes`) e manipulação de formas de pagamento exclusivas (Garantia/Zero Rate).
