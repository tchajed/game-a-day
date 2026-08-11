# Coffee Supply Chain — Design Interview Plan

This interview is meant to turn the premise into a five-minute prototype without locking in decisions on your behalf. Each section includes a suggested direction to react to, followed by questions for your final call.

## How we will use this

1. Answer the **prototype-defining questions** first.
2. I will turn your answers into a short player journey and revise the prototype.
3. We will playtest one core loop before adding more stages or polish.
4. Anything not decided stays explicitly provisional.

## 1. The five-minute experience

**Suggestion:** Let the player serve one disappointing espresso, learn that technique cannot compensate for stale commodity coffee, then meet two suppliers and choose a better coffee. End by returning to the bar and seeing the improved result. This gives the prototype a beginning, revelation, and payoff without simulating the entire supply chain.

Yes, this is basically what I'm going for; but it should be clear that at the end there is an improvement but still a lot of room left to go (for the rest of the game that doesn't exist yet).

- What exact realization should the player have by the end?

In this interaction it should just be that there is both espresso making technique and a supply chain exists at all.

- Should this prototype include one supplier decision, or only tease sourcing after espresso-making?

Include the supplier decision.

- Is the emotional arc cozy and satisfying, hectic and funny, or quietly educational?

Definitely cozy and satisfying - this is not supposed to appear educational (even if it happens to be).

- Does the run end after a successful drink, a supplier agreement, or a visible shop upgrade?

In this prototype don't imply the game is over - it would be when the coffee shop is perfect.

- What must a first-time player understand without written instructions?

Let's assume they will learn how to make an espresso by trial and error in the interface, but the game should be relatively easy if they can already make espresso. I don't want written instructions.

**Your decision:**

## 2. Player role and point of view

**Suggestion:** Use the customer-side shop view as a visual hub. Clicking the barista or an order transitions into a close barista-eye view for preparation; supplier conversations happen at a café table after closing.

Yes, I like this being a hub.

- Is the player literally the barista, the shop owner directing the barista, or both?

The player is the barista, who is also the shop owner.

- Should the barista be a named character with a personality?

No, too much work for now.

- Should customers be visible characters with reactions, or mostly an implied queue?

Let's have a global score based only on coffee quality, and customers faces should reflect that quality (basically from happy to sad).

- Should scene transitions feel diegetic (camera pushes through the machine) or game-like (cards/panels slide in)?

Game-like.

- When we move up the supply chain later, do we follow the same protagonist or take control of a new animal at each stage?

Same protagonist.

**Your decision:**

## 3. Espresso mini-game

**Suggestion:** Make preparation a short chain of tactile micro-actions with forgiving retries. Accuracy affects extraction, but the first beans impose a quality ceiling so the sourcing revelation feels earned rather than arbitrary.

- Which steps are essential in the prototype: weighing dose, grinding, WDT, tamping, locking in, starting/stopping the shot?

Hmm maybe this is too much, how about we emphasize weighing, tamping, and starting/stopping? But they do need to click or drag around to grind and lock in the portafilter. Have a recipe posted prominently to follow.

- Should each step be a two-second WarioWare-like challenge, or should they form one continuous physical workflow?

Let's do a continuous workflow.

- Is failure binary, or should every action contribute to a taste profile?
- How realistic should target values be (for example, 18 g in, 36 g out, 25–30 seconds)?

Completely realistic.

- Should the player infer those values from visual feedback or see numbers and timers?

Give them numbers.

- Does repetition build player skill, character automation, or both?

Player skill only.

- How many failed or mediocre attempts remain fun before the game intervenes?

We'll see later.

- Should automation replay the player's learned technique, provide a fixed upgrade, or remove the step entirely?

In this prototype we'll move on once the player gets it right.

**Your decision:**

## 4. Why sourcing matters

**Suggestion:** Represent coffee quality with concrete sensory notes rather than a generic score: “papery / flat” for old coffee, then “caramel / cherry / sweet” for a better lot. Technique can reduce defects but cannot create absent flavors.

- What is wrong with the starting coffee: stale roast, poor green coffee, bad processing, an unsuitable roast profile, or a combination?
- How should the player discover the cause—customer reaction, tasting dialogue, extraction data, or the barista's own thought?

Barista's thoughts is good.

- Is there one objectively better supplier, or meaningful trade-offs between price, ethics, reliability, and flavor?

In this game there's an objective answer.

- Should coffee terminology be authentic and unexplained, authentic with lightweight tooltips, or simplified?

Completely authentic.

