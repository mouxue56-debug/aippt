# Recommended Sharing Deployment

## Best Immediate Link

Use GitHub Pages first:

```txt
https://mouxue56-debug.github.io/aippt/
```

This is the cleanest link to share in videos, comments, and course materials right now. It opens a tools-style landing page and links to the public AIPPT editor.

Direct editor link:

```txt
https://mouxue56-debug.github.io/aippt/#/aippt
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

## Current Public Boundary

- Local HTML files only.
- No URL importing in public mode.
- No private AI backend.
- No API keys in the public client.
- Browser-local draft saving through `localStorage`.
