import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.VITE_AIPPT_BASE_PATH ?? "/",
  plugins: [
    react(),
    {
      name: "aippt-url-import",
      configureServer(server) {
        server.middlewares.use("/api/fetch-url", async (req, res) => {
          try {
            const requestUrl = new URL(req.url ?? "", "http://127.0.0.1");
            const target = requestUrl.searchParams.get("url");
            if (!target || !/^https?:\/\//i.test(target)) {
              res.statusCode = 400;
              res.end("Missing valid url");
              return;
            }
            const html = await renderUrlToHtml(target);
            res.setHeader("content-type", "text/html;charset=utf-8");
            res.end(html);
          } catch (error) {
            res.statusCode = 502;
            res.end(error instanceof Error ? error.message : "Failed to fetch url");
          }
        });
      }
    }
  ],
  server: {
    host: "127.0.0.1"
  },
  test: {
    environment: "jsdom",
    setupFiles: "tests/setup.ts",
    exclude: ["node_modules/**", "dist/**", "tests/browser/**"]
  }
});

async function renderUrlToHtml(target: string): Promise<string> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForTimeout(1800);
    const html = await page.content();
    return injectBaseHref(html, target);
  } finally {
    await browser.close();
  }
}

function injectBaseHref(html: string, target: string): string {
  const safeTarget = target.replaceAll('"', "&quot;");
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${safeTarget}">`);
}
