# AIPPT Quality Rubric

Status: draft v0.1  
Date: 2026-05-19

## Purpose

This rubric turns "good-looking PPT" into a reviewable standard. It should be used by:

- AI generators before returning a deck.
- AIPPT importer after parsing a deck.
- HMS/Hermes single-slide agents before applying a patch.
- The supervisor model during final acceptance.

Target score:

- 90-100: publishable deck.
- 80-89: usable after light refinement.
- 70-79: structurally useful, visually or narratively weak.
- Below 70: regenerate or redesign before manual polish.

## Score Categories

| Category | Points | Pass standard |
|---|---:|---|
| Narrative retention | 20 | First 3 slides create a reason to keep watching; every slide has one claim. |
| Visual hierarchy | 20 | Eye path is obvious; one focal point per page; contrast supports meaning. |
| Motion and pacing | 15 | Motion guides attention and staged reading; no distracting infinite text motion. |
| SNS extractability | 15 | At least 4 of 16 slides are screenshot/share candidates with crop-safe focus. |
| Editability | 15 | Slides and elements have stable ids, roles, AI policies, and manifest entries. |
| Presentation reliability | 10 | Keyboard/click/touch navigation works; export opens without console errors. |
| Accessibility/readability | 5 | Text is legible at recording size; reduced-motion mode exists. |

## Narrative Retention Rules

Full score requires:

- Slide 1 states the promise in one sentence.
- Slide 2 or 3 names a concrete pain, not a vague theme.
- Every 4-slide segment contains one of: contrast, proof, demo, checklist.
- No slide is only decorative.
- No visible paragraph requires more than 12 seconds to read.

Major deductions:

- More than one main claim on a slide: -3.
- First 3 slides are only agenda/introduction with no tension: -5.
- Consecutive slides repeat the same rhythm without progression: -3.

## Visual Hierarchy Rules

Full score requires:

- One dominant title or visual object.
- Strong contrast between primary and secondary information.
- Highlight marks point to what the speaker should explain.
- Dense pages use grouping, not raw text blocks.
- Theme is consistent across the deck.

Major deductions:

- All cards look equally important when one is the key point: -3.
- Background effect competes with body text: -4.
- Table text is too small for video recording: -4.
- Page feels like a generic office template: -5.

## Motion and Pacing Rules

Full score requires:

- Slide transition is smooth and fast.
- Internal reveals follow reading order.
- Important object gets final focus.
- Motion presets are named and editable.
- Reduced-motion fallback is present.

Major deductions:

- Animations fire in a random order: -4.
- Motion shifts layout after text becomes readable: -4.
- Infinite animation on titles/body text: -3.
- Page is visually impressive but unusable when paused: -5.

## SNS Extractability Rules

Full score requires:

- At least 4 slides marked `data-sns-candidate="true"` in a 16-slide deck.
- Each SNS slide has a standalone share line.
- Critical title/focus stays inside crop-safe center.
- 16:9, 9:16, and 1:1 previews can be generated without losing meaning.

Major deductions:

- No screenshot-worthy slide in the first 5 slides: -4.
- SNS candidates are dense tables or tiny prompt blocks: -4.
- Share line depends on previous slide context: -3.

## Editability Rules

Full score requires:

- Every slide has `data-slide-id`, `data-index`, `data-archetype`, `data-purpose`.
- Every editable element has `data-edit-id`, `data-role`, `data-ai-policy`.
- Manual assets are marked `manual-only`.
- Locked theme/runtime elements are not presented as AI-editable.
- Manifest matches actual slides.

Major deductions:

- Missing manifest: -5.
- Missing stable slide ids: -5.
- AI patch removes edit ids: reject the patch.
- User-inserted image is overwritten by AI: reject the patch.

## Presentation Reliability Rules

Full score requires:

- Browser opens exported HTML without console errors.
- Keyboard navigation works with left/right and space.
- Click/touch navigation works.
- Slide count and page indicator are correct.
- Performance remains smooth on a normal laptop.

Major deductions:

- Exported file opens blank: reject.
- Slide navigation broken: reject.
- Console runtime errors during navigation: -5.
- Effects cause visible lag: -3.

## Review Output Format

Use this format when reviewing a generated deck:

```text
Score: 86 / 100

Strong:
- First 3 slides establish a clear pain and promise.
- Slide 8 before/after is SNS-ready.

Needs refinement:
- Slide 6 has four equal cards; highlight the most important one.
- Slide 11 table text is too small for recording.

Required fixes:
- Add data-edit-id to 12 editable text blocks.
- Mark at least two more slides as SNS candidates.
```

