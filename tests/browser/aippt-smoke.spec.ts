import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const samplePath = resolve(process.cwd(), "tests/fixtures/reference-deck.html");

test("imports the sample deck and edits the first slide title", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/tools/");
  await expect(page.getByText("工具合集")).toBeVisible();
  await expect(page.getByRole("link", { name: /HTML PPT 精修台/ })).toHaveAttribute("href", "/tools/aippt");
  await page.goto("/tools/aippt");
  await expect(page.getByText("公开版只处理你选择的本地 HTML 文件", { exact: false })).toBeVisible();
  await expect(page.getByText("单页 AI")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "导入网页" })).toHaveCount(0);

  await page.goto("/");
  await expect(page.getByText("导入网页 / HTML")).toBeVisible();

  await page.getByLabel("导入 HTML PPT").setInputFiles(samplePath);
  await expect(page.getByText("16 页已载入")).toBeVisible();
  await expect(page.locator("iframe.slide-frame")).not.toHaveAttribute("style", /scale\(0\.5\)/);
  await expect(page.getByLabel("幻灯片列表").getByRole("button", { name: /用ChatGPT/ })).toBeVisible();
  await page.getByRole("button", { name: "新增页面" }).click();
  await expect(page.getByText("17 页已载入")).toBeVisible();
  await page.getByRole("button", { name: "撤销" }).click();
  await expect(page.getByText("16 页已载入")).toBeVisible();
  await page.getByRole("button", { name: "重做" }).click();
  await expect(page.getByText("17 页已载入")).toBeVisible();
  await page.getByLabel("幻灯片列表").getByRole("button", { name: /新页面标题/ }).click();
  await page.getByRole("button", { name: "删除页面" }).click();
  await expect(page.getByText("16 页已载入")).toBeVisible();
  await page.getByLabel("幻灯片列表").getByRole("button", { name: /用ChatGPT/ }).click();
  await expect(page.getByText("插入新图片")).toBeVisible();
  await expect(page.locator("select")).toHaveCount(1);

  const firstTextarea = page.locator("textarea").first();
  await expect(firstTextarea).toBeVisible();
  await firstTextarea.fill("AIPPT 精修演示");
  await firstTextarea.blur();

  await expect(page.getByText("已更新文字。")).toBeVisible();
  await expect(page.frameLocator("iframe.slide-frame").getByText("AIPPT 精修演示")).toBeVisible();
  await page.frameLocator("iframe.slide-frame").getByText("AIPPT 精修演示").click();
  await expect(page.getByText(/已选中：标题|已选中：正文/)).toBeVisible();
  await page.getByLabel("文字颜色").fill("#ff3d8b");
  await expect(page.getByText("已更新文字样式：颜色")).toBeVisible();
  await page.getByLabel("字号").fill("64");
  await page.getByLabel("字号").blur();
  await expect(page.getByText("已更新文字样式：字号")).toBeVisible();
  await page.getByRole("button", { name: "右移" }).click();
  await expect(page.getByText("已调整对象位置。")).toBeVisible();
  await page.getByRole("button", { name: "演示预览" }).click();
  await expect(page.getByText("演示预览：保留原网页动效")).toBeVisible();
  await page.getByRole("button", { name: "编辑预览" }).click();

  await page.getByRole("button", { name: "流程图" }).click();
  await expect(page.getByText("已插入流程图。")).toBeVisible();
  await expect(page.frameLocator("iframe.slide-frame").getByText("流程图")).toBeVisible();

  await page.getByRole("button", { name: "保存当前页" }).click();
  await expect(page.getByText("已保存当前页修改", { exact: false })).toBeVisible();

  const singleSlideDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /导出当前页 HTML/ }).click();
  const singleSlideDownload = await singleSlideDownloadPromise;
  const singleSlidePath = await singleSlideDownload.path();
  expect(singleSlidePath).toBeTruthy();
  const singleSlideContent = readFileSync(singleSlidePath!, "utf8");
  expect(singleSlideContent).toContain("\"slideCount\":1");
  expect(singleSlideContent).toContain("AIPPT 精修演示");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /导出整套 HTML/ }).click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  expect(exportedPath).toBeTruthy();
  const exportedContent = readFileSync(exportedPath!, "utf8");
  expect(exportedContent).toContain("AIPPT 精修演示");
  expect(exportedContent).toContain("color: #ff3d8b");
  expect(exportedContent).toContain("font-size: 64px");
  expect(exportedContent).toContain("aippt-ai-effects");
  expect(exportedContent).toContain("transform: translate");
  expect(exportedContent).not.toContain("left: 12px");
  expect(exportedContent).toContain('data-aippt-block="process"');
  expect(exportedContent).toContain("aippt-manifest");

  expect(consoleErrors).toEqual([]);
});
