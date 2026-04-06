# Knowledge Item: Bom Saldo API Schema (OS)

Este documento guarda os metadados fixos de integração do Bom Saldo para o projeto Protek OS.

## 1. Endpoints de Escrita (POST/PUT)

### 1.1 /ordens-servico/
Payload base aceito:
```json
{
  "cliente_id": "string | number (ID real do banco)",
  "situacao_id": "string (ex: 6237497)",
  "data_entrada": "YYYY-MM-DD",
  "observacoes": "texto (Orientação/Solicitação)",
  "observacoes_interna": "texto (Laudo técnico / Horários)",
  "produtos": [
    {
      "produto": {
        "produto_id": "string",
        "quantidade": "string",
        "valor_venda": "string"
      }
    }
  ],
  "servicos": [
    {
      "servico": {
        "servico_id": "string",
        "quantidade": "string",
        "valor_venda": "string"
      }
    }
  ],
  "pagamentos": [
    {
      "pagamento": {
        "data_vencimento": "YYYY-MM-DD",
        "valor": "string (format: X.XX)",
        "forma_pagamento_id": "string"
      }
    }
  ]
}
```

## 2. IDs de Formas de Pagamento
* **Pix (Nubank/Geral):** 4354384
* **Pix (Inter):** 4377571
* **Dinheiro/Espécie:** 4354377
* **Boleto / Faturado (Escritório):** 4366641

## 3. Atributos Adicionais (Atributo_OS)
Para passar metadados extras que não são nativos da OS (campos extras da Protek):
* **ID: 58530** → Orientação do Serviço.
* **ID: 58528** → Relatório Técnico.
* **ID: 58529** → Tipo de Serviço (Garantia / Chamado Real).

## 4. Notas Técnicas
- **Garantia:** Sempre enviar `valor_venda = 0` nos itens e pagamento total zerado.
- **IDs Órfãos:** Evitar carregar itens `servico_id = ""` vindos do GET para o payload do PUT, pois a API pode rejeitar ou duplicar órfãos. 
- **Inativação:** Para limpeza no Bom Saldo, passar `ativo: "0"` no PUT.