- Are farmer welfare, traceability, environmental impact, and seasonality central mechanics or background texture?

Let's not get into those right now.

**Your decision:**

## 5. Supplier interview and negotiation

**Suggestion:** Present two or three distinct animal suppliers. The player can ask only a few questions, inspect a sample card, and then negotiate one term. Avoid a single “correct dialogue” by letting different agreements support different shop identities.

We're going with a single correct dialogue here - like the bad options don't know what they're doing or are unethical.

- Who is being interviewed: importer, green buyer, roaster, producer, or several of these?
- What facts can suppliers reveal: origin, cultivar, process, harvest date, price, relationship length, certifications, available volume?
- Is anyone allowed to mislead the player, or is the challenge about incomplete information and trade-offs?
- What is negotiated: per-kilo price, volume, payment timing, exclusivity, quality threshold, or a future relationship?
- Should negotiation be conversational, card-based, or a visible push-and-pull meter?
- What makes a supplier like or trust the player?
- Can the player walk away, request samples, or choose nobody?
- How visibly should the chosen deal change the espresso mini-game and shop scene?

**Your decision:**

## 6. Animals and world

**Suggestion:** Start with a mouse barista: small, nimble hands make the precision work readable and cute. Use a badger as a grounded roaster/importer, a rabbit as a fast-moving customer, and a raven as a detail-oriented green buyer. Treat these as visual starting points, not fixed casting.

Yes, seems like a good start.

- Are all characters animals, and are humans absent from the world?
- Do species communicate personality/jobs, or should we avoid typecasting species?
- Which animal do you most want as the player character?
- Is the world contemporary and realistic, or a gently fantastical animal town?
- Do animals use human-scale equipment, custom animal-scale machines, or oversized café equipment for comic charm?
- How expressive should faces and dialogue be?

**Your decision:**

## 7. Storefront art direction

**Suggestion:** Use a theatrical, straight-on customer view with layered rounded geometry: foreground table, customer silhouettes, curved service bar, barista, grinder, and the back of a recognizably real two-group espresso machine. A saturated coral awning and warm cream tile can frame teal equipment and coffee-brown details.

- Should the opening view feel intimate and small, busy and urban, or polished and aspirational?
- Is “storefront” the exterior façade, the customer-side interior counter, or both?
- What real cafés, machines, illustrators, games, or color palettes should guide the look?
- Should the espresso machine resemble a specific model or remain an original but credible design?
- How bright should the palette be relative to the grounded coffee subject?
- Do you prefer flat vector shapes, subtle texture/grain, or a more dimensional cut-paper look?
- What details make this unmistakably a third-wave café to you?
- Should UI live inside signs, menu boards, tickets, and machine displays, or float as conventional game UI?

**Your decision:**

## 8. Tone, stakes, and feedback

**Suggestion:** Keep the café inviting rather than punitive. “Bad” espresso should produce specific, humorous sensory reactions and a clear cause, not shame the player.

- Are customers patient collaborators, demanding judges, or a mix?
- Is money a meaningful constraint in five minutes?
- Can the shop fail, or are all outcomes steps toward learning?
- How silly can animations and dialogue become without undermining coffee realism?
- What should success feel like: mastery, discovery, community, ethical connection, or business growth?

**Your decision:**

## 9. Accessibility and controls

**Suggestion:** Design every micro-game for mouse/touch first, add keyboard shortcuts, and never require color alone to communicate extraction quality.

- Is mobile play important for this prototype?
- Are timing challenges acceptable, and should an untimed mode be available?
- Should players be able to replay or slow an individual preparation step?
- Are there color-vision, motion, reading, or motor-access needs we should prioritize?
- How much text is comfortable during a five-minute run?

**Your decision:**

## 10. Prototype cuts and debug tools

**Suggestion:** For day one, build the opening shop view, one espresso flow, one diagnosis beat, and one short supplier choice. Defer broader management, roasting, processing, harvesting, inventory, and long-term automation.

- Which single interaction is non-negotiable for the first playable?
- What can be represented by a transition or one line of dialogue instead of a system?
- Which scene should receive the most visual polish?
- What should `?debug=true` allow us to skip or inspect?
- What would make you call the prototype successful after one playtest?

**Your decision:**

## Suggested first decision set

If you want a fast starting point, answer these six first:

1. Who is the player, and which animal are they?
2. What is wrong with the starting coffee?
3. Which espresso steps are playable?
4. What one sourcing trade-off should be genuinely difficult?
5. What ends the five-minute experience?
6. Which café or visual reference best captures the desired storefront mood?
