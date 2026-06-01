# PRD Geral e Checklist de Promocao para Producao

**Data**: 2026-05-01 (Promovido em 2026-05-04, Estabilizado em 2026-05-31)
**Projeto**: Piccinin Security OS (Protek OS) — Agente Vanda + Bom Saldo + Supabase + Notificações W11
**Status**: [x] Produção Estável (Live)

---

## 1. Resultados da Validacao Final e Ajustes Pos-Deploy

| Teste | OS | Resultado | Detalhes |
|-------|----|-----------|----------|
| W1 Full E2E (Chatwoot + Imagem + Fechamento) | #1714 | ALL PASSED (10/10) | status=concluida, fase=fechado, garantia=true, CHEGADA/SAIDA/TEMPO ok, sem NaN |
| W6 Homologacao Final (contrato Bom Saldo) | #1713 | ALL PASSED (16/16) | data_entrada/saida ok, tecnico nativo, sem hora nativa, Supabase consistente |
| Ajustes Pos-Deploy (W11 + UX + Ordem Busca) | E2E Geral | ALL PASSED (2026-05-04) | W11 enviando notificações, seleção numérica tratada, OS mais recente priorizada |

### Evidencias E2E (#1714)
- Chatwoot -> W1 -> abertura: OS #367184330 criada em 35s, Supabase ok
- Imagem -> W7: Webhook 200 (0 evidencias: URL mockada de teste)
- Fechamento garantia: [CHEGADA: 16:00] [SAIDA: 16:45] [TEMPO: 45 min] sem NaN

### Evidencias W6 (#1713)
- PUT chegada 14:30: HTTP 200, Supabase ok
- PUT itens (produto 91878728 + servico 89517949): HTTP 200
- PUT fechar garantia 15:10: HTTP 200, valor_total=0
- Supabase: hora_entrada=14:30, hora_saida=15:10, tempo=40, concluida, fechado, em_garantia=true
- Sem hora nativa no Bom Saldo, sem NaN

### Ajustes Aplicados Pos-Deploy (2026-05-04)
- **Inclusão do W11 no Fluxo de Evidências**: Adicionado nó `Preparar Dados W11` (Code) e nó `Sub - Notificar Grupo W11` (Sub-workflow) após o `Sub - Salvar Evidencias2` (W7) no W1 de produção, direcionando as notificações do WhatsApp para o grupo correspondente com os links das evidências e da pasta no Google Drive (`KCszYFEHuREGsVrE`).
- **Correção de UX na Seleção de Produtos**: Atualizado o system prompt (`REGRA 3`) no W1 de produção para evitar que a IA interprete uma resposta numérica simples (ex: "1") como código de OS e execute atualizações prematuras de OS. A diretiva orienta o uso do `option_map` no histórico para registrar produtos/serviços e persistir no Supabase via `salvarContexto`.
- **Preservação da OS Ativa (Ordem de Busca)**: Alterado o filtro do nó `BuscarTecnico` (Supabase) para `status_os=in.(aberta,em_andamento)&order=criado_em.desc` para garantir que a IA sempre trabalhe com a OS mais recente daquele técnico, evitando o resgate de OS antigas e inativas.

## 2. Inventario Workflows

### Producao Ativa (n8n cloudfy)

| W | ID | Active | MCP |
|---|---|--------|-----|
| W1 | BZ429y5KhQxWZ76O | true | true |
| W2 | cdirQ2Av9MVLrDIK | true | true |
| W3 | u9jabM2Dlah82Qrd | true | true |
| W3b | v3DTO6nSZ2rZERYD | true | true |
| W4 | iJRYEqsLzCVACG0j | true | true |
| W5 | Dhp6XByNpzhyVqza | true | true |
| W6 | hhFMx49xvO5WSxW9 | true | true |
| W7 | 0HxglGmNg0W0JYIs | true | true |
| W8 | cYIrVtfY8qfkwj38 | true | true |
| W9 | euPVASK7Ycfi6zWk | true | true |
| W10 | wNgtnqLZ6S09QRlF | true | true |

### Workflows de apoio (NAO alterar)
- 1-Piccinin Security - Secretaria Vanda (KE5GaNcivBp1OAMNQ4Qd4)
- 2-sobreEmpresa Piccinin, 3-CRM Piccinin, 4-AvisarGrupo
- Piccinin Follow Up 20min, Piccinin Follow Up 24HS

### DEV (source of truth)
Todos workflows em workflows/DEV/ prontos para PRD.

