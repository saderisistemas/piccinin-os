# Mapeamento Inteligente: API Bom Saldo (`clickapp.apib`)

> [!WARNING]
> **ATENÇÃO INTELIGÊNCIA ARTIFICIAL:** 
> Nunca tente ler o arquivo `clickapp.apib` completo usando `view_file` ou `cat`. O arquivo contém mais de 15.000 linhas e destruirá nossa janela de contexto limitando a memória da sessão.

Para entender como se comunicar com a API do Bom Saldo (ERP Piccinin Security), utilize estritamente a ferramenta **`grep_search`**. 

## Estrutura Base
- URL Base: `https://bomsaldo.com`
- Autenticação por Headers em TODAS as rotas:
  - `access-token`: `[sua_chave]`
  - `secret-access-token`: `[sua_chave]`

## Como pesquisar Endpoints no ERP ERP Bom Saldo

1. **Ordens de Serviço:** Localizados em `/api/ordens_servicos`
   - Use `grep_search` procurando por "Ordens de Serviço" ou `/api/ordens_servicos/` com `MatchPerLine: true`. Retorne aos arredores da linha encontrada.
   - IDs de Formas de Pagamento Conhecidas e Mapeadas:
     - **Dinheiro:** `4354366`
     - **Boleto Faturamento Escritório:** `4354368`
     - **PIX Nubank:** `4354384` 
     - *Esses IDs são obrigatórios no array `pagamentos` ao criar ou atualizar requisições que possuem custo divergente do original.*

2. **Produtos e Serviços:**
   - Produtos estão em `/api/produtos/`
   - Serviços estão em `/api/servicos/`
   - Clientes estão em `/api/clientes/`

> [!TIP]
> Em requisições de atualização de OS (`PUT`), é mandatório fornecer `cliente_id`, `codigo`, `data`, e o recálculo somado financeiro completo sob `pagamentos` caso você insira novas taxas e serviços (consulte os patches já feitos no W6).
