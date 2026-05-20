import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { applyEditOperation } from "../../src/deck/editOperations";
import { exportHtmlDeck, exportHtmlSlide } from "../../src/deck/exportHtml";
import { importHtmlDeck } from "../../src/deck/importHtml";

const samplePath = resolve(process.cwd(), "tests/fixtures/reference-deck.html");

describe("exportHtmlDeck", () => {
  it("exports the imported deck as a single HTML file with manifest and edited text", () => {
    const html = readFileSync(samplePath, "utf8");
    const deck = importHtmlDeck(html);
    const title = deck.slides[0].editable.find((item) => item.role === "title");
    expect(title).toBeDefined();

    const edited = applyEditOperation(deck, {
      type: "replace-text",
      slideId: "s01",
      editId: title!.id,
      value: "AIPPT 精修演示"
    });
    const exported = exportHtmlDeck(edited);

    expect(exported).toContain("<!DOCTYPE html>");
    expect(exported).toContain("AIPPT 精修演示");
    expect(exported).toContain("aippt-manifest");
    expect(exported).toContain("aippt-ai-effects");
    expect(exported).toContain("ai-neon-scan");
    expect(exported).toContain("id=\"slides-container\"");
    expect(exported).toContain("id=\"particles\"");
  });

  it("exports only the selected slide when requested", () => {
    const html = readFileSync(samplePath, "utf8");
    const deck = importHtmlDeck(html);
    const exported = exportHtmlSlide(deck, deck.slides[1]);

    expect(exported).toContain("aippt-manifest");
    expect(exported).toContain("\"slideCount\":1");
    expect(exported).toContain(deck.slides[1].title);
    expect(exported).not.toContain(deck.slides[2].title);
  });
});
