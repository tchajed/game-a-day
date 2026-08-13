# Testing

Run with:

```sh
bun install
bun run dev -- --port 47381
```

Useful URLs:

- `/?music=off` — disables the procedural music control for automated tests
- `/?debug=true&music=off` — shows money, reveal, hour-skip, night-skip, and ending controls; the carnival clock is always visible
- `/?seed=123&music=off` — deterministic betting outcomes

Programmatic playtesting is available from the browser console:

```js
window.__BAD_BET__.getState()
window.__BAD_BET__.travel(21, 27)
window.__BAD_BET__.open('fox')
window.__BAD_BET__.inspect('ad-ledger')
window.__BAD_BET__.setTime(9 * 60) // 6 PM, when night lighting begins
window.__BAD_BET__.buy('portrait')
window.__BAD_BET__.play('fox', 10, 'pair')
window.__BAD_BET__.play('fox', 10, 'run')
window.__BAD_BET__.play('rabbit', 1, 'tails')
```

Core loop:

1. Walk or click to visit the fox and rabbit stalls. The fox must immediately pitch both games with their hand sizes, basic winning conditions, payouts, and freshly shuffled 52-card deck, then offer mechanics-focused questions about each winning hand plus a specific question about the odds. Her 1/3 Pair and 1/50 Run estimates must appear only after asking about your chances. The table must remain unavailable until all three answers have been read. At the rabbit, click through his three linear rule explanations.
2. At the Silver Draw, switch between Pair and Run and verify that the selected game, example hand, rules, and payout update. Pair deals five cards, accepts exactly one pair, and pays 4×. Run deals three cards, accepts A-2-3 through Q-K-A regardless of suit, and pays 100×. Every result must show the actual cards dealt.
3. Verify the fox advertises Pair at 1/3 and Run at 1/50. Their actual chances are about 42.26% and 3.48%, respectively; the ledger must track the selected fox bet separately.
4. At Rabbit's Generous Toss, verify the advertised 4/5 claim, switch between heads and tails before wagering, and confirm that each result reports which side landed. Its hidden actual heads chance is 65%.
5. Bet repeatedly and compare the games. Results animate into a horizontally scrollable history; use its arrow buttons or mouse wheel to review older outcomes.
6. After 5 manual plays at a stall, toggle ×5 and confirm the main play button changes to `PLAY ×5`; after 10 manual plays, repeat for ×10. Batch plays must not advance either unlock counter.
7. Approach an ordinary notice board and deliberately inspect its hand-drawn advertisement. Leaving before five continuous seconds must not unlock it. At five seconds, verify that fifteen in-game minutes pass, “Something stirs” appears, and the advertised shop materializes.
8. Buy the ledger to reveal observed rates at both stalls.
9. Buy a Moon Portrait. Verify that one hour passes, the finished stick-figure likeness appears inside the studio's ornate easel frame, and returning to the midway reveals a tiny face and two coat buttons on the player sprite without changing its silhouette.
10. Verify the clock is visible in stalls and shops. Use `setTime` or debug controls to compare every game and advertisement-summoned shop's bright morning background, filtered afternoon treatment, and 5–6 PM cross-fade into its separate night background; also verify the overworld night lighting.
11. Buy Dr. Stoat's Tonic and verify a small tonic-bottle icon appears in the top HUD on both desktop and narrow layouts, while the purchase still has no gameplay effect.
12. Make as much money as possible before the single day ends at 9 PM.
