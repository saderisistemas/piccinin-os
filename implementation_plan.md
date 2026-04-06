# Token Optimization Implementation Plan

## Overview
This plan outlines the specific steps required to optimize the token context usage of the project. We identified monolithic documentation files and a few large JavaScript files that exceed the recommended maximum of 300 lines per file.

By executing this plan, we expect to significantly reduce the context window (tokens) required for AI interactions, leading to faster responses and cheaper sessions.

## File Refactoring Plan

### 1. `PRD_Protek_BomSaldo_Antigravity_v2.md` (Doc Monolith)
- **Current Size**: 501 lines
- **Action**: Split into an index and topic-based documentation inside the `docs/` folder.
- **Estimated Target Sizes**:
  - `PRD_Protek_BomSaldo_Antigravity_v2.md`: ~50 lines (Index/Overview only)
  - `docs/architecture_protek.md`: ~150 lines (Architecture & Infrastructure)
  - `docs/features/protek_features.md`: ~200 lines (Feature Rules)
  - `docs/api_protek.md`: ~100 lines (API references & payloads)

### 2. `PRD_Piccinin_Security_BomSaldo_v3.md` (Doc Monolith)
- **Current Size**: 483 lines
- **Action**: Split into an index and topic-based documentation inside the `docs/` folder.
- **Estimated Target Sizes**:
  - `PRD_Piccinin_Security_BomSaldo_v3.md`: ~50 lines (Index/Overview only)
  - `docs/architecture_piccinin.md`: ~150 lines (Architecture & Infrastructure)
  - `docs/features/piccinin_features.md`: ~200 lines (Feature Rules)
  - `docs/api_piccinin.md`: ~80 lines (API references & payloads)

### 3. `patch_v3_piccinin.js` (Code Monolith)
- **Current Size**: 346 lines
- **Action**: Refactor into modular scripts based on the separation of concerns.
- **Estimated Target Sizes**:
  - `patch_v3_piccinin.js`: ~100 lines (Main execution/orchestrator)
  - `lib/api_helpers.js`: ~100 lines (API calls and data fetching)
  - `lib/data_transformers.js`: ~146 lines (Data manipulation, transformation)

## Knowledge Items (KIs) Generation
- Create a KI for the `BomSaldo API Usage` (aggregating rules from `fix_cliente_id_completo.js` and `upload_w6_fix_servicos.js`), as this is a complex integration queried frequently but structurally stable.

## Execution Rules
- Always maintain links from PRD index files to their new `docs/*` counterparts to prevent loss of context.
- Keep UI concerns, state management, and shared types separated in code logic when refactoring further.
