# RDP — Refatoração Geral do Projeto Protek / Piccinin Security OS

## 1. Visão geral

Este projeto tem como objetivo refatorar e estabilizar a agente operacional **Vanda**, integrada ao **Chatwoot/WhatsApp**, **n8n**, **Supabase**, **Google Drive** e **Bom Saldo API**, para apoiar técnicos de campo na abertura, acompanhamento, registro e fechamento de Ordens de Serviço.

A versão atual já possui uma base funcional, porém apresenta muitos erros de API, fluxo conversacional confuso, perda de contexto e incertezas sobre quais campos o Bom Saldo realmente aceita via API.

Portanto, esta etapa não deve ser tratada como correção pontual, mas como uma **refatoração técnica controlada**, com auditoria de API, revisão dos workflows e validação prática dos payloads.

---

## 2. Objetivo da refatoração

Refatorar o projeto para que a agente **Vanda** consiga, de forma confiável:

- identificar o técnico pelo WhatsApp;
- continuar uma OS ativa vinculada ao técnico;
- localizar cliente corretamente;
- criar OS no Bom Saldo;
- buscar OS existente;
- registrar técnico responsável;
- registrar conversa/ID do Chatwoot;
- registrar horário de entrada e saída;
- salvar evidências/fotos;
- tentar incluir foto diretamente na OS, se a API permitir;
- manter Drive como fallback seguro para evidências;
- buscar produtos e serviços corretamente;
- lançar produtos e serviços na OS com os campos corretos;
- gerar fechamento técnico profissional;
- fechar ou cancelar OS;
- persistir todo o estado crítico no Supabase;
- reduzir dependência da memória conversacional da IA.

---

## 3. Problema atual

O projeto apresenta falhas em quatro áreas principais.

### 3.1 Contrato de API não homologado

Algumas chamadas para o Bom Saldo parecem estar sendo feitas com base em suposição, não com base em teste real.

É necessário validar:

- quais campos a API aceita no POST de criação da OS;
- quais campos a API aceita no PUT de atualização da OS;
- se é possível inserir técnico responsável;
- se é possível inserir horário de entrada e saída em campo próprio;
- se é possível anexar foto diretamente na OS;
- se produto deve ser vinculado por `id`, `codigo`, `codigo_interno`, `produto_id` ou `variacao_id`;
- se serviço deve ser vinculado por `id`, `servico_id` ou outro campo;
- se atributos extras de OS são aceitos e como devem ser enviados.

### 3.2 Estado operacional inconsistente

O Supabase deveria ser a fonte confiável da OS, mas atualmente há risco de a Vanda depender demais da memória do chat.

A IA não deve “lembrar” dados críticos por contexto conversacional. Dados críticos devem ser salvos e recuperados do Supabase.

### 3.3 Conversa confusa

O prompt da Vanda está grande, com regras repetidas e algumas instruções conflitantes. Isso aumenta erro, principalmente usando modelo mini.

A conversa precisa ser objetiva, operacional e guiada por estado.

### 3.4 Workflows com responsabilidades misturadas

Alguns workflows fazem validação, persistência, normalização e chamada de API ao mesmo tempo.

A refatoração precisa separar melhor:

- entrada;
- contexto;
- validação;
- busca;
- persistência;
- execução da API;
- resposta ao técnico;
- auditoria.

---

## 4. Documentação e ferramentas obrigatórias

A refatoração deve usar como base:

- documentação oficial da API Bom Saldo:  
  `https://bomsaldo.com/integracao_api/documentacao`

- arquivos/documentos locais da API existentes no projeto, incluindo:
  - `clickapp.apib`, se disponível;
  - documentação já importada no Antigravity;
  - exemplos reais de payloads retornados pela API.

- workflows n8n existentes:
  - W1 — Piccinin Security OS — Agente Principal;
  - W2 — Buscar Cliente Bom Saldo;
  - W3 — Buscar OS Bom Saldo;
  - W3b — Criar OS Bom Saldo;
  - W4 — Buscar Produtos Bom Saldo;
  - W5 — Buscar Serviços Bom Saldo;
  - W6 — Atualizar OS Bom Saldo;
  - W7 — Salvar Evidências Drive;
  - W8 — Salvar Contexto OS;
  - W9 — Buscar Contexto OS;
  - W10 — Cancelar OS.

