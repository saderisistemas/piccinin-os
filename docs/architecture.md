# Protek OS - Architecture Overview

## Mục đích e Decisões Técnicas
Entregar um MVP operacional funcional que permita interação com o técnico de campo via Chatwoot (texto, áudio, imagens) integrado ao n8n e ao Bom Saldo.

### Stack:
- **n8n**: Orquestrador principal. Operação direta por API Key. MCP do n8n usado como apoio.
- **Supabase**: Uso auxiliar (opcional persistência de logs/estado).
- **Google Drive**: Padrão oficial de armazenamento para evidências.
- **Bom Saldo API**: Backend de registro financeiro / ERP, ondef a Vanda registra as OSs e atualiza o laudo e materiais utilizados.
- **Chatwoot**: Interface conversacional para os técnicos de campo da Piccinin Security.

## Componentes Chaves

### 1. Workflow-base / Recebimento Modal
O workflow recebe, distingue entre tipologias (Texto, Áudio e Imagem), transcreve o que for áudio e consolida o contexto da interação.

### 2. Agente Conversacional (Vanda AI)
Conduz o atendimento via perguntas enxutas:
- Identifica cliente, técnico e OS (ou abre nova);
- Coleta motivo, execução, defeito, solução, produtos usados e serviços.
- Sem atrito no envio de fotos.
- Avalia tempo e garantia.

### 3. Integração Bom Saldo
Faz GET nos catálogos de `produtos` e `servicos`. Atualiza as OS de forma limpa, fazendo de/para de identificadores e lógicas de negócios operacionais.
