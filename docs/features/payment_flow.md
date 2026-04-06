# Fluxo de Regras de Pagamento & Garantia

O fluxo de tratamento de cobrança difere centralmente baseado na etapa de "É uma visita em garantia?".

## 1. Atendimento com Garantia
Quando a OS for em garantia:
- A IA **NÃO** faz perguntas de escopo financeiro (nenhuma pergunta sobre valor, Pix, etc).
- Produtos aplicados, materiais e serviços devem receber valor de venda: **R$ 0,00**.
- O pagamento da OS no sistema fecha como zerado.
- *Aviso técnico*: Depende que a API do Bom Saldo receite valores `0` sem bloquear nas chaves de faturamento.

## 2. Materiais Sem Cobrança
Em visitas tarifadas, o técnico pode conceder algum conector de bonificação ou usar peças de baixa monta:
- O painel deve registrar com `valor_venda = 0` na submissão ao Bom Saldo.
- Os itens não devem ser omitidos do PUT de finalização (motivo: rastreabilidade no estoque).

## 3. Pagamento Fora de Garantia
- Somente fora de garantia a IA consulta se foi pago em dinheiro, faturado ou Pix.
- Converte os IDs de pagamento do Bom Saldo correspondentes (ex: 4354384 = Pix, 4354366 = Dinheiro, 4354368 = Boleto).
