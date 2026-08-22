# Game development instructions

Read and follow the shared project goals, workflow, and technical constraints in [`../GAME_GUIDELINES.md`](../GAME_GUIDELINES.md).

Treat this game directory as the complete project for the current task. Do not inspect or modify sibling game directories unless the user explicitly asks you to.

This is a rapid game prototype: it should be finished in one day, with massive AI assistance.

Commit each logical change immediately.

I often run other vite servers, so to avoid conflicts pick a random high port to use for testing servers. Avoid killing or conflicting with those other servers.

Use `lockfileVersion: 1` in `bun.lock` for compatibility with Cloudflare Pages (which uses bun 1.2).
