import { describe, expect, it } from "vitest";
import { editorHref, isPublicMode, isToolsHomePath, publicRoute } from "../../src/app/publicMode";

describe("public route helpers", () => {
  it("keeps fuluckai tools routes on clean paths", () => {
    expect(publicRoute("/tools/", "", "/tools/")).toBe("/");
    expect(publicRoute("/tools/aippt", "", "/tools/")).toBe("/aippt");
    expect(isToolsHomePath("/tools/", "", true, "/tools/")).toBe(true);
    expect(isToolsHomePath("/tools/aippt", "", true, "/tools/")).toBe(false);
    expect(editorHref("/tools/")).toBe("/tools/aippt");
  });

  it("uses a hash editor route for GitHub Pages project hosting", () => {
    expect(publicRoute("/aippt/", "", "/aippt/")).toBe("/");
    expect(publicRoute("/aippt/", "#/aippt", "/aippt/")).toBe("/aippt");
    expect(isToolsHomePath("/aippt/", "", true, "/aippt/")).toBe(true);
    expect(isToolsHomePath("/aippt/", "#/aippt", true, "/aippt/")).toBe(false);
    expect(isPublicMode("/aippt/", "#/aippt", true, "/aippt/")).toBe(true);
    expect(editorHref("/aippt/")).toBe("/aippt/#/aippt");
  });
});
