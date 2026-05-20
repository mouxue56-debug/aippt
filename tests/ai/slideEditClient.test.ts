import { describe, expect, it } from "vitest";
import { localFallbackSlideEdit, validateSlideEditResponse } from "../../src/ai/slideEditClient";

describe("slide edit client", () => {
  it("rejects a response that removes the target slide id", () => {
    const result = validateSlideEditResponse(
      {
        updatedSlideHtml: '<section class="slide">Missing id</section>',
        patch: [],
        warnings: [],
        modelUsed: "test",
        costTokens: 0
      },
      "s01"
    );

    expect(result.ok).toBe(false);
  });

  it("rejects injected scripts in a slide fragment", () => {
    const result = validateSlideEditResponse(
      {
        updatedSlideHtml: '<section class="slide" data-slide-id="s01"><script>alert(1)</script></section>',
        patch: [],
        warnings: [],
        modelUsed: "test",
        costTokens: 0
      },
      "s01"
    );

    expect(result.ok).toBe(false);
  });

  it("local fallback keeps the slide unchanged and records the intent", () => {
    const response = localFallbackSlideEdit("压缩标题", '<section class="slide" data-slide-id="s01"><h1>标题</h1></section>');

    expect(response.updatedSlideHtml).toContain('data-slide-id="s01"');
    expect(response.warnings[0]).toContain("本地降级");
    expect(response.warnings[0]).toContain("压缩标题");
  });
});

