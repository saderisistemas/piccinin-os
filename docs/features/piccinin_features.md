# Piccinin Security | Regras e Estrutura de Atendimento

## Regras de Negócio Operacionais Validadas (v3)

### Mapeamento correto de campos na OS
- `observacoes`: Orientação do serviço / motivo inicial da saída.
- `observacoes_interna` / `laudo`: Fechamento técnico final / texto valorizado pela IA.

### Horários do técnico
- **Entrada:** registrada automaticamente pela Vanda.
- **Saída:** coletada via pergunta. Ambos em `observacoes_interna`.

### Regra de garantia
- Quando em garantia: **IA não deve perguntar nada de financeiro**.
- Lançamento com valor R$ 0,00 no cadastro da OS para produtos e serviços pertinentes.

### Materiais sem cobrança
- Lançar no inventário da OS com valor_venda = 0, sem omiti-los.

### Evidências fotográficas
- São uma **recomendação**, não obrigação. Ausência de fotos **não bloqueia** o fluxo.

## Base Conversacional e Multimodal
- Transcrição de áudio e extração de insights por imagens anexadas.
- Perguntas devem ser guiadas, progressivas e curtas.

## Fluxo Macro (v3)
1. Workflow inicia, Vanda mapeia o Chatwoot.
2. Identifica cliente, OS (ou abre nova OS com motivo).
3. Coleta garantia, defeito, raiz e equipamento.
4. Consulta localiza IDs de produtos na API.
5. Pede fotos (uma vez).
6. Registra saída do técnico de campo.
7. Solicita pagamento apenas se fora de garantia.
8. Envia OS atualizada para Bom Saldo.
