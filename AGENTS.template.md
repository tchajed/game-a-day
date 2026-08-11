# Game development instructions

Read and follow the shared project goals, workflow, and technical constraints in [`../GAME_GUIDELINES.md`](../GAME_GUIDELINES.md).

Treat this game directory as the complete project for the current task. Do not inspect or modify sibling game directories unless the user explicitly asks you to.

This is a rapid game prototype: it should be finished in one day, with massive AI assistance.

Games are deployed under a non-root URL prefix (`/<slug>/`). Never hard-code root-relative runtime asset URLs such as `/assets/image.png`, because they resolve against the portfolio root. Prefer importing assets from `src` so Vite rewrites their URLs; for files in `public`, prefix paths with `import.meta.env.BASE_URL`. Test a production build with a non-root `--base` (or run the portfolio build from `site`) rather than relying only on the dev server.

Commit each logical change immediately.

I often run other vite servers, so to avoid conflicts pick a random high port to use for testing servers. Avoid killing or conflicting with those other servers.
