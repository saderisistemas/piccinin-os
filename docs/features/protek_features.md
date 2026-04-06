# Protek | Características e Fluxo do Agente de IA

## 7. Base conversacional obrigatória
O projeto deverá reutilizar o workflow-base da secretaria como padrão de entrada. Adotará entrada via Chatwoot, aceitação de texto, áudio e imagem, transcrição de áudio, bufferização de mensagens curtas, e memória de conversa por remetente.

## 9. Capacidade multimodal
- **Texto**: entrada direta e correções.
- **Áudio**: formato preferencial para o campo com transcrição automática.
- **Imagem**: enriquecimento da análise de defeitos. Serão salvas no Drive.

## 10. Fluxo macro do produto
1. Técnico inicia atendimento integrado ao Chatwoot.
2. Workflow-base recebe mensagens e a IA unifica contexto.
3. IA identifica/abre OS.
4. IA conduz coleta de execução.
5. n8n consulta API para materiais/serviços e vincula evidências no Drive.
6. Atualização final da OS no Bom Saldo com relatório enriquecido.

## 11. Modelo de coleta conversacional
A coleta mínima abre a OS (nome cliente, técnico, data/hora etc).
A coleta de execução pergunta o defeito, solução, equipamentos verificados, produtos/materiais, tempo total.

## 12. Lógica de materiais, produtos e serviços
- **Produtos**: Itens tangíveis usados no conserto (bateria, fonte, câmera).
- **Serviços**: Mão de obra (visita técnica, manutenção, instalação).
- **Equipamentos**: Objeto alvo do serviço da OS (ex: central alarme).

A IA deve encontrar o ID correto de cada material ou serviço listando-os previamente do Bom Saldo ou usando base de alias no Supabase via matching se a correspondência não for exata. Não fabricar dados.

## 16. Requisitos funcionais (RF) Principais
O agente deve unificar atendimento multimodal, buscar informações precisas para preencher formulários de serviços via API, registrar logs auxiliares e prover o link correto das imagens no Drive para fechamento da OS no sistema legado.

## 17. Requisitos não funcionais (RNF) Principais
Suportar falhas de rede (conversa em campo), limites de API (Bom Saldo), oferecer revisão humana e reduzir chamadas excessivas por meio de buffer e context unification pela IA no backend.
