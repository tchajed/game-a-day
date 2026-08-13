# Testing

Run with:

```sh
bun install
bun run dev -- --port 47381
```

Useful URLs:

- `/?music=off` — disables the procedural music control for automated tests
- `/?debug=true&music=off` — shows the otherwise-hidden carnival timer plus money, reveal, day-skip, and ending controls
- `/?seed=123&music=off` — deterministic betting outcomes

Programmatic playtesting is available from the browser console:

```js
window.__BAD_BET__.getState()
window.__BAD_BET__.travel(21, 27)
window.__BAD_BET__.open('fox')
window.__BAD_BET__.play('fox', 10)
window.__BAD_BET__.play('rabbit', 1, 'tails')
```

Core loop:

1. Walk or click to visit the fox and rabbit stalls. On each first visit, click through the dealer's three rule explanations and verify that each step offers exactly one response.
2. At the Silver Draw, verify that the visible pack contains four silver and six soot cards, every result names the drawn card, and the fox nevertheless advertises “about one in five.” Its exact return is computable from the rules: 4/10 × 3 = 1.20×.
3. At Rabbit's Generous Toss, verify the advertised 4/5 claim, switch between heads and tails before wagering, and confirm that each result reports which side landed. Its hidden actual heads chance is 65%.
4. Bet repeatedly and compare the games. Results animate into a horizontally scrollable history; use its arrow buttons or mouse wheel to review older outcomes.
5. After 5 manual plays at a stall, toggle ×5 and confirm the main play button changes to `PLAY ×5`; after 10 manual plays, repeat for ×10. Batch plays must not advance either unlock counter.
6. Approach an ordinary notice board and deliberately inspect it to read its hand-drawn advertisement; the advertised shop then materializes.
7. Buy the ledger to reveal observed rates at both stalls.
8. Make as much money as possible before three days elapse.
