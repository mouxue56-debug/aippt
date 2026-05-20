import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Inspector } from "../../src/ui/Inspector";
import type { EditableElement } from "../../src/deck/types";

const selected: EditableElement = {
  id: "s01-title",
  role: "title",
  policy: "rewrite-ok",
  text: "标题",
  selectorHint: '[data-edit-id="s01-title"]'
};

describe("Inspector", () => {
  it("nudges selected objects with relative movement so normal text flow is preserved", () => {
    const onSetLayout = vi.fn();

    render(
      <Inspector
        editable={[selected]}
        selected={selected}
        selectedLayout={{ x: 100, y: 220, width: 360, height: 80 }}
        onReplaceText={vi.fn()}
        onSetTextStyle={vi.fn()}
        onReplaceImage={vi.fn()}
        onSetLayout={onSetLayout}
        onDeleteObject={vi.fn()}
        onApplyMotion={vi.fn()}
        onApplySlideMotion={vi.fn()}
        onInsertVisualBlock={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "右移" }));

    expect(onSetLayout).toHaveBeenCalledWith("s01-title", { dx: 12, dy: 0 });
  });
});
