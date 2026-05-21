import { describe, expect, it } from "vitest";
import { computeStoryboardTiles, defaultStoryboardGrid, normalizeStoryboardOptions, storyboardOutputName } from "../../src/tools/storyboardSlicer";

describe("storyboard slicer geometry", () => {
  it("infers common portrait and landscape panel grids", () => {
    expect(defaultStoryboardGrid(6, 1200, 1800)).toEqual({ rows: 3, cols: 2 });
    expect(defaultStoryboardGrid(8, 1800, 1200)).toEqual({ rows: 2, cols: 4 });
    expect(defaultStoryboardGrid(12, 1200, 1800)).toEqual({ rows: 4, cols: 3 });
    expect(defaultStoryboardGrid(25, 1400, 1400)).toEqual({ rows: 5, cols: 5 });
  });

  it("computes crop rectangles with margins, grid lines, and inner trim", () => {
    expect(
      computeStoryboardTiles({
        imageWidth: 1000,
        imageHeight: 800,
        rows: 2,
        cols: 3,
        panelCount: 5,
        marginX: 10,
        marginY: 20,
        gapX: 5,
        gapY: 10,
        trim: 2
      })
    ).toEqual([
      { index: 1, row: 0, col: 0, x: 12, y: 22, width: 319, height: 371 },
      { index: 2, row: 0, col: 1, x: 340, y: 22, width: 319, height: 371 },
      { index: 3, row: 0, col: 2, x: 668, y: 22, width: 319, height: 371 },
      { index: 4, row: 1, col: 0, x: 12, y: 407, width: 319, height: 371 },
      { index: 5, row: 1, col: 1, x: 340, y: 407, width: 319, height: 371 }
    ]);
  });

  it("normalizes unsafe numeric options", () => {
    expect(
      normalizeStoryboardOptions({
        rows: "0",
        cols: "99",
        panelCount: "x",
        marginX: "-1",
        marginY: "8",
        gapX: "6",
        gapY: undefined,
        trim: "-4",
        scale: "9",
        startIndex: "0",
        quality: "2"
      })
    ).toEqual({
      rows: 1,
      cols: 20,
      panelCount: 1,
      marginX: 0,
      marginY: 8,
      gapX: 6,
      gapY: 0,
      trim: 0,
      scale: 4,
      startIndex: 1,
      quality: 1
    });
  });

  it("keeps Chinese names and maps extensions", () => {
    expect(storyboardOutputName("伊甸 分镜", 1, 6, "webp", 1)).toBe("伊甸-分镜_01.webp");
    expect(storyboardOutputName("eden board", 10, 25, "jpeg", 7)).toBe("eden-board_16.jpg");
  });
});
