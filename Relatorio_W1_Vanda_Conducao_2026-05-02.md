# Relatorio W1 Vanda - Conducao Operacional

Data: 2026-05-02
Projeto: PICCININ OS / Piccinin Security OS

## Resultado

- W1 DEV atualizado e testado.
- W1 PROD atualizado e verificado remoto.
- Cancelamento automatico removido da IA.
- Conducao pos-abertura aprovada.
- salvarContexto funcionando para defeito tecnico.
- Chegada funcionando com atualizarOS.

## Workflows

- W1 DEV: `4wGT1LXHyw7vdHbS`
- W1 PROD: `p7VK6uoHHHVMOa2U`

## Testes DEV

- `20863`: abertura de nova OS.
- `20864`: busca/lista de cliente Mercurio.
- `20866`: escolha da opcao e criacao da OS.
- `20868`: defeito tecnico salvo via salvarContexto.
- `20870`: continuar assumindo OS ativa.
- `20871`: preencher OS assumindo OS ativa.
- `20872`: chegada registrada via atualizarOS.
- `20874`: frase tecnica salva via salvarContexto.
- `20876`: pedido de cancelamento sem chamar tool de cancelamento.

## Cancelamento

Cancelamento de OS ficou fora da IA.

- Nao ha node/tool `cancelarOS` no W1 DEV remoto.
- Nao ha node/tool `cancelarOS` no W1 PROD remoto.
- O prompt nao contem conducao de cancelamento automatico.
- Resposta operacional aprovada: cancelamento de OS e feito somente pelo site do Bom Saldo.

## Export PROD

O W1 PROD remoto foi definido como fonte correta.

Arquivo local canonico substituido por export limpo do remoto:

- `workflows/W1 - Protek OS - Agente Principal.json`

Backup do arquivo local antigo quebrado:

- `workflows/W1 - Protek OS - Agente Principal.broken_20260502_230329.json`

Validacao do export local:

- JSON valido.
- Workflow ID: `p7VK6uoHHHVMOa2U`
- Nome: `[PROD][PICCININ OS] W1 - Agente Principal Vanda`
- Nodes: `58`
- Connections: `45`
- Regra de conducao pos-abertura presente.
- Sem texto `cancelarOS`.
- Sem texto `Cancelamento automatico`.

## Monitoramento Operacional

Monitoramento operacional iniciado em 2026-05-03T02:03:48.518Z.

Ultimas execucoes W1 PROD consultadas:

- `20838`: success
- `20837`: success
- `20836`: success
- `20835`: success
- `20834`: success
- `20833`: success
- `20832`: success
- `20831`: success
- `20830`: success
- `20829`: success

Proximo passo operacional:

- Monitorar operacao real por 24h.
- Corrigir somente se aparecer erro real novo.

## Pendencia Cosmetica

Registrar para depois:

- Renomear arquivos locais e pastas que ainda usam "Protek OS" para "Piccinin OS".
- Nao alterar IDs.
- Nao alterar workflows.
- Nao alterar logica.

## Observacao

Nao houve alteracao de logica nesta etapa. Apenas o W1 PROD remoto atual foi exportado e salvo como copia local canonica.

Fechamento aprovado.

## Correcao Critica - Proximo Passo Deterministico

Data: 2026-05-02 / 2026-05-03 UTC

Objetivo:

- Melhorar a conducao da OS ativa ate o fechamento.
- Eliminar repeticao de perguntas ja respondidas.
- Usar Supabase como fonte de verdade antes da Vanda responder.

Workflows atualizados:

- W1 DEV: `4wGT1LXHyw7vdHbS`
- W1 PROD: `p7VK6uoHHHVMOa2U`

Nos alterados:

- `BuscarTecnico`
- `Calcular Próximo Passo OS`
- `Vanda/systemMessage`
- Conexoes antes da `Vanda`

Campos adicionados ao `OS_ATIVA_JSON`:

