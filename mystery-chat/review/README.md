# Mystery Chat review desk

A spoiler-aware review website for the three Mystery Chat prototypes. Every story starts
on the exact public briefing. Hidden prompts and playtest evidence are separate, explicit
reveals, and the current v3 prompt can be copied to the clipboard without rendering it.

The site imports source material directly from `../stories/` and `../playtests/` during
the Vite build, so new prompt text and transcript artifacts do not need to be duplicated
in the UI code. The default evidence view is the informed v3 pressure run; the blind v2
runs and v1 baseline remain available for comparison.

## Run locally

```bash
bun install
bun run dev
```

Vite will print the local URL. UI state is saved in the hash, so a particular story,
prompt version, or playtest run can be bookmarked.

## Verify

```bash
bun run test
bun run build
```

The Playwright suite checks spoiler defaults, copy-without-reveal behavior, prompt and run
navigation, story reset behavior, and mobile overflow. The app uses relative production
asset paths so it can be served from a non-root URL.