Ferramentas que devem ser usadas:

- Codex dentro do Antigravity;
- MCP/NCP Server do n8n para ler e validar workflows;
- MCP Server do Supabase para revisar banco, tabelas e campos;
- navegador/browser do Antigravity, se for necessário validar comportamento da interface;
- Skills de n8n do projeto antes de alterar nós, expressões, triggers e sub-workflows.

---

## 5. Princípios da refatoração

### 5.1 Não quebrar o que já funciona

Antes de qualquer alteração:

- fazer backup/export dos workflows atuais;
- documentar a versão atual;
- aplicar mudanças por etapas;
- testar workflow por workflow;
- publicar somente depois de validação.

### 5.2 API primeiro, IA depois

A ordem correta é:

1. validar a API;
2. validar payloads reais;
3. corrigir workflows;
4. ajustar Supabase;
5. simplificar prompt da Vanda;
6. testar conversa ponta a ponta.

A IA não deve compensar falha de contrato da API.

### 5.3 Supabase como fonte de verdade

O Supabase deve guardar todo o estado operacional da OS.

A memória da conversa pode ajudar no diálogo, mas não pode ser a fonte principal para:

- cliente;
- OS;
- técnico;
- horário;
- produto;
- serviço;
- evidência;
- status;
- pagamento;
- fechamento.

### 5.4 Modelo mini com regras explícitas

Como o projeto deve funcionar com modelo mini, a lógica crítica deve estar nos workflows e no banco, não no raciocínio livre da IA.

---

## 6. Arquitetura alvo

```text
Chatwoot / WhatsApp
        ↓
W1 — Agente Principal Vanda
        ↓
Identificação do técnico + OS ativa
        ↓
Supabase — Estado confiável da OS
        ↓
Tools n8n especializadas
        ↓
Bom Saldo API
        ↓
Drive / Evidências
        ↓
Supabase / Auditoria / Logs
        ↓
Resposta curta ao técnico
```

---

## 7. Escopo da refatoração

## 7.1 W1 — Agente Principal Vanda

Refatorar o W1 para deixar a agente mais simples, objetiva e confiável.

A Vanda deve:

- receber mensagem de texto, áudio ou imagem;
- identificar técnico pelo WhatsApp;
- consultar se existe OS ativa para o técnico;
- continuar de onde parou, se existir OS ativa;
- perguntar apenas o necessário;
- chamar tools especializadas;
- salvar contexto imediatamente após cada informação importante;
- responder de forma curta e operacional;
- não inventar IDs;
- não inventar produto;
- não inventar serviço;
- não inventar cliente;
- não assumir que uma foto foi anexada à OS sem confirmação do workflow.

Remover do prompt:

- regras duplicadas;
- instruções contraditórias;
- excesso de texto;
- dependência de histórico conversacional para `option_map`;
- obrigações que deveriam estar no workflow.

A Vanda deve funcionar por estado:

```text
identificacao
→ cliente_confirmado
→ os_criada_ou_localizada
→ coleta_tecnica
→ evidencias
→ produtos_servicos
→ encerramento
→ fechada
→ cancelada
```

---

## 7.2 W2 — Buscar Cliente Bom Saldo

Revisar busca de cliente para evitar abertura de OS no cliente errado.

Melhorias necessárias:

- normalizar nome informado;
- buscar por nome completo;
- buscar por token principal;
- buscar por partes relevantes;
- considerar razão social, nome fantasia e nome;
- retornar lista ranqueada;
- nunca escolher automaticamente cliente com baixa confiança;
- retornar `cliente_id`, `cliente_nome`, endereço e score;
- se houver múltiplos resultados, exigir confirmação;
- salvar no Supabase somente após confirmação segura.

Critério essencial:

> A Vanda nunca pode abrir OS em cliente diferente por aproximação fraca.

---

## 7.3 W3 — Buscar OS Bom Saldo

Revisar busca de OS para aceitar:

- código da OS;
- ID interno da OS;
- `cliente_id`;
- técnico, se aplicável;
- status/situação.

Retorno esperado:

