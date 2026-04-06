# Integração Bom Saldo (Sincronização de OS)

## Mapeamento de Campos da Ordem de Serviço

| Campo na OS (Bom Saldo) | O que deve conter e Regras Associadas |
|---|---|
| `observacoes` | **Orientação do serviço**: Motivo inicial da saída / solicitação original / contexto do chamado. A Vanda precisa incluir na abertura. |
| `observacoes_interna` / `laudo` | **Descrição do serviço realizado**: Fechamento técnico final, com estruturação da execução. Também inclui o *horário de entrada* e o *horário de saída* reportados pelo técnico. |

## Regra de Modelagem de Lançamentos

1. **Produtos**: Materiais, peças, cabos.
2. **Serviços**: Execução técnica, diárias, deslocamento.
3. **Equipamentos**: Defeito original e laudo.

## Busca de API (Materiais/Serviços)

- A Vanda converte entrada multimodal ou texto em itens e pesquisa nos endpoints `GET /produtos` e `GET /servicos`.
- Busca os itens iterativamente pela nomeação, tenta emparelhar a melhor correspondência lógica.
- Resolve retornos em lote e confirmação quando em dúvida. 
- Em caso de falha de localização, agenda para revisão humana para fins do "MVP".

## Dependências / Riscos da Integração
1. A API deve aceitar PUTs que contenham descrições grandes.
2. Identificação ambígua de Materiais vs Cadastros do estoque real exige conferência manual ou via MCP quando desajustados.
