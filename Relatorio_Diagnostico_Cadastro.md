# Relatório Diagnóstico: Saneamento da Base do Bom Saldo (Fases 1 e 2)

Dentro da nossa missão de higienizar a base para tornar a operação da IA Vanda mais precisa e reduzir redundâncias nas Ordens de Serviço, executei um *download* em massa diretamente via requisições à API do Bom Saldo (ClickApp) para analisar a real situação tecnológica do sistema, evitando qualquer risco ou travamentos providos por páginas web.

Aqui estão os dados encontrados (Diagnóstico - Fase 1) e a sua Classificação (Fase 2).

---

## 👥 1. Diagnóstico de Clientes
**Situação Encontrada:**
- **Total exportado:** `6.713` clientes (quase a totalidade apontada como ativa). O volume exportado revela que há muito mais registro na base do que os "quase 400" informados. Existe um gigantesco acúmulo de dados históricos e importações de outros sistemas de gestão no Bom Saldo.
- **Duplicidades Categóricas (CPF/CNPJ):** Foram localizados **`202` grupos** (clusters) de clientes partilhando exatamente o mesmo documento fiscal formatado ou parcialmente limpo. Várias filiais cadastradas múltiplas vezes ou atualizações que criaram novos IDs na API.
- **Duplicidades de Nomes Exatos:** Foram localizados **`163` grupos** de clientes com nomes absolutamente idênticos em sistema. (Muitas vezes, clientes de Pessoa Física cadastrados apenas com o primeiro nome ou pequenos erros de digitação corrigidos criando um segundo registro).
- **Cadastros Obsoletos/Ruins:** Existem **`17` cadastros** completamente inadequados para qualquer busca de correspondência lógica pela IA.
  - *Amostra:* "APM", "ASK", "B.L", "BGL", "CCM" — e similares. A Vanda (IA) sofre severamente se tiver que lidar no algoritmo de busca de afinidade (fuzzy search) de clientes com apenas 3 letras.

**Conclusão Fase 2 para Clientes:** A maioria esmagadora das ambiguidades em clientes reside na poluição da base. A IA tem altíssima chance de selecionar o ID errado, mesmo que a OS seja corretamente deduzida de seu contexto.

---

## 🛠️ 2. Diagnóstico de Serviços
**Situação Encontrada:**
- **Ativos atuais no sistema:** `69` tipos únicos de serviço cadastrados.
- **A Principal Causa de Desorganização:** Extrema diversificação de como ações que implicam "tempo de técnico" foram categorizadas.

A base misturou **"ações"** com **"peças atreladas"**.
A IA precisa que o componente base se chame por exemplo "Manutenção" e o detalhe (Cancela, Cerca, Central) vá na aba de Observação da Ordem de Serviço, mas na base eles estão estáticos como produtos/serviços independentes.

**Amostra de Redundância Localizada (Alta Variabilidade):**
- `Mão de Obra`
- `Mão de Obra ( Manutenção da maquina)`
- `Mão de Obra - Instalação do Alarme`
- `Mão de Obra Instalação de câmeras.`
- `Mão de obra + Material`
- `Mão de obra - Instalação de cerca elétrica`
- `Manutenção`
- `Manutenção + Mão de Obra`
- `Manutenção da Cancela`
- `Manutenção da central`
- `Manutenção de CFTV`
- `Manutenção do Portão`
- `Visita Tecnica`

**Conclusão Fase 2 para Serviços:** Esta frente é de confiança "ALTA". A ação pode ser executiva e mais assertiva, já que a operação técnica demanda padrões como: `Hora Técnica`, `Visita Técnica`, e `Manutenção`. Enxugar esse leque facilitará muito a redução de "alucinações" nos relatórios do técnico.

---

## 📦 3. Diagnóstico de Produtos
**Situação Encontrada:**
- **Ativos no sistema:** `1.241` produtos exportados via API (Bem alinhado à sua expectativa de >1300 considerando os apagados/inativos históricos).
- **Principais Concentrações Ativas na Base:**
  - Cabos: Registrados ~62 vezes.
  - Centrais: Registradas ~60 vezes.
  - Câmeras: Registradas ~42 vezes.
  - Sensores: Registrados ~40 vezes.
  - Caixas: Registradas ~35 vezes.
- **Duplicidades Friezas (Nome Idêntico Textual):** Apenas `9` duplas ou trios exatos. A base de produtos está fragmentada em características textuais longas e marcas.

**Conclusão Fase 2 para Produtos:** Seguindo sua regra mestra ("Máxima cautela. Se houver qualquer chance de serem itens tecnicamente diferentes, mantenha separados"), este grupo tem classificação de confiança **"MÉDIA/BAIXA"** para automação robótica imediata em massa. Itens perigosamente vagos (ex: um produto cujo nome é apenas `bateria` ou `sensor`) não deverão ser fundidos semanticamente para não causar falta de contabilidade financeira real do fabricante/modelo na sua gestão de estoque.

---

## Proposta e Sugestões (Fase 3: Proposta de Ação)

Dado o volume extraído logicamente por *APIs*, eis a proposta metódica:

1. **SERVIÇOS (Ação Higienizadora e Consolidada Segurança: ALTA)**
   Irei criar uma rotina para manter um ou dois serviços genéricos oficiais recomendados (ex: `Visita Técnica` e `Mão de Obra Geral`) e definiremos o *INATIVAR (ativo: 0)* via API nos outros `60` serviços de variação textual, garantindo que o seu histórico não se corrompa, apenas deixem de poluir o menu suspenso ou a base de pesquisa da IA nas futuras ações do WhatsApp.
2. **CLIENTES (Ação Condicionada Segurança: ALTA em duplicatas)**
   A rotina passará pelos `163` clientes com nome perfeitamente igual (e os `202` com os mesmos CPFs), escolhendo sempre o cadastro mais atualizado (parâmetro de modificação mais recente), e efetuando o repasse e sinalização inativa (*ativo: 0*) aos mais defasados e sem vínculo de movimentação real nos últimos anos.
3. **PRODUTOS (Ação Limpa Conservadora: BAIXA em lote, ALTA apenas nos exatos)**
   Aqui só irei inativar os que forem os `9` grupos 100% idênticos, preferindo os com maior movimentação/ID, e faremos uma exclusão preventiva somente dos produtos de "Teste" explícitos (`Cadastros Ruins = 3`).

Aguardarei sua autorização para iniciar a execução de *limpeza preventiva* via API (escreverei um script NodeJS local chamado `executar_limpeza_bomsaldo.js` que fará as operações seguras sem quebrar a camada relacional) ou poderei repassar lista por lista em CSV para que você reveja cada caso na amostra técnica. Podemos seguir?
