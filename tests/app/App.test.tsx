import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { ToolsHome } from "../../src/app/ToolsHome";

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
});

describe("App", () => {
  it("shows the import, preview, edit, AI, and export surfaces", async () => {
    render(<App />);

    expect(screen.getByText("导入网页 / HTML")).toBeInTheDocument();
    expect(screen.getByText("预览")).toBeInTheDocument();
    expect(screen.getByText("精修")).toBeInTheDocument();
    expect(await screen.findByText("单页 AI")).toBeInTheDocument();
    expect(screen.getByText("保存 / 导出")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑预览" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "演示预览" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "放大画布" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "适配画布" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "撤销" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重做" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增页面" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制页面" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除页面" })).toBeInTheDocument();
    expect(screen.getByText("AI霓虹扫描")).toBeInTheDocument();
  });

  it("hides URL import and AI controls on the public tools route", () => {
    window.history.pushState({}, "", "/tools/aippt");
    render(<App />);

    expect(screen.queryByText("导入网页 / HTML")).not.toBeInTheDocument();
    expect(screen.getByText("导入 HTML")).toBeInTheDocument();
    expect(screen.getByText("公开版只处理你选择的本地 HTML 文件", { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "导入网页" })).not.toBeInTheDocument();
    expect(screen.queryByText("单页 AI")).not.toBeInTheDocument();
    expect(screen.getByLabelText("导入 HTML PPT")).toBeInTheDocument();
  });
});

describe("ToolsHome", () => {
  it("links the tools index to the public AIPPT editor", () => {
    render(<ToolsHome />);

    expect(screen.getByText("网页工具合集")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /HTML PPT 精修台/ })).toHaveAttribute("href", "/#/aippt");
    expect(screen.getByRole("link", { name: /分镜格图裁切器/ })).toHaveAttribute("href", "/#/storyboard-slicer");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/mouxue56-debug/aippt");
    expect(screen.queryByText(/Hermes|HMS/)).not.toBeInTheDocument();
  });
});
