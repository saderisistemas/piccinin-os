# Protek | Diretrizes de Arquitetura e Integração

## 6. Diretriz de arquitetura recomendada

### 6.1 Decisão arquitetural principal

Seguindo a diretriz mais adequada para estabilidade, implantação e governança, a recomendação é:

#### n8n
- **Padrão preferencial:** integração por **API Key** para execução/publicação/controle determinístico.
- **Uso opcional complementar:** **MCP Server do n8n** para leitura assistida, inspeção, apoio ao Antigravity e troubleshooting, caso necessário.

#### Supabase
- **Padrão preferencial:** uso direto por credenciais/API/nodes nativos do n8n.
- **Uso opcional complementar:** **MCP Server do Supabase** apenas se trouxer ganho real para leitura contextual, inspeção, modelagem ou manutenção dentro do Antigravity.

#### Antigravity
- Será utilizado como camada de orquestração de projeto, documentação, consulta técnica e apoio à geração/refatoração de workflows.

## 8. Canais, interfaces e componentes

### 8.1 Chatwoot
Canal oficial de entrada e saída da conversa.

### 8.2 n8n
Motor principal da automação e da integração.

### 8.3 Agente de IA
Responsável por interpretação multimodal, organização da coleta, e geração do fechamento.

### 8.4 Bom Saldo API
Sistema de destino para clientes, ordens de serviço, produtos e serviços.

### 8.5 Google Drive
Repositório de evidências: fotos, documentos, e registros do atendimento.

### 8.6 Supabase
Camada auxiliar opcional/estratégica para dicionários de alias, auditoria, e fila de revisão.

## 14. Estratégia de evidências no Drive

### 14.1 Estrutura recomendada de pastas
`/Protek/OS/{ano}/{mes}/{codigo-ou-id-os}/`

### 14.2 Registro na OS
Salvar na OS o link principal da pasta e um resumo das evidências recebidas.

## 15. Papel do Antigravity no projeto
O Antigravity será usado como ambiente de apoio estruturado ao projeto, com repositório oficial das regras de negócio, APIs ingeridas e workflows de suporte.
