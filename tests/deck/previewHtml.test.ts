import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPreviewHtml } from "../../src/deck/previewHtml";
import { importHtmlDeck } from "../../src/deck/importHtml";

const samplePath = "/Users/willma/Downloads/deepseek_html_20260519_8c8811.html";

describe("buildPreviewHtml", () => {
  it("builds a static editor preview that strips deck runtime scripts and hides nav chrome", () => {
    const deck = importHtmlDeck(readFileSync(samplePath, "utf8"));
    const preview = buildPreviewHtml(deck, deck.slides[0], "edit");

    expect(preview).toContain("data-aippt-preview");
    expect(preview).toContain("aippt-editor-preview-overrides");
    expect(preview).toContain("aippt-editor-bridge");
    expect(preview).toContain("postMessage");
    expect(preview).toContain("width: rect.width");
    expect(preview).toContain("height: rect.height");
    expect(preview).toContain("Math.abs(drag.dx)");
    expect(preview).not.toContain("animateParticles()");
    expect(preview).toContain("用ChatGPT搭建");
  });

  it("builds a playback preview that keeps original deck runtime scripts", () => {
    const deck = importHtmlDeck(readFileSync(samplePath, "utf8"));
    const preview = buildPreviewHtml(deck, deck.slides[0], "playback");

    expect(preview).toContain("data-aippt-preview-mode=\"playback\"");
    expect(preview).toContain("animateParticles()");
    expect(preview).not.toContain("aippt-editor-bridge");
    expect(preview).toContain("aippt-ai-effects");
  });
});
