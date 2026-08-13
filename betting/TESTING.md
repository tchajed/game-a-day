# Testing

Run with:

```sh
bun install
bun run dev -- --port 47381
```

Useful URLs:

- `/?music=off` — disables the procedural music control for automated tests
- `/?debug=true&music=off` — shows money, reveal, day-skip, and ending controls
- `/?seed=123&music=off` — deterministic betting outcomes

Programmatic playtesting is available from the browser console:

```js
window.__BAD_BET__.getState()
window.__BAD_BET__.travel(21, 27)
window.__BAD_BET__.open('fox')
```

Core loop:

1. Walk or click to visit the fox and rabbit stalls.
2. Bet repeatedly and compare their advertised odds.
3. Stand still by an advertisement until its shop materializes.
4. Buy the ledger to reveal observed rates at both stalls.
5. Make as much money as possible before three days elapse.