## 3. Checklist de Promocao DEV -> PRD

### FASE A — Backup e Snapshot (OBRIGATORIO)
- [x] A1. Export baseline completo de producao (baselines/n8n_pre_prd_backup/)
- [x] A2. Export manual de cada workflow via API (list_workflows.ps1)
- [x] A3. Snapshot Supabase tabela ordens_servico
- [x] A4. Verificar integridade JSON dos DEV workflows

### FASE B — Promocao (EXECUTAR EM JANELA)
- [x] B1. Desativar W1 producao (toggle Active OFF)
- [x] B2. Upload W2-W10 DEV -> Producao via node deploy_workflows.js
- [x] B3. Upload W1 DEV -> Producao via node upload_w1.js (preserva webhook)
- [x] B4. Verificar W3b URL (bomsaldo.com/api/ordens_servicos/)
- [x] B5. Verificar W6 campos: data_entrada/saida, tags CHEGADA/SAIDA/TEMPO, garantia valor_venda=0, forma_pagamento_id=4366641
- [x] B6. Verificar W7 Google Drive credentials
- [x] B7. Reativar W1 producao (toggle Active ON)

### FASE C — Smoke Test em Producao
- [x] C1. Teste abertura de OS real via Chatwoot
- [x] C2. Teste envio de imagem real (W1 -> W7 Drive -> DB -> W9)
- [x] C3. Teste fechamento em garantia (node run_w6_final_homolog.js)
- [x] C4. Verificar ausencia de NaN em todos os campos
- [x] C5. Validar resposta real da Vanda no Chatwoot

### FASE D — Monitoramento 24h (Concluido e Estabilizado)
- [x] D1. Monitorar execucoes W1 via n8n UI
- [x] D2. Verificar logs de erro (W1-W10)
- [x] D3. Acompanhar OS criadas no Supabase
- [x] D4. Confirmar consistencia Supabase <-> Bom Saldo
- [x] D5. Rollback plan: restaurar baseline pre-prd

## 4. Contrato Tecnico Validado (W6)

PUT fechamento garantia minimo:
- codigo, cliente_id: 34472768, data, data_entrada, data_saida, saida
- situacao_id: 6237499 (Concretizada)
- observacoes_interna com [CHEGADA], [SAIDA], [TEMPO]
- tecnico_id: 1287733 (Danilo Saderi)
- produtos/servicos com valor_venda = 0
- pagamentos com valor = 0.00, forma_pagamento_id = 4366641

### IDs fixos de referencia
- cliente_id: 34472768 (A G A INDUSTRIA)
- situacao_id: Aguardando=6237497, Em andamento=6237498, Concretizada=6237499
- tecnico_id: 1287733 (Danilo Saderi)
- produto_id: 91878728, variacao_id: 160266193
- servico_id: 89517949 (BATERIA)
- forma_pagamento_id garantia: 4366641 (Boleto NUBANK)
- vendedor_id: 906858 (Eduardo Piccinin)

## 5. Configuracoes de Ambiente
- BOMSALDO_ACCESS_TOKEN / SECRET -> .env + n8n credentials
- N8N_API_URL = https://piccininsecurity-n8n.cloudfy.live/
- SUPABASE_URL = https://bnghvmromtukmflzeojd.supabase.co

## 6. Scripts de Deploy
| Script | Funcao |
|--------|--------|
| deploy_workflows.js | W2-W10 DEV -> PRD |
| upload_w1.js | W1 DEV -> PRD (preserva webhook) |
| run_w1_full_e2e.js | E2E completo (abertura+imagem+fechamento) |
| run_w6_final_homolog.js | Homologacao contrato Bom Saldo |

## 7. Riscos e Mitigacoes
- Webhook W1 perder credenciais: Baixa (upload_w1.js preserva no live)
- W7 Google Drive token expirado: Media (verificar antes do deploy)
- Chatwoot payload divergente: Baixa (validado #1714)
- Bom Saldo rejeitar campo extra: Baixa (PUT completo testado #1713)

## 8. Aprovacao
- [x] Validacao E2E #1714 — ALL PASSED, sem NaN
- [x] Homologacao W6 #1713 — 16/16 assertions
- [x] Backup producao executado (Fase A)
- [x] Smoke test producao aprovado (Fase C)
- [x] Monitoramento 24h sem incidentes (Fase D)

**Status final**: [x] Validado em DEV | [x] Promovido para Produção (PRD) — Implantado com sucesso em 2026-05-04 e estável no ambiente de produção.
