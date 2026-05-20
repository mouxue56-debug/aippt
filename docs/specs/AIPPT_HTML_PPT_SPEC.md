# AIPPT HTML PPT Specification

Status: draft v0.1  
Date: 2026-05-19  
Reference sample: `/Users/willma/Downloads/deepseek_html_20260519_8c8811.html`

## 1. Purpose

AIPPT decks are premium HTML presentations for public courses, training, content filming, and product-style demonstrations. They should show AI capability through structure, visual confidence, controlled motion, and clear narrative pacing.

The format must satisfy two opposite needs:

- Let AI generate a full deck quickly.
- Let the user refine one page, one text block, one image, or one motion layer without regenerating the entire deck.

This specification defines the deck contract that generation AIs, the refinement editor, and HMS/Hermes single-slide agents must follow.

## 2. Product Standard

An AIPPT deck is not a plain office PPT exported to HTML. It should feel like a live teaching and filming surface:

- One page has one message.
- One page has one dominant visual focus.
- The reading path is intentional and visible.
- Motion reveals hierarchy and timing.
- Every 3-5 pages creates a clip-worthy moment for SNS reuse.
- Each page can be edited after import without breaking the whole deck.

The deck should avoid three failure modes:

- Decorative overload: visual effects that do not guide reading.
- AI text sprawl: too many words with no sentence worth sharing.
- Rigid source code: changes require full-deck regeneration.

## 3. Required File Shape

AIPPT v1 targets single-file HTML first.

Required structure:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Deck title</title>
  <style>/* global theme, components, motion */</style>
</head>
<body data-aippt-version="0.1">
  <div id="aippt-stage">
    <div id="aippt-background"></div>
    <main id="slides-container" class="aippt-deck">
      <section class="slide active" data-slide-id="s01" data-archetype="cover-claim" data-index="0">
        ...
      </section>
    </main>
    <nav id="aippt-controls"></nav>
  </div>
  <script type="application/json" id="aippt-manifest">{...}</script>
  <script>/* navigation and safe runtime only */</script>
</body>
</html>
```

Existing AI decks may use `<div class="slide">`. The importer must support both `div.slide` and `section.slide`, but newly generated decks should use `section.slide`.

## 4. Slide Contract

Every slide must include:

- `class="slide"`
- `data-slide-id`: stable id such as `s01`, `s02`.
- `data-index`: zero-based index.
- `data-archetype`: template archetype name.
- `data-purpose`: one short purpose such as `hook`, `pain`, `framework`, `proof`, `demo`, `cta`.
- `data-edit-scope`: `text`, `media`, `layout`, or `locked`.

Recommended slide internal layers:

```html
<section class="slide" data-slide-id="s04" data-archetype="three-pillars" data-purpose="framework">
  <div class="slide-bg" data-lock="theme"></div>
  <div class="slide-guides" data-lock="editor"></div>
  <div class="slide-content">
    <p class="section-label" data-edit-id="s04-label" data-role="eyebrow">CONCEPT FOUNDATION</p>
    <h1 class="slide-title" data-edit-id="s04-title" data-role="title">三个核心概念</h1>
    <p class="slide-subtitle" data-edit-id="s04-subtitle" data-role="subtitle">搞清楚这些，才能真正用好 ChatGPT</p>
    <div class="content-grid" data-edit-id="s04-main" data-role="body">...</div>
  </div>
