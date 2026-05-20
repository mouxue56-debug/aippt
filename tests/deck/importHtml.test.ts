import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { importHtmlDeck } from "../../src/deck/importHtml";

const samplePath = "/Users/willma/Downloads/deepseek_html_20260519_8c8811.html";

describe("importHtmlDeck", () => {
  it("imports the reference deck as 16 slides", () => {
    const html = readFileSync(samplePath, "utf8");
    const deck = importHtmlDeck(html);

    expect(deck.slides).toHaveLength(16);
    expect(deck.slides[0].id).toBe("s01");
    expect(deck.slides[0].index).toBe(0);
    expect(deck.slides[0].title).toContain("用ChatGPT搭建");
    expect(deck.originalHtml).toBe(html);
  });

  it("adds stable edit metadata to title-like and body-like elements", () => {
    const html = readFileSync(samplePath, "utf8");
    const deck = importHtmlDeck(html);
    const first = deck.slides[0];

    expect(first.editable.some((item) => item.role === "title" && item.text?.includes("用ChatGPT搭建"))).toBe(true);
    expect(first.editable.some((item) => item.text === "⚡ Projects")).toBe(true);
    expect(first.editable.some((item) => item.text === "90分钟实战公开课")).toBe(true);
    expect(first.html).toContain("data-edit-id=");
    expect(first.html).toContain("data-ai-policy=");
  });

  it("preserves the original stage shell for export", () => {
    const html = readFileSync(samplePath, "utf8");
    const deck = importHtmlDeck(html);

    expect(deck.shellHtml).toContain("id=\"slides-container\"");
    expect(deck.shellHtml).toContain("id=\"particles\"");
  });

  it("turns a regular webpage without .slide into editable page sections", () => {
    const html = `<!doctype html><html><head><title>普通网页</title></head><body><section><h1>第一屏标题</h1><p>这里是一段足够长的网页内容，用来模拟普通官网区块。</p></section><section><h2>第二屏标题</h2><p>第二个区块也应该可以被当成网页 PPT 页面。</p></section></body></html>`;
    const deck = importHtmlDeck(html);

    expect(deck.slides.length).toBeGreaterThanOrEqual(2);
    expect(deck.slides[0].html).toContain('class="slide active"');
    expect(deck.slides[0].editable.some((item) => item.text === "第一屏标题")).toBe(true);
  });

  it("recognizes common webpage text controls and svg labels as editable text", () => {
    const html = `<!doctype html><html><body><section class="slide"><h3>小节标题</h3><a href="#">行动链接</a><button>预约咨询</button><figcaption>图片说明</figcaption><svg><text>图表标签</text><tspan>节点文字</tspan></svg></section></body></html>`;
    const deck = importHtmlDeck(html);
    const texts = deck.slides[0].editable.map((item) => item.text);

    expect(texts).toContain("小节标题");
    expect(texts).toContain("行动链接");
    expect(texts).toContain("预约咨询");
    expect(texts).toContain("图片说明");
    expect(texts).toContain("图表标签");
    expect(texts).toContain("节点文字");
  });

  it("prefers complete parent headings over animated single-character spans", () => {
    const html = `<!doctype html><html><body><section class="slide"><h1><span>L</span><span>I</span><span>N</span><span>E</span>返信</h1><p><span>正文片段</span></p></section></body></html>`;
    const deck = importHtmlDeck(html);
    const texts = deck.slides[0].editable.map((item) => item.text);

    expect(texts).toContain("LINE返信");
    expect(texts).not.toContain("L");
    expect(texts).not.toContain("I");
    expect(texts).toContain("正文片段");
  });
});
