# Mapa de Arquitetura: Protek OS (Piccinin Security)

Este projeto consiste de **Oito sub-workflows** core no N8N. Para otimização de leitura, abaixo está a topologia exata e o número de nós para compreender rapidamente a estrutura, sem precisar analisar quase 15 mil linhas de código JSON bruto.

## N8N Workflow Topology

| Workflow | Responsabilidade | Descrição Breve (Tool Description) |
| --- | --- | --- |
| **W1 - Agente Principal** | Orquestração & Prompt | O webhook principal. Recebe áudio/imagem/texto, decodifica a intenção via IA (Vanda) e roteia para as ferramentas W2-W8. Contém Memória Redis (ID: `98R4aY8TyXokRqi4`). |
| **W2 - Buscar Cliente** | Leitura ERP | Recebe nome, fantasia ou CNPJ e usa `/api/clientes/` do Bom Saldo para buscar `id`. |
| **W3 - Buscar OS** | Leitura ERP | Busca `id` interno filtrando por Código visual. |
| **W4 - Criar OS** | Escrita ERP | Recebe IDs de cliente e despacha payload JSON contendo a marca e problema. Transfere status para "Aberta". |
| **W5 - Buscar Prod/Serv.** | Leitura ERP | Procura peças, cabos (e.g., código, vendas, R$). |
| **W6 - Atualizar OS** | Matemática / Escrita | Processa a matemática das peças `(qnt * R$)` somada aos serviços em array manual `pagamentos` para satisfazer as regras restritas da API. Prioriza o modo de `tipo_pagamento`. |
| **W7 - Evidências Drive**| Arquivos Google Workspace | Ferramenta que carrega fotos enviadas pelo técnico para a Google API (Upload Drive). |

> [!CAUTION]
> Ao solicitar alterações lógicas ao Agente, não procure o arquivo master W1 inteiro para compreender a "Atualização da OS". O W1 apenas direciona o `webhook` para as sub-funções (ex: O payload montado fica dentro de `patch_w6.js` e do arquivo próprio `W6 - Tool...`).
