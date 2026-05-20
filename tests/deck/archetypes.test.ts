import { describe, expect, it } from "vitest";
import { archetypes, defaultCourseSequence, getArchetypeLabel } from "../../src/deck/archetypes";

describe("archetypes", () => {
  it("contains stable ids used by the default course sequence", () => {
    const ids = new Set(archetypes.map((item) => item.id));

    for (const id of defaultCourseSequence) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("returns Chinese labels for stable ids", () => {
    expect(getArchetypeLabel("cover-claim")).toBe("主题封面");
    expect(getArchetypeLabel("framework-map")).toBe("方法论总图页");
  });
});

