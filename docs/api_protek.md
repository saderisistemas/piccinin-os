# Protek | Integração da API Bom Saldo

## 13. Abertura e atualização de OS no Bom Saldo

### 13.1 Possibilidades confirmadas pela documentação
A API do Bom Saldo possui endpoints compatíveis com o projeto para:
- listar clientes;
- listar produtos;
- listar serviços;
- listar situações de OS;
- listar e operar ordens de serviço;
- cadastrar e editar ordens de serviço;
- consultar atributos extras de OS.

### 13.2 Estratégia recomendada

#### Etapa A — Abertura rápida
Abrir a OS (POST) com o mínimo necessário para criar a trilha e número oficial via chat.

#### Etapa B — Enriquecimento posterior
Atualizar a mesma OS (PUT) com:
- descrição técnica valorizada processada pela IA;
- equipamento atendido;
- materiais/produtos e serviços usados mapeados nos arrays correspondentes da API (`produtos`, `servicos`);
- observações internas;
- links de evidências hospedados no Drive;
- dados complementares e laudo.

### 13.3 Alerta de validação obrigatória
A documentação do Bom Saldo apresenta certas inconsistências estruturais na parte de obrigatoriedade de campos no POST e PUT. É imprescindível realizar testes empíricos de chamadas da API usando chaves locais/sandbox para validar campos required vs nullable.
