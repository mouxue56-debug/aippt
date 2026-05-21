import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { expect, test } from "@playwright/test";

const samplePath = resolve(process.cwd(), "tests/fixtures/reference-deck.html");

test("imports the sample deck and edits the first slide title", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/tools/");
  await expect(page.getByText("网页工具合集")).toBeVisible();
  await expect(page.getByRole("link", { name: /HTML PPT 精修台/ })).toHaveAttribute("href", "/tools/aippt");
  await expect(page.getByRole("link", { name: /分镜格图裁切器/ })).toHaveAttribute("href", "/tools/storyboard-slicer");

  await page.goto("/tools/storyboard-slicer");
  await expect(page.getByRole("heading", { name: "分镜格图裁切器" })).toBeVisible();
  await page.getByLabel("分镜图片").setInputFiles({
    name: "test-board.png",
    mimeType: "image/png",
    buffer: makeStoryboardPng(300, 400, 4, 3)
  });
  await expect(page.getByText("test-board.png / 300x400")).toBeVisible();
  await page.getByRole("button", { name: "12" }).click();
  await page.getByRole("spinbutton", { name: "外边距 X" }).fill("4");
  await page.getByRole("spinbutton", { name: "外边距 Y" }).fill("4");
  await page.getByRole("spinbutton", { name: "格线 X" }).fill("2");
  await page.getByRole("spinbutton", { name: "格线 Y" }).fill("2");
  await page.getByRole("button", { name: "生成小图" }).click();
  await expect(page.getByText("已生成 12 张小图。")).toBeVisible();
  await expect(page.locator(".slicer-thumb")).toHaveCount(12);
  await expect(page.getByText("192x192").first()).toBeVisible();

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

function makeStoryboardPng(width: number, height: number, rows: number, cols: number): Buffer {
  const margin = 4;
  const gap = 2;
  const cellWidth = Math.floor((width - margin * 2 - gap * (cols - 1)) / cols);
  const cellHeight = Math.floor((height - margin * 2 - gap * (rows - 1)) / rows);
  const colors = [
    [255, 112, 174],
    [85, 183, 255],
    [255, 226, 93],
    [57, 217, 138],
    [153, 122, 255],
    [255, 149, 102],
    [255, 139, 211],
    [84, 214, 196],
    [129, 207, 255],
    [196, 246, 109],
    [225, 177, 255],
    [255, 198, 108]
  ];
  const rawRows: Buffer[] = [];

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      let color = [250, 252, 255];
      for (let panelRow = 0; panelRow < rows; panelRow += 1) {
        for (let panelCol = 0; panelCol < cols; panelCol += 1) {
          const left = margin + panelCol * (cellWidth + gap);
          const top = margin + panelRow * (cellHeight + gap);
          if (x >= left && x < left + cellWidth && y >= top && y < top + cellHeight) {
            color = colors[panelRow * cols + panelCol] ?? color;
          }
        }
      }
      row[1 + x * 3] = color[0];
      row[1 + x * 3 + 1] = color[1];
      row[1 + x * 3 + 2] = color[2];
    }
    rawRows.push(row);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from("\x89PNG\r\n\x1a\n", "binary"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.concat(rawRows))),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
