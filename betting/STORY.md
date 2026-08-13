# Bad Bet — Story and Setting

## Premise

A mysterious traveling carnival appears outside town at dawn without warning. No one remembers seeing it arrive, and its bright tents, painted signs, and animal attendants will vanish again that night.

The player enters with a small purse and one goal: leave with as much money as possible before the carnival disappears. Every wager advances time a little, allowing a day of investigation and betting before the gates close.

The carnival advertises generous odds, but its dealers cannot be trusted. Some knowingly exaggerate their games; others misunderstand the machines they operate. The player must investigate actual results, decide which claims are false, and choose how much money to risk.

## Tone and Presentation

The carnival is colorful, surreal, and faintly predatory. Impossible events are treated as ordinary: the carnival arrives without tracks, shops materialize when their advertisements receive enough attention, and attendants calmly accept that the entire place will soon vanish. Characters respond with cheerful professionalism rather than alarm.

Its menace is strictly commercial. The carnival wants the player's money—not their soul, body, memories, or freedom—and it does not physically harm anyone. The danger comes from persuasive salesmanship, misleading claims, hidden information, and the player's own willingness to keep betting. This keeps the atmosphere uncanny and malicious without turning it into horror.

The humor should be dry and matter-of-fact, with friendly announcements, overly specific rules, and upbeat advertising copy that inadvertently reveals how predatory the carnival is. It should feel inviting enough that the player wants to stay, even after realizing that its promises are unreliable.

The overworld is a simple 2D, top-down carnival of tents, booths, paths, lights, and large painted advertisements. Entering an open betting stall presents a detailed static illustration of its operator and a simple betting interface.

## Open Betting Stalls

### The Silver Draw

A kind fox offers two wagers from an ordinary 52-card deck. Silver Pair deals five cards and wins only with exactly one pair. Silver Run deals three cards and wins when all three ranks are consecutive, regardless of suit. She returns every card and reshuffles the full deck between wagers. Before opening the table, the player must ask her about each game's exact winning hand and specifically ask for her estimated odds through a small dialogue tree. The fox appears sincere but gives inaccurate odds for both bets, whose true chances can be calculated without collecting results.

### Rabbit's Generous Toss

A shady, tattooed rabbit runs a coin-toss booth and loudly claims that heads lands four times in five. On the player's first visit, he explains that they may call heads or tails, choose a wager, and receive twice their stake for a correct call. The coin is biased toward heads, but the rabbit exaggerates just how generous it is.

### Hidden Betting Rules

Each wager is independent, with no streak adjustment, rubber-banding, or effect from optional purchases. Silver Pair pays 4× the stake (including the stake). Exactly-one-pair hands occur with probability `13 × C(4,2) × C(12,3) × 4³ / C(52,5)`, or about 42.26%, giving a 1.69× expected return despite the fox's “one in three” estimate. Silver Run pays 100×. Counting A-2-3 through Q-K-A gives `12 × 4³ / C(52,3)`, or about 3.48%, for a 3.48× expected return despite her “one in fifty” estimate. Rabbit's Generous Toss advertises heads at 4/5 (80%), but the coin actually lands heads 65% of the time; a correct call returns 2× the stake. Calling heads therefore returns 1.30× per dollar, while tails returns 0.70×. The rabbit's edge must be estimated empirically, whereas both fox bets can be computed exactly from their rules.

## Advertisements and Hidden Stalls

Three large advertisements stand around the carnival. Looking at an advertisement continuously for five seconds costs fifteen in-game minutes and causes the stall it promotes to mysteriously appear nearby. This should feel like the carnival responding to the player's attention. Each advertisement leads to a real, visitable shop, but only one sells something relevant to the betting investigation.

### Practical Ledgers & Forecasting

Its dull advertisement promotes bookkeeping, averages, and responsible record keeping. Watching it summons a tiny booth run by a tired but helpful owl accountant. The owl sells the player a spreadsheet-style ledger that records wagers and results and calculates observed averages, making it easier to estimate each game's true odds.

### Marvelous Moon Portraits

Its glamorous advertisement promises to reveal the beauty of one's inner beast. Watching it summons a portrait studio that sells an ornate carnival portrait. The purchase is real but cosmetic and provides no betting advantage.

### Dr. Stoat's Invigorating Tonic

Its breathless advertisement promises confidence, vigor, and uncommon luck. Watching it summons a tonic cart selling an expensive sparkling drink. The purchase is real but has no effect on game odds or performance.

## Closed Stalls

Additional stalls make the carnival feel larger while keeping the prototype focused. Their shutters remain closed, and only their painted names hint at possible games:

- Turtle Derby
- The Lucky Lantern

These stalls cannot be opened or played in the prototype.

## Ending

At the end of the night, the carnival lights go dark and the mysterious carnival disappears. The player's final money total is their score. The game does not require uncovering every lie; its story is expressed through what the player chooses to trust, measure, buy, and risk before time runs out.