- `os_codigo`;
- `os_id_bomsaldo`;
- `cliente_id`;
- `cliente_nome`;
- `situacao_id`;
- `situacao_nome`;
- data;
- observações;
- técnico, se vier da API;
- produtos já existentes;
- serviços já existentes;
- equipamentos já existentes.

---

## 7.4 W3b — Criar OS Bom Saldo

Revisar criação de OS.

Validar na API se o POST aceita:

- `cliente_id`;
- `situacao_id`;
- `data`;
- `observacoes`;
- `observacoes_interna`;
- `tecnico_id`;
- `nome_tecnico`;
- `usuario_id`;
- `vendedor_id`;
- link da conversa;
- atributos extras;
- equipamentos iniciais;
- produtos iniciais;
- serviços iniciais.

A criação da OS deve salvar no Supabase:

- `os_codigo`;
- `os_id_bomsaldo`;
- `numero_os`;
- `cliente_codigo`;
- `cliente_nome`;
- `cliente_endereco`;
- `tecnico_id`;
- `tecnico_nome`;
- `tecnico_whatsapp`;
- `conversa_id`;
- `link_conversa_chatwoot`;
- `status_os`;
- `fase_ia`;
- `criado_em`;
- `atualizado_em`.

Regra:

> Se `cliente_id` já veio validado do W2, o W3b não deve fazer nova busca insegura por nome.

---

## 7.5 W4 — Buscar Produtos Bom Saldo

Revisar busca de produtos.

A busca deve retornar obrigatoriamente:

- `produto_id`;
- `id`;
- `codigo`;
- `codigo_interno`;
- `nome`;
- `valor_venda`;
- `variacao_id`, se existir;
- estoque, se a API retornar;
- status ativo/inativo;
- score de confiança;
- `option_map`.

Ponto crítico:

Testar na API do Bom Saldo qual campo deve ser usado para vincular produto na OS:

- `id`;
- `produto_id`;
- `codigo`;
- `codigo_interno`;
- `variacao_id`;
- combinação de campos.

Não assumir. Testar com payload real.

---

## 7.6 W5 — Buscar Serviços Bom Saldo

Revisar busca de serviços.

A busca deve retornar:

- `servico_id`;
- `id`;
- `codigo`, se existir;
- `nome`;
- `valor_venda`;
- score de confiança;
- `option_map`.

Testar no PUT da OS se a API exige:

- `id`;
- `servico_id`;
- outro campo.

---

## 7.7 W6 — Atualizar / Fechar OS Bom Saldo

Este é o workflow mais crítico.

Ele deve ser tratado como o contrato oficial de fechamento.

Antes do PUT:

- buscar OS atual no Bom Saldo;
- buscar contexto no Supabase;
- consolidar dados;
- preservar produtos existentes;
- preservar serviços existentes;
- preservar equipamentos existentes;
- adicionar apenas novos dados confirmados;
- validar IDs obrigatórios;
- montar payload final.

O W6 deve conseguir atualizar:

- situação da OS;
- observações;
- observações internas;
- equipamento;
- marca;
- modelo;
- defeito;
- causa;
- solução;
- laudo;
- produtos;
- serviços;
- técnico responsável, se API aceitar;
- horário de entrada, se API aceitar;
- horário de saída, se API aceitar;
- tempo total, se API aceitar;
- link da pasta Drive;
- link da conversa Chatwoot;
- atributos extras de OS;
- garantia;
- pagamento;
- valor total.

Se a API não aceitar horário em campo próprio, registrar em:

```text
[CHEGADA: HH:MM]
[SAÍDA: HH:MM]
[TEMPO: X min]
```

dentro de `observacoes_interna`.

Se a API não aceitar foto/anexo direto, registrar o link do Drive em `observacoes_interna` ou atributo extra validado.

---

## 7.8 W7 — Salvar Evidências Drive

Revisar o fluxo de evidências.

Objetivos:

- receber URL da imagem;
- baixar imagem;
- criar ou localizar pasta da OS;
- evitar duplicidade de pasta;
- salvar arquivo;
- retornar link do arquivo e link da pasta;
- salvar `folder_id_drive`;
- salvar `link_pasta_drive`;
- incrementar `qtd_evidencias`;
- registrar em tabela auxiliar, se necessário.

Tabela recomendada:

