# KI - BomSaldo API Usage

## Descrição
A integração com o BomSaldo exige regras estritas de manipulação de cargas (payloads) e chamadas transacionais em rotas como `/produtos` e `/servicos`. 

## Regras de Mapeamento (PUT/POST OS)

### 1. Tratamento de Arrays de Inventário
A API exige itens dentro dos arrays de forma encapsulada onde a propriedade pai não tem o mesmo nome do interior. Exemplo no payload `produtos`:
\`\`\`json
"produtos": [
  {
    "produto": {
      "produto_id": "123",
      "variacao_id": null,
      "quantidade": "1",
      "valor_venda": "0" 
    }
  }
]
\`\`\`

### 2. Atendimentos Em Garantia:
- Financeiro (Pagamento): deve ser ignorado na UI ou enviado com a forma genérica `4354368` (Boleto/Faturado) com `valor_venda=0`
- Inventário de Serviço e Produto vinculados ao OS com Garantia preenchem `valor_venda = '0'`.

### 3. Observações vs. Observações Internas / Laudo
O BomSaldo expõe `observacoes` como campo voltado ao cliente/solicitação inicial e `observacoes_interna` ou `laudo` que abrigam os registros confidenciais e conclusões técnicas geradas pela agente AI após consolidar defeitos, laudos sistêmicos e horários preenchidos nos metadados.
