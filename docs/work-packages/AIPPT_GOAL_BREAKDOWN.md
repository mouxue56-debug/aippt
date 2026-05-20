# AIPPT Goal Breakdown

Status: draft v0.1  
Date: 2026-05-19

## Goal

Build a practical AIPPT workflow:

Template-constrained AI generation -> import -> manual refinement -> single-slide HMS/Hermes AI edit -> export -> browser presentation and SNS reuse.

## Supervisor Rule

The supervisor model owns:

- Product boundary.
- PPT specification quality.
- Visual and retention standards.
- Final acceptance.
- Risk decisions.

Cheaper models own:

- Mechanical extraction.
- Template page drafting.
- UI component implementation.
- Test writing.
- Documentation expansion.

## Phase 0: Specification Foundation

Owner: supervisor model  
Support: GPT-5.4 Mini for draft expansion

Scope:

- Define HTML deck contract.
- Define editable element contract.
- Define SNS and retention rules.
- Define prompt for external AI generation.

Acceptance:

- A generation AI can read the spec and output a compliant deck.
- The future importer can rely on stable attributes.
- The user can judge whether a generated deck is good enough.

## Phase 1: Template Library

Owner: GPT-5.4 Mini  
Review: supervisor model

Scope:

- 30-40 page archetypes.
- 5 theme families.
- Default 16-page course and training sequences.
- Motion presets for each archetype.

Acceptance:

- Page archetypes are narrative roles, not only visual shapes.
- At least 4 archetypes are strong SNS candidates.
- The sample deck can be mapped into the library.

## Phase 2: Importer MVP

Owner: GPT-5.3 Codex Spark  
Review: supervisor model

Scope:

- Import single-file HTML.
- Parse `.slide` pages.
- Infer title, body text, images, tables, cards.
- Preserve original file snapshot.
- Generate slide outline and editable inventory.

Acceptance:

- The sample deck imports as 16 slides.
- Each slide appears in a slide list.
- Text blocks are editable candidates.
- Unsupported scripts are reported, not silently broken.

## Phase 3: Manual Refinement Editor MVP

Owner: GPT-5.4 Mini for UI, GPT-5.3 Codex Spark for data layer  
Review: supervisor model

Scope:

- Slide preview.
- Text editing.
- Theme color editing.
- Image replacement.
- Motion preset application.
- Export to single-file HTML.

Acceptance:

- User can change one title and export.
- User can replace one image and export.
- User can add one motion preset and preview.
- Exported HTML still presents correctly in browser.

## Phase 4: HMS/Hermes Single-Slide AI Edit

Owner: GPT-5.3 Codex Spark  
Review: supervisor model

Scope:

- Define local API adapter.
- Send selected slide fragment plus manifest context.
- Route task to Hermes/HMS.
- Merge AI response back into slide.
- Validate metadata is preserved.

Acceptance:

- AI can rewrite current slide only.
- Locked/manual-only elements survive.
- If Hermes is unavailable, the UI shows a clear fallback state.
- No full-deck rewrite happens by accident.

## Phase 5: SNS and Browser Verification

Owner: GPT-5.3 Codex Spark  
Review: supervisor model

Scope:

- Browser smoke test.
- Console error check.
- 16:9 screenshot.
- 9:16 crop preview.
- 1:1 crop preview.
- SNS candidate warnings.

Acceptance:

- Sample deck can be imported, edited, exported, opened, and screenshotted.
- At least one SNS candidate produces usable 16:9 and 9:16 previews.
- Validation failures are actionable.

## Phase 6: v1 Project Management

Owner: GPT-5.4 Mini  
Review: supervisor model

Scope:

- Deck library.
- Version history.
- Project metadata.
- Recent files.
- Template prompt export.
- Optional lesson/training preset flows.

Acceptance:

- User can maintain a small library of decks.
- User can return to older versions.
- User can start a new AI generation from a known template prompt.

