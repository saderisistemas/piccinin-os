# Piccinin Security | Integração API Bom Saldo

## 13. Abertura e atualização de OS no Bom Saldo

### 13.1 Endpoint Possibilidades
A API suporta listar e operar OS, clientes, e produtos.

### 13.2 Estratégia recomendada (V3)

#### Abertura Rápida (POST)
- Abrir a OS inicial, vinculando o cliente e o técnico.
- Gravar o motivo no campo oficial estipulado: `observacoes`

#### Atualização (PUT)
- Enviar os dados coletados de encerramento para: `observacoes_interna` ou `laudo`.
- Inserir na timeline horários de entrada e saída.
- Arrays `produtos` e `servicos`: Lançar via busca de IDs, permitindo valores = 0 quando aplicável.

### 13.3 Dependências de Cadastro/Regra
Itens importantes para revisão com a implantação:
- OS em Garantia no cadastro local.
- Confirmação de IDs de Payment Forms: Pix (4354384), Dinheiro (4354366) e Faturado (4354368).
- Catálogos atualizados para suportar o match via N8N.
