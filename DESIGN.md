---
name: Piccinin OS Dashboard
description: Painel de controle cibernético e industrial para monitoramento em tempo real do ecossistema Vanda AI.
colors:
  primary: "#00ff88"
  primary-dim: "#00ff8814"
  neutral-bg: "#050505"
  neutral-surface: "#090c0a"
  neutral-grey: "#111814"
  text-white: "#ffffff"
  text-grey: "#a0b3a8"
  text-muted: "#4a5c53"
  border: "#00ff8826"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "3.8rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 500
    lineHeight: 1.8
rounded:
  box: "8px"
  pill: "50px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.box}"
    padding: "12px 25px"
  button-primary-hover:
    backgroundColor: "{text-white}"
    textColor: "{colors.neutral-bg}"
---

# Design System: Piccinin OS Dashboard

## 1. Overview

**Creative North Star: "O Deck de Comando Cibernético-Industrial"**

O design do painel do Piccinin OS adota uma estética sombria e refinada de alta tecnologia (Dark Mode), inspirada em plataformas de infraestrutura e engenharia líderes de mercado como Linear e Stripe. O design foca na legibilidade operacional sob condições de monitoramento contínuo. Ele rejeita ornamentos superficiais e neons estroboscópicos "gamer" infantis, optando por uma paleta restrita baseada em tons escuros e acinzentados profundos, pontuada com precisão milimétrica por uma cor de destaque verde-neon funcional.

**Key Characteristics:**
- **Fidelidade Operacional**: Alta densidade de dados estruturada em grades simétricas para leitura e tomada de decisão rápidas.
- **Micro-interações de Resposta**: Transições rápidas e efeitos de brilho controlados que se manifestam exclusivamente em resposta às interações do usuário.
- **Clareza de Contraste**: Garantia de legibilidade robusta mesmo no tema escuro profundo.

## 2. Colors

A paleta é altamente contida e focada em dar legibilidade aos dados e status das ordens de serviço.

### Primary
- **Cyber Neon Green** (#00ff88 / oklch(86.61% 0.2912 144.3)): Usado exclusivamente em indicadores de estado ativo/sucesso, botões primários e realces sutis sob hover.
- **Ghost Green** (#00ff8814): Fundo translúcido para badges e tags de status concluídos.

### Neutral
- **Absolute Darkness** (#050505): Cor de fundo principal do aplicativo (body).
- **Surface Dark** (#090c0a): Fundo de componentes principais e seções destacadas.
- **Component Grey** (#111814): Cor de fundo para itens repetitivos, linhas de tabela e inputs.
- **Text White** (#ffffff): Usado para títulos de alta relevância, métricas e valores numéricos importantes.
- **Text Grey** (#a0b3a8): Texto padrão de corpo e labels operacionais secundárias.
- **Text Muted** (#4a5c53): Para placeholders, subtextos de suporte e metadados.

### Named Rules
**The 10% Accent Rule.** O verde-neon primário (--piccinin-green) é reservado estritamente para ações críticas, estados positivos de conclusão ou sinalizadores importantes, ocupando menos de 10% da área visual da tela.
**The True Contrast Rule.** Elementos de texto de suporte nunca devem cair abaixo de 4.5:1 de contraste em relação aos planos de fundo. O cinza deve manter-se na escala recomendada para máxima legibilidade.

## 3. Typography

**Display Font:** 'Space Grotesk' (com fallback sans-serif)
**Body Font:** 'Inter' (com fallback sans-serif)

A tipografia estabelece um contraste técnico rigoroso entre os títulos em caixa alta na fonte industrial Space Grotesk e os dados legíveis em Inter.

### Hierarchy
- **Display** (800, 3.8rem, 1.05): Títulos principais do dashboard de alto impacto.
- **Headline** (700, 1.8rem, 1.2): Títulos de seções principais como históricos e modais.
- **Title** (600, 1.1rem, 1.3): Títulos de blocos menores, cards e subseções.
- **Body** (500, 0.95rem, 1.8): Texto corrido, descrições e relatórios operacionais.
- **Label** (700, 0.75rem, letter-spacing: 2px): Usado em tags, badges, headers de colunas de tabelas e botões em caixa alta.

### Named Rules
**The -0.04em Floor Rule.** O espaçamento de letras (letter-spacing) em títulos Space Grotesk ou qualquer título de exibição nunca deve ser menor que -0.04em. Títulos excessivamente espremidos que fazem as letras se tocarem são proibidos.

## 4. Elevation

O sistema baseia-se em camadas estruturais planas separadas por bordas nítidas de 1px, transmitindo rigidez industrial em vez de profundidade espacial simulada.

### Named Rules
**The Border Over Shadow Rule.** A separação de elementos visuais é feita por bordas finas com transparência (--piccinin-border) ou variações sutis na cor de fundo das superfícies. Sombras difusas são usadas apenas como resposta interativa (hover) para simular iluminação de comandos do deck.

## 5. Components

### Buttons
- **Shape:** Cantos semi-vivos com raio de 8px (--radius-box).
- **Primary:** Fundo verde-neon (--piccinin-green), texto preto absoluto, padding vertical e horizontal rigoroso (12px 25px).
- **Hover / Focus:** Transição suave de 0.3s. O fundo torna-se branco e a borda assume brilho branco correspondente, simulando ativação física.

### Cards / Containers
- **Corner Style:** 8px (--radius-box) para manter o visual firme de maquinário industrial.
- **Background:** Translúcido escuro (--glass-bg) combinado com filtro de desfoque (backdrop-filter: blur(12px)).
- **Border:** Borda fina de 1px com verde-neon diluído (--piccinin-border).
- **Hover:** Deslocamento sutil (translateY(-5px)) com iluminação da borda e ativação de brilho periférico (--glow-green-sm).

### Inputs / Fields
- **Style:** Fundo preto translúcido, borda fina, texto alinhado com ícone verde-neon.
- **Focus:** Iluminação imediata da borda para verde-neon com sombra de foco controlada.

### Navigation
- **Style:** Fixada no topo, fundo escuro denso com desfoque de 24px, borda inferior de 1px. Links em Space Grotesk com indicador ativo verde-neon que desliza sob o texto.

## 6. Do's and Don'ts

### Do:
- **Do** usar a fonte Space Grotesk para títulos estruturais e números de impacto, mantendo sempre o letter-spacing acima de -0.04em.
- **Do** priorizar bordas finas e contrastes de tons escuros para delimitar áreas, mantendo o visual limpo de painel de controle.
- **Do** garantir que botões e cards respondam de forma rápida (150-250ms) e coerente à interação do cursor.

### Don't:
- **Don't** aplicar gradientes coloridos ou de neon no texto.
- **Don't** usar arredondamento exagerado (como border-radius acima de 12px) em cards ou contêineres operacionais, violando o caráter industrial.
- **Don't** acumular sombras suaves largas combinadas com bordas de 1px no mesmo elemento (evitar a inconsistência de "ghost-cards").
- **Don't** utilizar neons de preenchimento desnecessários em elementos inativos ou estáticos, mantendo a sobriedade executiva C-Level.
