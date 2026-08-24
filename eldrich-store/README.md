# Eldrich Store

The game starts with you finding a mysterious night market that wasn't there before, and walking into a store that sells odd goods. It turns out they're items sold for Faustian bargains, with various supernatural effects. You're looking for a job so you decide to apply, and they immediately take you on as an assistant store manager. You have to make various mundane decisions about inventory and resolve tensions with the staff (who are mythical beasts).

The art direction I'm imagining is that its lots of purple and gray and navy, mixed with bright yellows for example. This is a digital art style. The manager/owner of the store is a demon.

Everyone else's dialogue is supposed to be creepy, and the items have ill effects and the prices are bad bargains, but the actual decisions and job to be done should be perfectly normal other than the setting.

I'm not sure what the gameplay should look like but I want to emphasize dialogue rather than moving around, and it should take place within the store after the opening market scene.

The writing is supposed to be humorous and tongue in cheek despite a creepy setting, like Welcome to Night Vale.

## Prototype

Play one five-minute night shift by resolving five mundane retail problems with supernatural consequences. Every choice affects the **Till**, **Staff**, or **Veil**; Balthazar grades the final balance.

```bash
bun install
bun run dev
```

Use `?music=off` to disable ambience. `?debug=true` adds scene-jump controls. Programmatic playtests can inspect `window.__ELDRICH_STORE__.getState()` and use `choose(index)`, `continue()`, and `restart()`.