</section>
```

AI generators may use inline styles only for page-specific emphasis. Stable design must live in CSS classes and variables.

## 5. Editable Element Contract

Any user-editable content must carry:

- `data-edit-id`: unique within the deck.
- `data-role`: `title`, `subtitle`, `body`, `quote`, `metric`, `image`, `icon`, `cta`, `note`.
- `data-ai-policy`: `rewrite-ok`, `style-only`, `manual-only`, or `locked`.

Examples:

```html
<h1 data-edit-id="s01-title" data-role="title" data-ai-policy="rewrite-ok">用 AI 搭建公司工作流</h1>
<img data-edit-id="s08-demo-image" data-role="image" data-ai-policy="manual-only" src="..." alt="..." />
```

The editor must never blindly rewrite elements marked `locked` or `manual-only`.

## 6. Manifest Contract

Every generated deck should include a manifest for reliable import.

```json
{
  "aipptVersion": "0.1",
  "title": "AI 公司工作流实战课",
  "aspect": "16:9",
  "slideCount": 16,
  "theme": "ai-neon-command",
  "audience": "公开课 / 培训 / 自媒体拍摄",
  "slides": [
    {
      "id": "s01",
      "index": 0,
      "archetype": "cover-claim",
      "purpose": "hook",
      "shareLine": "公司不是缺 AI，而是缺一套能复用的 AI 工作流",
      "editable": ["s01-title", "s01-subtitle", "s01-tags"]
    }
  ]
}
```

For legacy decks without a manifest, the importer should infer slide ids, titles, editable text blocks, and image candidates.

## 7. Narrative Rhythm

Default 16-slide course deck:

1. Cover claim: show the big promise.
2. Problem shock: name the pain directly.
3. Outcome stack: what the viewer gets.
4. Mental model: explain the core distinction.
5. Framework map: show the system.
6. Tool/component deep dive 1.
7. Tool/component deep dive 2.
8. Real case setup.
9. Real case transformation.
10. Demo step 1.
11. Demo step 2.
12. Common mistake.
13. Before/after proof.
14. Implementation checklist.
15. Summary and memory anchor.
16. CTA / Q&A / next action.

Default 16-slide training deck:

1. Training title and why it matters.
2. Work scenario pain.
3. Role standard.
4. Process overview.
5. Step 1.
6. Step 2.
7. Step 3.
8. Example.
9. Counterexample.
10. Practice task.
11. Standard answer.
12. Quality checklist.
13. Risk and forbidden actions.
14. Recap.
15. Assessment.
16. Next work action.

Each deck should include at least:

- 2 hook or tension pages.
- 3 framework or system pages.
- 3 proof, case, or demo pages.
- 2 checklist or action pages.
- 1 SNS-ready summary page.

## 8. Slide Writing Rules

Each slide must pass the "one sentence test":

> If this page becomes a screenshot, can the viewer understand and share one clear point?

Text limits:

- Title: 8-22 Chinese characters when possible.
- Subtitle: 16-38 Chinese characters.
- Card title: 4-10 Chinese characters.
- Card body: 18-48 Chinese characters.
- Quote/share line: 14-32 Chinese characters.
- Table cells: short phrases, not paragraphs.

Allowed exceptions:

- Training SOP pages may hold more text, but must split into steps.
- Data tables may be denser, but need one highlighted row or metric.
- Speaker note content must not be visible on the slide by default.

## 9. Visual Hierarchy

Every slide should have a deliberate reading path:

1. Eyebrow or section label gives context.
2. Title states the claim.
3. Visual center carries the main structure.
4. Highlight mark tells the viewer where to look.
5. Footer note or CTA anchors the next action.

Visual focus rules:

- One primary glow or focus element per slide.
- At most two accent colors per slide, plus neutral text.
- Do not let all cards have equal visual weight when one idea is more important.
- Use arrows, numbered chips, scan lines, spotlight blocks, or progress rails to guide attention.
- For training decks, clarity beats decoration.
- For AI capability showcase decks, motion and depth are encouraged but must remain readable when paused.

## 10. Theme Tokens

All themes must define:

```css
:root {
  --bg: #0a0a0f;
  --surface: #111122;
  --surface-2: #17172c;
  --border: #1a2a3a;
  --text: #e8eef8;
  --text-secondary: #8b9aad;
  --accent-a: #00e5ff;
  --accent-b: #b44dff;
  --accent-c: #ffb347;
  --danger: #ff5d73;
  --success: #30d890;
  --font-sans: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: "SF Mono", "Cascadia Code", monospace;
}
```

Required theme families:

- `ai-neon-command`: AI capability, public course, tech showcase.
- `training-control-room`: employee training, SOP, assessment.
- `creator-studio`: filming, self-media, SNS extraction.
- `case-lab`: before/after, transformation proof, consulting report.
- `product-launch`: product or service pitch.

The sample deck maps to `ai-neon-command`.

## 11. Motion System

Motion must have levels.

- `motion-0`: no animation except slide transition.
- `motion-1`: subtle fade and position reveal.
- `motion-2`: staged reveal for title, cards, and highlight.
- `motion-3`: cinematic page entrance, particle/grid response, active focus.
- `motion-4`: demo or showcase effect; only for cover, system map, demo, summary.

Rules:

- Default slide transition: 400-700 ms.
- Internal staged reveals: 120-220 ms gap.
- No infinite animation on text blocks.
- Background particles may loop, but must not reduce legibility.
- Animation must not shift layout after the slide is readable.
- Keyboard navigation must remain instant and reliable.
- Provide a reduced-motion mode through `prefers-reduced-motion`.

Recommended attention sequence:

1. Background establishes mood.
2. Title appears.
3. Main structure appears.
4. Key element receives glow, line, or scale emphasis.
5. Footer/action appears last.

## 12. Component Library

Core components:

- Use `docs/specs/ARCHETYPE_ID_MAP.md` as the source of truth for stable `data-archetype` ids.
- UI labels may be Chinese; manifest ids must be stable English ids.
- A normal deck should select around 16 archetypes from the 36-archetype library.
- A generated deck should not invent new archetype ids unless the template library has been extended.

Every component must support:

- Text edit.
- Style edit within safe bounds.
- AI rewrite of the component only.
- Export back into static HTML.

## 13. SNS Extraction Rules

Each deck must mark extractable moments:

```html
<section class="slide" data-sns-candidate="true" data-sns-format="16:9,9:16,1:1">
```

A good SNS candidate has:

- A standalone claim.
- Big readable text.
- One visual metaphor or strong before/after.
- No dependency on previous slide.
- No tiny table text.
- Safe crop area for vertical reposting.

Required SNS outputs for v1:

- 16:9 screenshot for long video thumbnail or course cover.
- 9:16 vertical crop guide for Reels/TikTok/Shorts filming.
- 1:1 square crop guide for feed/carousel reuse.

## 14. Aspect and Safe Zones

Master deck aspect:

- Default: 16:9, optimized for live screen and long-form video recording.
- Recommended canvas: 1920 x 1080 for browser capture.

SNS derivatives:

- 9:16 vertical derivative: 1080 x 1920 safe preview.
- 1:1 square derivative: 1080 x 1080 safe preview.
- Thumbnail derivative: 16:9 high-resolution export.

Safe-zone principle:

- Keep the page's main claim and focal object inside the central 70% width and 70% height when the page is marked as SNS candidate.
- Avoid critical text in the bottom-right corner for YouTube-style overlays.
- For vertical exports, provide a center-crop preview and warn when the focal element is outside the crop.

## 15. Importer Requirements

The importer must handle:

- Existing `.slide` pages.
- Inline styles.
- Global CSS variables.
- `<canvas>` background layers.
- Page indicators and navigation scripts.
- Tables, cards, icons, emoji, and simple image tags.

The importer should create:

- Slide list.
- Editable element inventory.
- Text outline.
- Asset inventory.
- Potential SNS candidates.
- Detected theme tokens.
- Warnings for unsupported script behavior.

The importer must preserve the original deck as a versioned source snapshot.

## 16. Editor Requirements

MVP editor capabilities:

- Select slide.
- Preview slide.
- Edit text.
- Change color from theme palette.
- Change font weight and size within safe ranges.
- Insert or replace image.
- Apply component-level motion preset.
- Mark a slide as SNS candidate.
- Export a single-file HTML deck.

v1 editor capabilities:

- Drag image or card within a constrained grid.
- Add callout/highlight/arrow/focus ring.
- Save versions.
- Compare before/after of a slide.
- Generate screenshot previews for 16:9, 9:16, and 1:1.
- Run HTML validation and browser smoke checks.

## 17. HMS/Hermes AI Boundary

AI edits should be scoped.

Allowed AI scopes:

- Current text block.
- Current component.
- Current slide.
- New slide from an existing archetype.
- Deck outline suggestions.

Disallowed by default:

- Rewrite the entire deck without explicit user request.
- Replace global theme unexpectedly.
- Remove edit ids or manifest metadata.
- Delete user-inserted images marked `manual-only`.

Recommended request shape:

```json
{
  "task": "rewrite_slide",
  "deckId": "local-deck-id",
  "slideId": "s07",
  "archetype": "case-table",
  "theme": "ai-neon-command",
  "userInstruction": "把这一页改得更适合公开课讲解",
  "lockedElements": ["s07-demo-image"],
  "output": "slide_html_fragment"
}
```

The AI response must include only the changed fragment plus a short change summary. The editor performs the merge and validation.

## 18. Validation Gates

A deck is not accepted until:

- Slide count matches manifest.
- Every slide has stable id and archetype.
- Every editable element has `data-edit-id`.
- Navigation works with keyboard and click/touch.
- Exported HTML opens without console errors.
- 16:9 preview is readable.
- SNS candidate slides pass crop checks.
- AI single-slide edit preserves required metadata.

Product-level acceptance:

> The user can import a generated HTML deck, edit one text block, replace one image, apply one motion preset, ask AI to rewrite one slide, export HTML, and present it in the browser.