- `id`
- `os_codigo`
- `os_id_bomsaldo`
- `cliente_nome`
- `cliente_codigo`
- `cliente_endereco`
- `tecnico_id`
- `tecnico_nome`
- `tecnico_whatsapp`
- `status_os`
- `fase_ia`
- `defeito`
- `causa`
- `solucao`
- `equipamento`
- `marca`
- `modelo`
- `relatorio_tecnico`
- `observacoes_orientacao`
- `hora_entrada`
- `hora_saida`
- `em_garantia`
- `tipo_pagamento`
- `valor_total`
- `produtos_json`
- `servicos_json`
- `qtd_evidencias`
- `link_pasta_drive`
- `atualizado_em`
- `criado_em`

Ordenacao:

- `atualizado_em.desc,criado_em.desc`

Logica do node `Calcular Próximo Passo OS`:

- Le a OS ativa completa do `BuscarTecnico`.
- Calcula `campos_preenchidos`.
- Calcula `campos_pendentes`.
- Calcula `proximo_passo`.
- Calcula `instrucao_vanda`.
- Quando a mensagem atual responde ao campo pendente, calcula `campo_sugerido`, `valor_sugerido` e `acao_sugerida`.
- Se nao houver defeito: `pedir_defeito`.
- Se houver defeito e nao houver chegada: `pedir_chegada`.
- Se houver chegada e nao houver causa: `pedir_causa`.
- Se houver causa e nao houver solucao: `pedir_solucao`.
- Se houver solucao e produtos nao tratados: `perguntar_produtos`.
- Se garantia/cobranca nao estiver tratada: `perguntar_garantia_ou_cobranca`.
- Se cobrado e pagamento estiver vazio: `pedir_pagamento`.
- Se saida estiver vazia: `pedir_saida`.
- Se dados minimos estiverem presentes: `pronto_para_fechar`.

Regras reforcadas no systemMessage:

- Obedecer `proximo_passo` e `instrucao_vanda`.
- Nao perguntar chegada se `hora_entrada` ja existe.
- Nao perguntar defeito se `defeito` ja existe.
- Nao salvar sempre como defeito; quando `defeito` ja existe e `causa` esta vazia, salvar frase tecnica como `causa`.
- Nao chamar tool para repetir campo ja preenchido; avancar para o proximo campo pendente.
- Se o tecnico reclamar de repeticao, pedir desculpas de forma curta e avancar.

Testes DEV executados:

- `20940`: setup abertura.
- `20941`: busca/lista de cliente Mercurio.
- `20943`: escolha da opcao e criacao da OS `1726`.
- `20945`: consulta "Qual OS tenho aberta?" com OS_ATIVA_JSON completo.
- `20946`: "Continua" assumindo OS ativa.
- `20947`: defeito salvo via `salvarContexto`.
- `20949`: chegada `22:00` registrada via `atualizarOS`.
- `20951`: "Cremalheira quebrada" salva como `causa` via `salvarContexto`.
- `20953`: reclamacao de repeticao respondida sem perguntar chegada de novo.
- `20954`: "Preencher a OS" conduzindo para o proximo campo pendente.
- `20957`: solucao conduzindo para material/produto.

Retestes pontuais:

- `20931`: causa salva via `salvarContexto`.
- `20933`: contexto lido com `hora_entrada=22:00` e `causa` preenchida.
- `20936`: sem material/produto salvo e conduzido para garantia/cobranca.
- `20938`: repeticao de solucao nao travou conducao e avancou para garantia/cobranca.

Backups:

- DEV: `backup_4wGT1LXHyw7vdHbS_pre_proximo_passo_2026-05-03T02-36-11-160Z.json`
- PROD: `backup_p7VK6uoHHHVMOa2U_pre_proximo_passo_2026-05-03T02-36-17-984Z.json`

Resultado:

- W1 DEV atualizado e testado.
- W1 PROD atualizado e verificado remoto.
- `BuscarTecnico` agora busca contexto completo no Supabase.
- `Calcular Próximo Passo OS` ativo antes da Vanda.
- `salvarContexto` funcionando para defeito e causa tecnica.
- `atualizarOS` funcionando para chegada.
- Nenhum node de cancelamento reativado.

Erro bloqueante:

- Nenhum erro bloqueante remanescente nos cenarios principais testados.
