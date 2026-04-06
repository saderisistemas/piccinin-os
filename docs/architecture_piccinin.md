# Piccinin Security | Diretrizes de Arquitetura e Integração

## 6. Diretriz de arquitetura recomendada

### 6.1 Decisão arquitetural principal

#### n8n
- **Padrão preferencial:** integração por **API Key** para execução/publicação/controle determinístico.
- **Uso opcional complementar:** **MCP Server do n8n** para leitura assistida, inspeção, apoio ao Antigravity.

#### Supabase
- **Padrão preferencial:** uso direto por credenciais/API/nodes nativos do n8n.
- **Uso opcional complementar:** **MCP Server do Supabase**.

#### Antigravity
- Será utilizado como camada de orquestração de projeto, documentação, consulta técnica e apoio à geração/refatoração de workflows.

## 8. Canais, interfaces e componentes

### 8.1 Chatwoot
Canal oficial de entrada e saída da conversa.

### 8.2 n8n
Motor principal da automação e da integração.

### 8.3 Agente de IA — Vanda
Responsável por: condução da conversa, interpretação multimodal, normalização de dados, aplicação das regras de negócio (garantia, sem cobrança, fotos).

### 8.4 Bom Saldo API
Sistema de destino para ordens de serviço, produtos e serviços (com valor zero quando aplicável).

### 8.5 Google Drive
Repositório de evidências: fotos do atendimento (quando enviadas).

### 8.6 Supabase
Camada auxiliar opcional/estratégica para dicionários de alias, logs estruturados.

## 14. Estratégia de evidências no Drive
Salvar evidências no Drive quando enviadas pelo técnico. Não é obrigatório para fechamento da OS.
Estrutura recomendada de pastas: `/Piccinin Security/OS/{ano}/{mes}/{codigo-ou-id-os}/`

## 15. Papel do Antigravity no projeto
Usado como ambiente de apoio estruturado ao projeto, com registro oficial do PRD, ingestão da API do Bom Saldo, e apoio computacional.
