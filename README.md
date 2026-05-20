# AIPPT

AIPPT is a workflow project for AI-generated HTML presentations.

The goal is not to clone PowerPoint. The goal is to make AI-generated web PPTs controllable, reusable, visually strong, and easy to refine after generation.

## Core Workflow

1. Start from a high-quality HTML PPT template specification.
2. Ask another AI to generate a deck against that specification.
3. Import the generated single-file HTML deck into AIPPT.
4. Manually refine text, color, image, layout, and motion.
5. In the internal edition, use HMS/Hermes for deeper single-slide or component-level AI edits.
6. Export a single-file HTML deck for filming, public courses, training, or live presentation.

## Current Source Sample

The first reference deck is:

`/Users/willma/Downloads/deepseek_html_20260519_8c8811.html`

It is a 16-slide single-file HTML deck with `.slide` pages, global CSS, inline visual structure, particles, keyboard navigation, page indicators, card grids, comparison blocks, tables, and AI-course content.

## First Deliverables

- `docs/specs/AIPPT_HTML_PPT_SPEC.md`: the core generation and editing specification.
- `docs/specs/SNS_RETENTION_RULES.md`: viewer-retention and social-sharing rules for the deck format.
- `docs/specs/TEMPLATE_LIBRARY_TAXONOMY.md`: 36 reusable narrative page archetypes.
- `docs/specs/ARCHETYPE_ID_MAP.md`: stable archetype ids for manifests and `data-archetype`.
- `docs/specs/QUALITY_RUBRIC.md`: review scorecard for generator output, imported decks, and AI patches.
- `templates/prompts/HTML_PPT_GENERATOR_PROMPT.md`: a prompt template for asking other AIs to generate compliant decks.
- `docs/work-packages/`: implementation packages for cheaper model execution and supervisor review.

## Local Editor MVP

Run the editor:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Current implemented path:

- Import a local AI-generated HTML PPT file.
- Import a URL through the local `/api/fetch-url` renderer.
- Split `.slide` decks into pages, and split ordinary webpages into editable sections.
- Detect editable titles, body text, buttons, links, captions, SVG labels, and images.
- Avoid single-character controls when animated headings are built from many nested spans.
- Click text/image/visual objects in the preview to select them.
- Switch between edit preview and playback preview; playback keeps the imported deck's runtime effects.
- Zoom the preview canvas above the strict fit size when detail editing needs a larger view.
- Edit recognized text from the inspector.
- Change selected text color, font size, weight, italic, alignment, and neon text shadow.
- Insert image, process, mindmap, and gantt visual blocks.
- Move selected normal-flow text with `transform` so the original layout does not collapse.
- Move inserted/free image blocks with absolute positioning.
- Undo and redo deck edits, including page operations.
- Add, duplicate, delete, and reorder pages from the slide sidebar.
- Save the whole project or current slide to a local browser draft.
- Apply page-level and selected-object motion presets, including AI neon scan, hologram depth, signal pulse, and data cascade.
- Export either the whole deck HTML or the current-slide HTML with an `aippt-manifest`.

Verification commands:

```bash
npm test
npm run build
npm run smoke
```

Public tools build:

```bash
npm run build:public
```

The public build is designed for `https://fuluckai.com/tools/` and `https://fuluckai.com/tools/aippt`. It hides HMS/Hermes and single-slide AI controls, disables URL fetching, and only exposes local browser-based HTML editing. Deployment notes are in `docs/deploy/public-tools.md`.

Create a main-site handoff package:

```bash
npm run package:public
```

This writes `release/fuluckai-tools/`, including the `/tools/` static files plus Cloudflare `_redirects` and `_headers`.

GitHub Pages is also configured for a public mirror. On `main` pushes, `.github/workflows/pages.yml` builds the public editor and publishes it under `/aippt/`; see `docs/deploy/github-pages.md`.

Current public mirror:

- GitHub: `https://github.com/mouxue56-debug/aippt`
- Tools home: `https://mouxue56-debug.github.io/aippt/`
- Editor: `https://mouxue56-debug.github.io/aippt/#/aippt`

Known boundary: importing arbitrary marketing sites is best-effort. The app can fetch and sectionize them, but a normal website is not always a native 16:9 slide deck. For high-quality SNS/course output, the stable workflow is still to generate HTML against `templates/prompts/HTML_PPT_GENERATOR_PROMPT.md`, then refine it here.
