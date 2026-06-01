# W1 - Integrações Ativas

Mapa dos subworkflows publicados e dos payloads esperados pelo W1 em produção.

## IDs ativos

- `W2 - Buscar Cliente Bom Saldo`: `cdirQ2Av9MVLrDIK`
- `W3 - Buscar OS Bom Saldo`: `u9jabM2Dlah82Qrd`
- `W3b - Criar OS Bom Saldo`: `v3DTO6nSZ2rZERYD`
- `W4 - Buscar Produtos Bom Saldo`: `iJRYEqsLzCVACG0j`
- `W5 - Buscar Servicos Bom Saldo`: `Dhp6XByNpzhyVqza`
- `W6 - Atualizar Fechar OS Bom Saldo`: `hhFMx49xvO5WSxW9`
- `W7 - Salvar Evidencias Drive`: `0HxglGmNg0W0JYIs`
- `W8 - Salvar Contexto OS`: `cYIrVtfY8qfkwj38`
- `W9 - Buscar Contexto OS`: `euPVASK7Ycfi6zWk`
- `W11 - Notificar Grupo Evidencia`: `KCszYFEHuREGsVrE`

## Payloads usados pelo W1

### `buscarCliente`
- `nome`
- `tecnico_id`
- `id_conversa`

### `buscarOS`
- `nome`

### `criarOS`
- `cliente_id`
- `situacao_id`
- `observacoes`
- `tecnico_nome`
- `tecnico_id`
- `tecnico_whatsapp`
- `conversa_id`
- `cliente_nome`

### `buscarProdutos`
- `nome`
- `produtos`

### `buscarServicos`
- `nome`
- `servicos`

### `atualizarOS`
- `os_id`
- `os_codigo`
- `relatorio_tecnico`
- `equipamento`
- `marca`
- `modelo`
- `defeito`
- `solucao`
- `laudo`
- `produtos_json`
- `servicos_json`
- `situacao_id`
- `tipo_pagamento`
- `hora_entrada`
- `hora_saida`
- `em_garantia`
- `tipo_servico`
- `tecnico_id`
- `conversa_id`
- `observacoes_orientacao`
- `forma_pagamento_id`

### `salvarContexto`
- `os_codigo`
- `os_id_bomsaldo`
- `conversa_id`
- `tecnico_id`
- `tecnico_nome`
- `tecnico_whatsapp`
- `cliente_codigo`
- `cliente_nome`
- `fase_ia`
- `status_os`
- `cliente_endereco`
- `equipamento`
- `equipamento_codigo`
- `marca`
- `modelo`
- `defeito`
- `causa`
- `solucao`
- `relatorio_tecnico`
- `tipo_servico`
- `servico_nome`
- `servico_codigo`
- `observacoes_orientacao`
- `em_garantia`
- `tipo_pagamento`
- `forma_pagamento_id`
- `valor_total`
- `hora_entrada`
- `hora_saida`
- `link_pasta_drive`
- `motivo_cancelamento`

### `buscarContexto`
- `os_codigo`
- `tecnico_id`

### `W7 - Salvar Evidencias Drive`
- `urlImagem`
- `os_codigo`
- `cliente_nome`
- `descricao`
- `tecnico_id`
- `tecnico_nome`
- `conversa_id`

### `W11 - Notificar Grupo Evidencia`
- `os_codigo`
- `cliente_nome`
- `tecnico_nome`
- `qtd_evidencias`
- `link_arquivo_drive`
- `link_pasta_drive`
- `arquivo_nome`
- `descricao`

## Observações

- O W1 ativo em produção foi sincronizado em 2026-05-04 com o JSON local atual.
- O workflow publicado agora tem 80 nós, igual ao arquivo local.
- O `buscarCliente` publicado usa `setarInfo1` e `setarInfo5`; não há mais referências antigas para `BuscarTecnico`, `setarInfo4` ou `setarInfo`.
- O W2 `cdirQ2Av9MVLrDIK` foi testado isoladamente com sucesso em 2026-05-03.
- O `W11` ativo é o workflow `KCszYFEHuREGsVrE`, não o antigo gerenciador de contexto.
- O fluxo de evidências usa `Preparar Payload W11 Evidencia` antes do `Sub - Notificar Grupo Evidencia`.
