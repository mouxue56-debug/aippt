import { describe, expect, it } from "vitest";
import { addBlankSlide, deleteSlide, duplicateSlide, moveSlide } from "../../src/deck/slideOperations";
import type { DeckModel } from "../../src/deck/types";

function fixtureDeck(): DeckModel {
  return {
    id: "deck-test",
    title: "Test Deck",
    aipptVersion: "0.1",
    originalHtml: "",
    shellHtml: '<!doctype html><html><body><main id="slides-container">__AIPPT_SLIDES__</main></body></html>',
    warnings: [],
    slides: [
      {
        id: "s01",
        index: 0,
        archetype: "cover-claim",
        purpose: "hook",
        title: "第一页",
        html: '<section class="slide active" data-slide-id="s01" data-index="0"><h1 data-edit-id="s01-title" data-role="title" data-ai-policy="rewrite-ok">第一页</h1></section>',
        editable: [{ id: "s01-title", role: "title", policy: "rewrite-ok", text: "第一页", selectorHint: '[data-edit-id="s01-title"]' }],
        snsCandidate: true
      },
      {
        id: "s02",
        index: 1,
        archetype: "value-promise",
        purpose: "pain",
        title: "第二页",
        html: '<section class="slide" data-slide-id="s02" data-index="1"><h1 data-edit-id="s02-title" data-role="title" data-ai-policy="rewrite-ok">第二页</h1></section>',
        editable: [{ id: "s02-title", role: "title", policy: "rewrite-ok", text: "第二页", selectorHint: '[data-edit-id="s02-title"]' }],
        snsCandidate: false
      }
    ]
  };
}

describe("slideOperations", () => {
  it("adds a blank editable slide after the selected slide and reindexes the deck", () => {
    const result = addBlankSlide(fixtureDeck(), "s01");

    expect(result.deck.slides).toHaveLength(3);
    expect(result.deck.slides[1].id).toBe(result.slideId);
    expect(result.deck.slides[1].title).toBe("新页面标题");
    expect(result.deck.slides[1].editable.map((item) => item.id)).toEqual([`${result.slideId}-title`, `${result.slideId}-body`]);
    expect(result.deck.slides[1].html).toContain("在这里写关键观点，或继续补充本页内容。");
    expect(result.deck.slides[1].html).not.toContain("单页 AI");
    expect(result.deck.slides.map((slide) => slide.index)).toEqual([0, 1, 2]);
    expect(result.deck.slides[1].html).toContain('data-index="1"');
    expect(result.deck.slides[2].html).toContain('data-index="2"');
  });

  it("deletes a slide while preserving at least one slide and reindexing", () => {
    const edited = deleteSlide(fixtureDeck(), "s01");

    expect(edited.slides).toHaveLength(1);
    expect(edited.slides[0].id).toBe("s02");
    expect(edited.slides[0].index).toBe(0);
    expect(edited.slides[0].html).toContain('data-index="0"');
    expect(deleteSlide(edited, "s02").slides).toHaveLength(1);
  });

  it("duplicates a slide with unique slide and editable ids", () => {
    const result = duplicateSlide(fixtureDeck(), "s01");
    const copy = result.deck.slides[1];

    expect(copy.id).toBe(result.slideId);
    expect(copy.title).toBe("第一页 副本");
    expect(copy.html).toContain(`data-slide-id="${result.slideId}"`);
    expect(copy.html).toContain(`data-edit-id="${result.slideId}-title"`);
    expect(copy.editable[0].id).toBe(`${result.slideId}-title`);
    expect(new Set(result.deck.slides.flatMap((slide) => slide.editable.map((item) => item.id))).size).toBe(3);
  });

  it("moves slides up and down without losing indexes", () => {
    const movedUp = moveSlide(fixtureDeck(), "s02", "up");
    expect(movedUp.slides.map((slide) => slide.id)).toEqual(["s02", "s01"]);
    expect(movedUp.slides.map((slide) => slide.index)).toEqual([0, 1]);

    const movedDown = moveSlide(movedUp, "s02", "down");
    expect(movedDown.slides.map((slide) => slide.id)).toEqual(["s01", "s02"]);
    expect(moveSlide(movedDown, "s01", "up").slides.map((slide) => slide.id)).toEqual(["s01", "s02"]);
  });
});