```sql
ordens_servico_evidencias
```

Campos sugeridos:

```text
id
os_codigo
os_id_bomsaldo
cliente_nome
tecnico_id
tecnico_nome
conversa_id
tipo_arquivo
url_origem
drive_file_id
drive_folder_id
link_arquivo
link_pasta
descricao
criado_em
```

Também validar se a API Bom Saldo possui endpoint para anexo direto.

Se possuir, criar fluxo separado:

```text
W7b — Anexar Evidência Bom Saldo
```

Se não possuir, manter Drive como padrão oficial.

---

## 7.9 W8 — Salvar Contexto OS

Revisar W8 para ser a ferramenta central de persistência.

O W8 deve aceitar e salvar:

- dados básicos da OS;
- dados do técnico;
- dados do cliente;
- dados do equipamento;
- defeito;
- causa;
- solução;
- relatório;
- `produtos_json`;
- `servicos_json`;
- horários;
- evidências;
- pagamento;
- garantia;
- status;
- fase;
- cancelamento.

Corrigir qualquer divergência entre:

- inputs do trigger;
- campos tratados no código;
- campos existentes na tabela;
- campos enviados pelo W1;
- campos usados pelo W6.

O W8 deve fazer merge seguro:

- não apagar campo existente com vazio;
- sobrescrever apenas quando vier dado novo válido;
- normalizar horários;
- validar JSON;
- registrar `atualizado_em`.

---

## 7.10 W9 — Buscar Contexto OS

Revisar W9 para ser a fonte de recuperação da OS.

Deve permitir busca por:

- `os_codigo`;
- `os_id_bomsaldo`;
- `tecnico_id`;
- `conversa_id`.

Quando buscar por técnico, retornar apenas OS com status:

```text
aberta
em_andamento
coleta_tecnica
encerramento
```

Retorno esperado:

- contexto completo;
- `produtos_json` parseado;
- `servicos_json` parseado;
- evidências;
- pendências;
- se está pronto para fechar;
- quais dados ainda faltam.

---

## 7.11 W10 — Cancelar OS

Revisar cancelamento.

Validar se a API cancela por:

- `situacao_id`;
- endpoint específico;
- PUT da OS.

O cancelamento deve:

- buscar OS atual;
- validar se ainda pode cancelar;
- registrar motivo;
- atualizar Bom Saldo;
- atualizar Supabase;
- preservar trilha de auditoria.

Campos obrigatórios:

- `os_id_bomsaldo`;
- `os_codigo`;
- `motivo_cancelamento`;
- `tecnico_id`;
- `tecnico_nome`;
- data/hora do cancelamento.

---

## 8. Estrutura recomendada da tabela Supabase

Revisar/criar tabela `ordens_servico` com os campos abaixo:

```sql
create table if not exists ordens_servico (
  id uuid primary key default gen_random_uuid(),

  os_codigo text,
  numero_os text,
  os_id_bomsaldo text,

  conversa_id text,
  link_conversa_chatwoot text,

  tecnico_nome text,
  tecnico_whatsapp text,
  tecnico_id text,

  cliente_nome text,
  cliente_codigo text,
  cliente_endereco text,

  equipamento text,
  equipamento_codigo text,
  marca text,
  modelo text,

  defeito text,
  causa text,
  solucao text,
  relatorio_tecnico text,

  tipo_servico text,
  servico_nome text,
  servico_codigo text,

  produtos_json jsonb default '[]'::jsonb,
  servicos_json jsonb default '[]'::jsonb,

  observacoes_orientacao text,

  em_garantia boolean default false,
  tipo_pagamento text,
  forma_pagamento_id text,
  valor_total numeric default 0,

  hora_entrada text,
  hora_saida text,
  tempo_atendimento_min integer,
  checkout_registrado boolean default false,

  link_pasta_drive text,
  folder_id_drive text,
  qtd_evidencias integer default 0,

  status_os text default 'aberta',
  fase_ia text default 'identificacao',

  motivo_cancelamento text,

  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  fechado_em timestamptz
);
```

Criar índices recomendados:

```sql
create index if not exists idx_ordens_servico_os_codigo
on ordens_servico (os_codigo);

create index if not exists idx_ordens_servico_os_id_bomsaldo
on ordens_servico (os_id_bomsaldo);

create index if not exists idx_ordens_servico_tecnico_status
on ordens_servico (tecnico_id, status_os);

create index if not exists idx_ordens_servico_conversa_id
on ordens_servico (conversa_id);
```

---

## 9. Tabela auxiliar de evidências

Criar tabela, se ainda não existir:

```sql
create table if not exists ordens_servico_evidencias (
  id uuid primary key default gen_random_uuid(),

  os_codigo text,
  os_id_bomsaldo text,

  cliente_nome text,

  tecnico_id text,
  tecnico_nome text,

  conversa_id text,

  tipo_arquivo text,
  url_origem text,

  drive_file_id text,
  drive_folder_id text,

  link_arquivo text,
  link_pasta text,

  descricao text,

  criado_em timestamptz default now()
);
```

Índices recomendados:

```sql
create index if not exists idx_evidencias_os_codigo
on ordens_servico_evidencias (os_codigo);

create index if not exists idx_evidencias_os_id_bomsaldo
on ordens_servico_evidencias (os_id_bomsaldo);
```

---

## 10. Segurança

Auditar todos os workflows em busca de:

- API keys hardcoded;
- `access-token` hardcoded;
- `secret-access-token` hardcoded;
- tokens Evolution;
- credenciais Google;
- endpoints sensíveis;
- segredos expostos em nós HTTP.

Correções obrigatórias:

- mover credenciais para credenciais nativas do n8n;
- usar variáveis de ambiente quando aplicável;
- remover tokens dos JSONs;
- listar chaves que precisam ser rotacionadas;
- não publicar workflows com segredos embutidos.

---

## 11. Matriz de homologação da API

Criar matriz com os seguintes testes.

| Teste | Endpoint | Método | Objetivo | Resultado esperado | Status |
|---|---|---:|---|---|---|
| Buscar cliente exato | `/clientes` | GET | Validar cliente por nome exato | Retorna cliente correto | Pendente |
| Buscar cliente parcial | `/clientes` | GET | Validar busca tolerante | Retorna lista ranqueada | Pendente |
| Criar OS | `/ordens_servicos` | POST | Criar OS mínima | Retorna `id` e `codigo` | Pendente |
| Criar OS com técnico | `/ordens_servicos` | POST | Testar campo técnico | Técnico vinculado ou rejeição documentada | Pendente |
| Atualizar OS | `/ordens_servicos/{id}` | PUT | Atualizar observações | OS atualizada | Pendente |
| Inserir horário | `/ordens_servicos/{id}` | PUT | Testar entrada/saída | Campo aceito ou fallback definido | Pendente |
| Buscar produto | `/produtos` | GET | Localizar produto | Retorna ID/código | Pendente |
| Lançar produto | `/ordens_servicos/{id}` | PUT | Inserir produto na OS | Produto vinculado | Pendente |
| Buscar serviço | `/servicos` | GET | Localizar serviço | Retorna ID/código | Pendente |
| Lançar serviço | `/ordens_servicos/{id}` | PUT | Inserir serviço na OS | Serviço vinculado | Pendente |
| Inserir equipamento | `/ordens_servicos/{id}` | PUT | Documentar equipamento | Equipamento vinculado | Pendente |
| Anexar foto | A validar | POST/PUT | Testar evidência direta | Foto anexada ou fallback Drive | Pendente |
| Cancelar OS | `/ordens_servicos/{id}` | PUT/outro | Alterar status para cancelado | OS cancelada | Pendente |
| Fechar garantia | `/ordens_servicos/{id}` | PUT | Valor zerado | OS fechada sem cobrança | Pendente |
| Fechar cobrado | `/ordens_servicos/{id}` | PUT | Serviço/produto com valor | OS fechada com cobrança | Pendente |

---

## 12. Matriz de teste ponta a ponta

Após corrigir API, workflows e Supabase, executar testes reais:

1. Técnico envia mensagem inicial.
2. Sistema identifica técnico pelo WhatsApp.
3. Sistema consulta OS ativa.
4. Sem OS ativa, Vanda pergunta cliente.
5. Vanda busca cliente no Bom Saldo.
6. Havendo múltiplos clientes, Vanda pede confirmação.
7. Após confirmação, Vanda cria OS.
8. OS é salva no Supabase.
9. Técnico envia foto.
10. Foto é salva no Drive.
11. Evidência é registrada no Supabase.
12. Link é vinculado à OS ou observação interna.
13. Técnico informa chegada.
14. Sistema salva hora de entrada.
15. Técnico informa defeito/causa/solução.
16. Sistema salva contexto.
17. Técnico informa produto usado.
18. Sistema busca produto e pede confirmação se necessário.
19. Produto é salvo em `produtos_json`.
20. Técnico informa serviço.
21. Sistema busca serviço e confirma se necessário.
22. Serviço é salvo em `servicos_json`.
23. Técnico informa saída.
24. Sistema salva hora de saída e calcula tempo.
25. Vanda busca contexto completo.
26. Vanda gera laudo técnico.
27. W6 atualiza OS no Bom Saldo.
28. Supabase marca OS como fechada.
29. Técnico recebe confirmação curta.

---

## 13. Regras finais da Vanda

A Vanda deve seguir estas regras:

- respostas curtas;
- perguntas objetivas;
- não repetir explicações;
- não perguntar tudo de uma vez;
- salvar contexto conforme o técnico informa;
- não inventar cliente;
- não inventar OS;
- não inventar produto;
- não inventar serviço;
- quando houver dúvida, pedir confirmação curta;
- se a API falhar, informar de forma objetiva e registrar no Supabase;
- se faltar dado essencial para fechar, pedir apenas o dado faltante;
- se o técnico mandar foto, salvar como evidência;
- se o técnico disser que chegou, registrar hora de entrada;
- se o técnico disser que saiu/finalizou, registrar hora de saída;
- se o técnico pedir cancelamento, solicitar motivo e usar workflow de cancelamento;
- nunca depender apenas da memória do chat para dados críticos.

---

## 14. Critérios de aceite

A refatoração será considerada concluída quando:

- a documentação da API tiver sido auditada;
- payloads reais de POST/PUT tiverem sido testados;
- campos aceitos e recusados pela API estiverem documentados;
- W1 a W10 estiverem revisados;
- Supabase estiver alinhado com os workflows;
- não houver credenciais hardcoded nos workflows;
- cliente não for escolhido por baixa confiança;
- produtos e serviços forem lançados corretamente na OS;
- hora de entrada e saída forem registradas corretamente;
- evidências forem salvas e vinculadas;
- técnico e conversa forem registrados;
- fechamento em garantia funcionar com valor zerado;
- fechamento cobrado funcionar com valor correto;
- cancelamento funcionar;
- a Vanda conseguir continuar OS ativa por técnico;
- a conversa da Vanda estiver simples e objetiva;
- houver teste ponta a ponta concluído com sucesso.

---

## 15. Entregáveis esperados

Ao final da refatoração, entregar:

1. relatório técnico do estado atual;
2. matriz real da API Bom Saldo;
3. payloads homologados de criação, atualização, fechamento e cancelamento de OS;
4. lista de campos aceitos e recusados pela API;
5. workflows W1 a W10 corrigidos;
6. schema Supabase revisado;
7. tabela de evidências, se necessária;
8. prompt da Vanda simplificado;
9. matriz de testes executada;
10. lista de credenciais removidas/rotacionadas;
11. recomendação final de publicação.

---

## 16. Ordem recomendada de execução

Executar nesta ordem:

```text
1. Backup dos workflows atuais
2. Auditoria da documentação Bom Saldo
3. Homologação prática da API
4. Revisão do Supabase
5. Correção W8 e W9
6. Correção W2, W3 e W3b
7. Correção W4 e W5
8. Correção W7
9. Correção W6
10. Simplificação W1
11. Testes isolados
12. Teste ponta a ponta
13. Publicação controlada
```

---

## 17. Observação final

Este projeto deve ser tratado como uma refatoração de engenharia.

A prioridade não é fazer a IA “parecer mais inteligente”. A prioridade é criar uma base estável, validada e auditável para que a IA opere com segurança.

A sequência correta é:

```text
API real validada
→ Supabase como estado confiável
→ workflows corrigidos
→ prompt da Vanda simplificado
→ testes ponta a ponta
→ publicação
```
