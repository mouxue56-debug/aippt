# Recommended Sharing Deployment

## Best Immediate Link

Use GitHub Pages first:

```txt
https://mouxue56-debug.github.io/aippt/
```

This is the cleanest link to share in videos, comments, and course materials right now. It opens the public web tools hub and links to the public AIPPT editor.

Direct editor link:

```txt
https://mouxue56-debug.github.io/aippt/#/aippt
```

Direct storyboard slicer link:

```txt
https://mouxue56-debug.github.io/aippt/#/storyboard-slicer
```

The hash route is intentional. It works on GitHub Pages without requiring server-side rewrites.

## Best Official-Site Path

The best final URL is still:

```txt
https://fuluckai.com/tools/aippt
```

But this should only be deployed after the AIPPT public package is merged into the existing `fuluckai.com` main-site build. Do not deploy the AIPPT package directly as the root Cloudflare Pages output, because that can replace the existing homepage.

## Recommended Order

1. Use GitHub Pages for public sharing now.
2. Keep the GitHub repo public so viewers can fork, inspect, and redeploy it.
3. Merge `release/fuluckai-tools/tools/` into the real `fuluckai.com` site source once that source/build pipeline is available.
4. Add a navigation entry from `fuluckai.com/tools/` to the AIPPT editor.
5. Keep internal AI/HMS/Hermes capabilities out of the public build.

## Default Web-Tools Policy

This repository is now the default maintenance home for public web tools used in Will's AI-blogger workflow.

Unless a future tool clearly needs a separate backend or a separate repository:

1. Add the tool to this web tools hub maintained in the AIPPT repo.
2. Publish it through the same GitHub Pages workflow.
3. Add a card on the tools home page.
4. Keep the public version static or browser-local whenever possible.
5. Keep private AI, HMS/Hermes, API-key, and internal workflow capabilities out of the public bundle.

Current tools:

- HTML PPT 精修台：`#/aippt`
- 分镜格图裁切器：`#/storyboard-slicer`

## Current Public Boundary

- Local HTML files only.
- No URL importing in public mode.
- No private AI backend.
- No API keys in the public client.
- Browser-local draft saving through `localStorage`.
