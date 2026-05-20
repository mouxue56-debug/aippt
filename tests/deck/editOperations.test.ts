import { describe, expect, it } from "vitest";
import { applyEditOperation } from "../../src/deck/editOperations";
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
        title: "旧标题",
        html: '<section class="slide active" data-slide-id="s01"><h1 data-edit-id="s01-title" data-role="title" data-ai-policy="rewrite-ok">旧标题</h1><img data-edit-id="s01-img" data-role="image" data-ai-policy="manual-only" src="old.png" alt="old"></section>',
        editable: [
          { id: "s01-title", role: "title", policy: "rewrite-ok", text: "旧标题", selectorHint: '[data-edit-id="s01-title"]' },
          { id: "s01-img", role: "image", policy: "manual-only", src: "old.png", selectorHint: '[data-edit-id="s01-img"]' }
        ],
        snsCandidate: true
      }
    ]
  };
}

describe("applyEditOperation", () => {
  it("replaces text for one editable element", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "replace-text",
      slideId: "s01",
      editId: "s01-title",
      value: "新标题"
    });

    expect(edited.slides[0].html).toContain("新标题");
    expect(edited.slides[0].title).toBe("新标题");
    expect(edited.slides[0].editable[0].text).toBe("新标题");
  });

  it("replaces image src and alt while preserving edit metadata", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "replace-image",
      slideId: "s01",
      editId: "s01-img",
      src: "new.png",
      alt: "new image"
    });

    expect(edited.slides[0].html).toContain('src="new.png"');
    expect(edited.slides[0].html).toContain('data-edit-id="s01-img"');
    expect(edited.slides[0].editable[1].src).toBe("new.png");
  });

  it("applies page-level motion without adding one control per text item", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "set-slide-motion",
      slideId: "s01",
      preset: "guided-reveal"
    });

    expect(edited.slides[0].html).toContain('data-motion-preset="guided-reveal"');
  });

  it("inserts an image visual block even when the slide had no image", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "insert-visual-block",
      slideId: "s01",
      block: {
        kind: "image",
        src: "data:image/png;base64,abc",
        alt: "new image"
      }
    });

    expect(edited.slides[0].html).toContain('data-aippt-block="image"');
    expect(edited.slides[0].editable.some((item) => item.role === "image" && item.src === "data:image/png;base64,abc")).toBe(true);
  });

  it("moves and scales a selected object by writing layout style", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "set-layout",
      slideId: "s01",
      editId: "s01-img",
      layout: { x: 120, y: 160, width: 420 }
    });

    expect(edited.slides[0].html).toContain("position: absolute");
    expect(edited.slides[0].html).toContain("left: 120px");
    expect(edited.slides[0].html).toContain("top: 160px");
    expect(edited.slides[0].html).toContain("width: 420px");
  });

  it("nudges normal-flow text with transform instead of absolute positioning", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "set-layout",
      slideId: "s01",
      editId: "s01-title",
      layout: { dx: 12, dy: 0 }
    });

    expect(edited.slides[0].html).toContain("transform: translate(12px, 0px)");
    expect(edited.slides[0].html).not.toContain("left: 12px");
  });

  it("supports set-style for color and font-size on text nodes", () => {
    let edited = applyEditOperation(fixtureDeck(), {
      type: "set-style",
      slideId: "s01",
      editId: "s01-title",
      property: "color",
      value: "#ff0000"
    });

    edited = applyEditOperation(edited, {
      type: "set-style",
      slideId: "s01",
      editId: "s01-title",
      property: "font-size",
      value: "36px"
    });

    expect(edited.slides[0].html).toContain("color: #ff0000");
    expect(edited.slides[0].html).toContain("font-size: 36px");
  });

  it("keeps existing transform style while updating font-size repeatedly", () => {
    const nudged = applyEditOperation(fixtureDeck(), {
      type: "set-layout",
      slideId: "s01",
      editId: "s01-title",
      layout: { dx: 12, dy: 0 }
    });

    const resized = applyEditOperation(nudged, {
      type: "set-style",
      slideId: "s01",
      editId: "s01-title",
      property: "font-size",
      value: "34px"
    });

    expect(resized.slides[0].html).toContain("transform: translate(12px, 0px)");
    expect(resized.slides[0].html).toContain("font-size: 34px");
  });

  it("keeps positioned title-like objects from breaking into single characters", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "set-layout",
      slideId: "s01",
      editId: "s01-title",
      layout: { x: 120, y: 160, width: 420 }
    });

    expect(edited.slides[0].html).toContain("word-break: keep-all");
    expect(edited.slides[0].html).toContain("overflow-wrap: normal");
  });

  it("does not allow set-style to write disallowed properties", () => {
    const edited = applyEditOperation(
      applyEditOperation(fixtureDeck(), {
        type: "set-style",
        slideId: "s01",
        editId: "s01-title",
        property: "position",
        value: "absolute"
      }),
      {
        type: "set-style",
        slideId: "s01",
        editId: "s01-title",
        property: "background-image",
        value: "url(pwn.png)"
      }
    );

    expect(edited.slides[0].html).not.toContain("position:");
    expect(edited.slides[0].html).not.toContain("background-image:");
  });

  it("set-style updates only allowed style properties for text styling", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "set-style",
      slideId: "s01",
      editId: "s01-title",
      property: "font-weight",
      value: "700"
    });

    expect(edited.slides[0].html).toContain("font-weight: 700");
  });

  it("deletes a selected editable object", () => {
    const edited = applyEditOperation(fixtureDeck(), {
      type: "delete-object",
      slideId: "s01",
      editId: "s01-img"
    });

    expect(edited.slides[0].html).not.toContain("s01-img");
    expect(edited.slides[0].editable.some((item) => item.id === "s01-img")).toBe(false);
  });

  it("inserts process, mindmap, and gantt visual blocks as editable diagram structures", () => {
    for (const kind of ["process", "mindmap", "gantt"] as const) {
      const edited = applyEditOperation(fixtureDeck(), {
        type: "insert-visual-block",
        slideId: "s01",
        block: { kind }
      });

      expect(edited.slides[0].html).toContain(`data-aippt-block="${kind}"`);
      expect(edited.slides[0].editable.some((item) => item.id.includes(kind))).toBe(true);
    }
  });
});
