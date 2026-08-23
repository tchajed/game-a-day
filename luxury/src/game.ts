export type Metrics = {
  aura: number
  craft: number
  cash: number
  reach: number
}

export type Delta = Partial<Metrics>

export type Choice = {
  id: string
  title: string
  body: string
  response: string
  newsHeadline: string
  consequence: string
  now: Delta
  later: Delta
  luxury: 0 | 1 | 2
}

export type Crisis = {
  title: string
  body: string
  choices: [Choice, Choice, Choice]
  timeoutChoice: number
}

export const INITIAL_METRICS: Metrics = { aura: 62, craft: 64, cash: 48, reach: 18 }

export type DecisionRound = {
  id: string
  label: string
  crisisIndices: readonly number[]
  seconds: number | null
}

// The first lunchbox is untimed. The table then grows from one decision to
// paired briefs while keeping the complete timed portion near three minutes.
export const DECISION_ROUNDS: readonly DecisionRound[] = [
  { id: 'first-opening', label: 'First opening', crisisIndices: [0], seconds: null },
  { id: 'workshop-table', label: 'Workshop table', crisisIndices: [1], seconds: 22 },
  { id: 'public-appetite', label: 'Public appetite', crisisIndices: [2, 3], seconds: 32 },
  { id: 'private-orders', label: 'Private orders', crisisIndices: [4, 5], seconds: 32 },
  { id: 'price-and-future', label: 'Price & future', crisisIndices: [6, 7], seconds: 34 },
  { id: 'use-and-duty', label: 'Use & duty', crisisIndices: [8, 9], seconds: 34 },
  { id: 'living-archive', label: 'Living archive', crisisIndices: [10, 11], seconds: 36 },
]

export const CRISES: Crisis[] = [
  {
    title: 'The hand-finished myth',
    body: 'A former apprentice says the clasp on every Morrow lunchbox has been stamped by machine for decades. Collectors are turning their boxes over at breakfast, hunting for a hand-filed edge and wondering whether the ritual was ever real.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'broadcast', title: 'Broadcast the workshop',
        body: 'Put every bench live for seventy-two hours, from the first sheet of metal to the final packed lunch. Nothing answers a rumor faster than letting millions watch the hands at work.',
        response: 'Cables cross the atelier before the morning shift. The enamellers work under red tally lights while viewers ask, by the thousand, what everyone brought for lunch.',
        newsHeadline: 'THE WORLD WATCHES MORROW CLOSE A LID',
        consequence: 'The stream proves the work is real and becomes the week’s most clipped craft video. It also turns a private room—and every small hesitation inside it—into content that can be replayed forever.',
        now: { cash: -4, reach: 22 }, later: { aura: -16, craft: -3, reach: 4 }, luxury: 0,
      },
      {
        id: 'witnesses', title: 'Invite three witnesses',
        body: 'Give three respected restorers the keys, the payroll, and a finished box to take apart. They may publish whatever they find, but there will be no cameras and no press team.',
        response: 'Three conservators enter after closing with cotton gloves and jeweler’s loupes. At dawn they are still comparing the clasp on a 1952 box with one finished yesterday.',
        newsHeadline: 'FOUR PAGES, THREE SIGNATURES, NO PHOTOGRAPHS',
        consequence: 'Their dry technical report confirms that each clasp is cut, fitted, and corrected by hand. Collectors quote its least flattering sentences as proof that Morrow did not write it.',
        now: { cash: -3 }, later: { aura: 11, craft: 5, reach: 2 }, luxury: 2,
      },
      {
        id: 'makers-note', title: 'Answer once, in print',
        body: 'Publish the clasp process, the tolerances, and every current maker’s mark in one sober pamphlet. Mail it to owners inside a plain paper lunch sack and make no further comment.',
        response: 'The maison releases its first technical note in seventy-five years. Owners receive exploded drawings beside a penciled note from the artisan who finished their own box.',
        newsHeadline: 'A LUNCHBOX MAKER SHOWS ITS WORK',
        consequence: 'Experts accept the evidence and the pamphlet becomes collectible in its own right. The accusation still travels farther than the correction, especially among people who have never held a Morrow.',
        now: { cash: -1 }, later: { aura: 5, craft: 2, reach: 5 }, luxury: 1,
      },
    ],
  },
  {
    title: 'Only 600 sheets remain',
    body: 'The supplier of Morrow’s midnight-blue food-safe enamel has closed. A modern composite looks identical in photographs and costs almost nothing, but the old finish is why tomato soup never tastes of metal.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'composite', title: 'Use the composite',
        body: 'Keep every promised delivery date and make the switch without ceremony. The new liner is lighter, cheaper, dishwasher-safe, and nearly impossible to distinguish on a screen.',
        response: 'Production triples and the waiting list contracts by eighteen months. Under the inspection lamps, the new interiors look flawlessly, suspiciously blue.',
        newsHeadline: 'NEW MORROWS ARRIVE EARLY—AND QUIETLY',
        consequence: 'Owners discover that the new boxes sound hollow when closed and keep coffee warm for eleven fewer minutes. Resale listings begin using the phrase “pre-composite” as if everyone had always known.',
        now: { cash: 12 }, later: { craft: -19, aura: -9, reach: 5 }, luxury: 0,
      },
      {
        id: 'serialize', title: 'Stop at 600',
        body: 'Number the remaining enamel boxes beneath the soup compartment and cancel every order after six hundred. Explain that a Morrow made from the wrong material would only be a container.',
        response: 'You cancel two-thirds of the year’s orders and return every deposit with interest. Artisans stamp a tiny number where only an owner washing the box will find it.',
        newsHeadline: 'THE SIX HUNDRED ARE ALL THERE WILL BE',
        consequence: 'The final enamel run earns a name before the first box leaves Paris. Owners use them daily anyway, arguing that a lunchbox kept empty has already failed.',
        now: { cash: -8 }, later: { aura: 13, craft: 8, cash: 5 }, luxury: 2,
      },
      {
        id: 'reformulate', title: 'Rebuild the enamel',
        body: 'Close the line and hire the supplier’s last chemist to rebuild the recipe in-house. Deliveries will be late, the first batches will fail, and the new blue may never match the old one exactly.',
        response: 'The atelier goes dark while two kilns are rebuilt around a notebook of incomplete formulas. For weeks, every test tile comes out the color of a storm at the wrong hour.',
        newsHeadline: 'MORROW MISSES CHRISTMAS TO CHASE A COLOR',
        consequence: 'Months later the finish returns, slightly warmer and entirely food-safe. Collectors call it “after-midnight blue,” while the chemist insists it is simply batch forty-three.',
        now: { cash: -12 }, later: { craft: 11, aura: 4, cash: 2 }, luxury: 1,
      },
    ],
  },
  {
    title: 'Everyone is carrying one',
    body: 'A pop star leaves a recording studio with a dented Morrow full of noodles. Searches rise nine hundred percent before breakfast, and the team has a global lunch-hour campaign ready to launch tonight.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'campaign', title: 'Own the moment',
        body: 'Buy every station screen and social placement for a week. Show the box open, packed, and perfectly lit beside the star’s new single before somebody else owns the association.',
        response: 'The Morrow crest fills airports precisely at noon in each time zone. Stylists produce six ideal lunches, none of which could survive a commute.',
        newsHeadline: 'THE MOST EXPENSIVE LUNCH BREAK ON EARTH',
        consequence: 'By Sunday the campaign is everywhere; by Tuesday it is old content. The original noodle-stained photograph remains more persuasive than the thousands of immaculate images it inspired.',
        now: { cash: -9, reach: 28 }, later: { aura: -14, reach: -5 }, luxury: 0,
      },
      {
        id: 'twelve', title: 'Invite twelve',
        body: 'Invite twelve cooks, archivists, and longtime owners to a silent supper inside the closed atelier. Everyone eats from a repaired Morrow; nobody brings a phone or receives a photograph.',
        response: 'Twelve place cards wait between the polishing benches. The oldest box at the table contains egg salad and still carries a railway repair ticket from 1976.',
        newsHeadline: 'A SUPPER THAT MAY NOT HAVE HAPPENED',
        consequence: 'One guest mentions the evening in a footnote six weeks later. Nobody can prove who attended or what was served, which only improves the story.',
        now: { cash: -4 }, later: { aura: 11, craft: 2, reach: 3 }, luxury: 2,
      },
      {
        id: 'nothing', title: 'Say nothing',
        body: 'Let the candid photograph travel on its own and refuse every request for product placement. If asked, confirm only that the atelier can repair the dent after the tour.',
        response: 'The press inbox receives one line: “We noticed the dent too.” The campaign files remain on the server, beautifully unused.',
        newsHeadline: 'THE LUNCHBOX WITH NO CAMPAIGN',
        consequence: 'The image lingers because it never becomes an advertisement. Repair requests rise, mostly from owners newly proud of the marks left by actual meals.',
        now: {}, later: { aura: 6, reach: 5 }, luxury: 1,
      },
    ],
  },
  {
    title: 'A perfect counterfeit',
    body: 'A thirty-five-dollar copy called “Tomorrow” is viral. Its dividers fit, its handle folds flat, and teenagers are packing elaborate lunches in it while the board begs for a cheaper official box.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'diffusion', title: 'Launch Morrow / Daily',
        body: 'Make a ninety-dollar stamped-steel lunchbox in twelve colors and put it beside every checkout. It will be official, practical, and available to anyone before the imitator owns the shape.',
        response: 'Retailers place the largest orders in company history. The first pallet sells out between breakfast and lunch.',
        newsHeadline: 'AT LAST, A MORROW FOR EVERYONE',
        consequence: 'The counterfeit disappears, taking the original box’s mystique with it. Within a year, most people know Morrow as the cheerful thing sold near reusable water bottles.',
        now: { cash: 21, reach: 20 }, later: { aura: -21, craft: -7 }, luxury: 0,
      },
      {
        id: 'furnace', title: 'Build a public furnace',
        body: 'Buy seized counterfeits, melt them in the flagship window, and cast the metal into one enormous communal dining table. Serve the neighborhood lunch when it is finished.',
        response: 'A black furnace appears behind the glass with no explanation. By noon, false clasps and painted handles are falling into the crucible.',
        newsHeadline: 'FAKE LUNCHBOXES BECOME A REAL TABLE',
        consequence: 'Crowds watch copies become a nameless bronze slab, then eat at it for free. The imitator remains legal and popular, but no longer feels like the same argument.',
        now: { cash: -6 }, later: { aura: 12, craft: 3, reach: 7 }, luxury: 2,
      },
      {
        id: 'registry', title: 'Create the Registry',
        body: 'Offer authentication, cleaning, and food-safe repairs for every real Morrow ever made. Give each box a brass passport recording its makers, owners, dents, and replaced dividers.',
        response: 'The first owner arrives with a 1954 box wrapped in a tea towel. Its mustard-colored liner has survived three generations of soup.',
        newsHeadline: 'MORROW BEGINS COUNTING THE SURVIVORS',
        consequence: 'Provenance becomes a useful service the counterfeit cannot copy. The registry also reveals how few owners keep their boxes pristine—and how much better they look used.',
        now: { cash: -5 }, later: { craft: 7, aura: 6, cash: 2 }, luxury: 1,
      },
    ],
  },
  {
    title: 'One client wants one hundred',
    body: 'The year’s most visible actor wants one hundred custom lunchboxes as awards-week party favors. Payment is generous, the exposure is enormous, and not one of the guests is expected to bring lunch.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'hundred', title: 'Make all one hundred',
        body: 'Accept the commission and add a discreet press clause. Give every guest the same hand-painted initials, silver dividers, and a card describing the three hundred hours of combined work.',
        response: 'The atelier works three nights beneath a confidentiality banner. The boxes leave in a refrigerated catering van without a crumb inside them.',
        newsHeadline: 'ONE HUNDRED CUSTOM BOXES, ONE HUNDRED POSTS',
        consequence: 'Every “unique” box appears online from the same angle before midnight. The commission pays beautifully and makes custom Morrow feel like an unusually elaborate gift bag.',
        now: { cash: 17, reach: 22 }, later: { aura: -15, craft: -6 }, luxury: 0,
      },
      {
        id: 'one', title: 'Make one, without a name',
        body: 'Offer a single lunchbox, fitted to the client’s favorite meal and marked only by its maker. No duplicates, no loaner for the stylist, and no photographs while it is still yours.',
        response: 'The client laughs, pauses, and agrees. Ninety-nine guests receive champagne; one box leaves through the kitchen with a warm slice of pie inside.',
        newsHeadline: 'THE PARTY FAVOR NOBODY SAW',
        consequence: 'The box is never photographed, but its absent image is discussed all week. Months later it returns for a jammed hinge and the remains of blueberry filling.',
        now: { cash: -4 }, later: { aura: 12, craft: 5, reach: 2 }, luxury: 2,
      },
      {
        id: 'auction', title: 'Make one for auction',
        body: 'Turn the commission into one benefit lot with no estimate. Pack it with the midnight meal eaten by the crew after the awards and let the public decide what the object is worth.',
        response: 'The box crosses the block still warm from the caterer’s kitchen. Bidding lasts longer than the acceptance speeches.',
        newsHeadline: 'LUNCH SELLS FOR MORE THAN A HOUSE',
        consequence: 'A record price funds thousands of school meals and reaches every front page. Several old clients call the spectacle vulgar before asking for the auction catalog.',
        now: { cash: 6, reach: 8 }, later: { aura: 5, craft: 2 }, luxury: 1,
      },
    ],
  },
  {
    title: 'The robot never slips',
    body: 'A polishing robot can match any artisan to the micron and fit three lunchbox hinges in the time it takes a master to fit one. It would halve costs, erase the waiting list, and leave no maker’s wavering line.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'automate', title: 'Automate the line',
        body: 'Give the machine every repeatable step, from sanding the handle to polishing the soup lid. Keep one artisan at the final inspection bench and double annual production immediately.',
        response: 'For the first time, every finished lid reflects the ceiling in exactly the same way. The robot completes the night shift without eating, speaking, or missing a tolerance.',
        newsHeadline: 'THE PERFECT MORROW HAS NO FINGERPRINTS',
        consequence: 'Collectors struggle to explain what is missing from the new boxes and eventually stop trying. Returns are almost nonexistent; desire becomes less reliable.',
        now: { cash: 16, reach: 7 }, later: { craft: -20, aura: -10 }, luxury: 0,
      },
      {
        id: 'assist', title: 'Give it to the artisans',
        body: 'Let each bench choose one punishing task for the robot and forbid it from making finishing decisions. It may sand hinge blanks all night; a human still decides how the lid should close.',
        response: 'The machine is assigned the jobs that injure wrists and teach nothing. Human hands keep the final polish and the tiny correction that makes each box sound different.',
        newsHeadline: 'A NEW APPRENTICE, BOLTED TO THE FLOOR',
        consequence: 'Wait time falls by months without erasing the maker’s hand. Two senior polishers postpone retirement now that the work no longer requires daily pain.',
        now: { cash: -9 }, later: { craft: 12, aura: 6, cash: 4 }, luxury: 2,
      },
      {
        id: 'secondshift', title: 'Add a second shift',
        body: 'Keep the machine unplugged and hire thirty apprentices at once. Teach the old process faster, accept small inconsistencies, and make the night atelier as busy as the day.',
        response: 'Thirty new aprons hang beside the door before dawn. The canteen begins serving two lunches and one midnight breakfast.',
        newsHeadline: 'THE ATELIER LEARNS TO WORK AFTER DARK',
        consequence: 'Output rises and so does the number of lids that need a second fitting. The old guard sees every inconsistency; most owners see the name of a new maker.',
        now: { cash: 5 }, later: { craft: -4, aura: 1 }, luxury: 1,
      },
    ],
  },
  {
    title: 'We are leaving money behind',
    body: 'Demand now exceeds supply twelve to one. The board wants either an entry-level snack box or a severe price increase, while longtime owners insist the object should still carry an ordinary sandwich.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'sleeve', title: 'Create a snack sleeve',
        body: 'Offer a slim ninety-dollar sleeve for a piece of fruit and call it a first step into Morrow. Stamp it by machine, release seasonal colors, and place it wherever people buy lunch.',
        response: 'The sleeve sells out before lunch in all fourteen markets. By dinner, owners are posting elaborate arguments about whether a granola bar counts as a meal.',
        newsHeadline: 'THE SMALLEST MORROW BECOMES THE BIGGEST',
        consequence: 'The sleeve becomes the most common Morrow object and defines the name for a generation. The original box starts to look like the expensive large version.',
        now: { cash: 20, reach: 20 }, later: { aura: -19, craft: -5 }, luxury: 0,
      },
      {
        id: 'double', title: 'Double the price',
        body: 'Double the lunchbox price and include repairs for the next seventy-five years. Every hinge, liner, handle, and divider will be restored for any future owner who keeps the box in use.',
        response: 'The new price is printed once in the smallest type. Beside it sits a promise longer than most companies have existed.',
        newsHeadline: 'A LUNCHBOX NOW COMES WITH A LIFETIME—OR THREE',
        consequence: 'Orders increase, but old boxes returning to the atelier matter more. Repair work becomes the school where apprentices learn what decades of actual lunches do to an object.',
        now: { cash: -3 }, later: { cash: 17, aura: 13, craft: 5 }, luxury: 2,
      },
      {
        id: 'hold', title: 'Hold the line',
        body: 'Change neither price nor production and continue accepting orders in person. Keep making a lunchbox expensive enough to protect the work but ordinary enough to be filled.',
        response: 'The board calls it indecision. The atelier packs its midday meal and calls it Tuesday.',
        newsHeadline: 'NO NEW PRICE, NO NEW PRODUCT, NO APOLOGY',
        consequence: 'The waiting list lengthens and speculators complain about money left on the table. The promise remains legible to the owners who simply carry lunch.',
        now: { cash: 3 }, later: { aura: 4, craft: 1 }, luxury: 1,
      },
    ],
  },
  {
    title: 'Who owns the next 75 years?',
    body: 'A conglomerate offers a fortune for Maison Morrow and plans lunchbox boutiques in every capital. Staying independent means spending nearly everything to buy back the distributor that controls your doors.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'sell', title: 'Accept the offer',
        body: 'Take the nine-zero offer, secure every employee’s pension, and let a global group carry Morrow into the next century. Their scale can put the box wherever ambitious people eat.',
        response: 'The signatures are quick and the number is difficult to read without commas. The new owners serve lunch from unopened commemorative boxes.',
        newsHeadline: 'MORROW JOINS THE WORLD’S LARGEST LUXURY FAMILY',
        consequence: 'The maison survives everywhere, owned by people who never waited for one. Airport editions multiply, repairs become a subscription, and revenue has never looked healthier.',
        now: { cash: 38, reach: 18 }, later: { aura: -28, craft: -12 }, luxury: 0,
      },
      {
        id: 'buyback', title: 'Buy back every door',
        body: 'Empty the reserve to buy the distributor and close half its stores. From now on, each lunchbox must pass directly from an artisan or restorer to the person who will carry it.',
        response: 'The reserve account empties by midnight. By morning, fifty-seven retail contracts are being folded into paper liners for the staff meal.',
        newsHeadline: 'MORROW SPENDS A FORTUNE TO BECOME SMALLER',
        consequence: 'Every future box has a known first owner and no middleman. The remaining salons become repair counters with kitchens instead of traditional stores.',
        now: { cash: -24 }, later: { aura: 16, craft: 7, cash: 6 }, luxury: 2,
      },
      {
        id: 'trust', title: 'Place the maison in trust',
        body: 'Refuse both sale and expansion, then give up the family’s right to sell forever. A charter will protect the atelier, the repair promise, and the rule that every box must remain food-safe.',
        response: 'The family signs away its most valuable inheritance in a room with no buyer. The charter’s final clause requires directors to eat from a Morrow once a year.',
        newsHeadline: 'THE COMPANY THAT CAN NO LONGER BE SOLD',
        consequence: 'The trust begins with less cash and no exit. It gains a purpose simple enough for the next custodian to understand: make the object useful, repairable, and rare.',
        now: { cash: -9 }, later: { aura: 11, craft: 13 }, luxury: 2,
      },
    ],
  },
  {
    title: 'A child’s lunch comes home warm',
    body: 'A hidden seal has failed in twelve thousand recent boxes. No one is ill, but food can drift into the insulated wall and spoil unseen. Every remedy will frighten owners, cost a season, or leave a dangerous doubt.',
    timeoutChoice: 2,
    choices: [
      {
        id: 'recall', title: 'Recall every box',
        body: 'Ask all twelve thousand owners to stop using their lunchboxes today. Replace the liner, test every cavity, reimburse every spoiled meal, and publish the failed supplier lot yourself.',
        response: 'The atelier phone rings without pause as red return cases leave Paris. Artisans open perfect boxes beside stained ones because serial numbers, not appearances, decide what comes back.',
        newsHeadline: 'MORROW RECALLS A YEAR OF LUNCHES',
        consequence: 'The recall devours the season and exposes an ugly failure in full. Owners remember that the maison called before anyone got sick—and that every returned box came home safer.',
        now: { cash: -18, reach: 8 }, later: { cash: -2, aura: 4, craft: 7 }, luxury: 2,
      },
      {
        id: 'field-repair', title: 'Repair them at home',
        body: 'Send a fitted insert and book a restorer to visit each owner’s kitchen. The lunchbox never leaves their sight, but the hidden wall remains in place beneath the safer compartment.',
        response: 'Restorers begin crossing cities with blue tool rolls and food thermometers. The first appointment takes three hours and ends with the owner serving soup.',
        newsHeadline: 'THE REPAIR BENCH COMES TO THE KITCHEN',
        consequence: 'Most boxes are made safe without a public spectacle, though some owners dislike a fix they cannot inspect. Quiet forum threads preserve the question long after the appointments end.',
        now: { cash: -8 }, later: { aura: -5, craft: 2 }, luxury: 1,
      },
      {
        id: 'instructions', title: 'Issue new instructions',
        body: 'Describe the risk as improper cleaning and tell owners not to submerge the box. Replace only units with visible seepage, preserving the reserve and the year’s production schedule.',
        response: 'A carefully worded care email arrives between breakfast and lunch. Lawyers remove the sentence that says the liner was designed to be submerged.',
        newsHeadline: 'OWNERS BLAMED FOR WASHING A LUNCHBOX',
        consequence: 'The defect eventually appears in a school safety test with the email attached. The money saved this season is spent answering a much harsher question the next one.',
        now: { cash: 2, reach: 10 }, later: { cash: -5, aura: -17, craft: -9 }, luxury: 0,
      },
    ],
  },
  {
    title: 'The public schools want the blueprint',
    body: 'A school district wants Morrow’s heat-locking divider for ordinary cafeteria boxes. The patent is valuable, but any version of this project could keep thousands of lunches crisp, warm, and safely separated.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'open-patent', title: 'Release the patent',
        body: 'Publish the divider geometry and food-safety tests for any manufacturer to use without a fee. Keep only the Morrow name private and invite engineers to improve the design in public.',
        response: 'The drawings go online before the lawyers can add a license. By afternoon, three factories have resized the divider for the boxes already used in local schools.',
        newsHeadline: 'A SECRET COMPARTMENT BECOMES PUBLIC PROPERTY',
        consequence: 'Millions of inexpensive lunchboxes improve within a year, including your cheapest imitator. Morrow earns no royalty and becomes the footnote attached to a genuinely useful standard.',
        now: { cash: -4, reach: 10 }, later: { aura: 7, craft: 4 }, luxury: 2,
      },
      {
        id: 'cafeterias', title: 'Build the school kitchens',
        body: 'Keep the patent but fund three cafeteria workshops where students, cooks, and Morrow artisans redesign the entire lunch system together. Start with the food, then make the box fit it.',
        response: 'Enamellers sit beside cafeteria cooks measuring ladles, steam tables, and small hands. The first prototype is bright orange and bears no crest.',
        newsHeadline: 'MORROW GOES BACK TO SCHOOL WITHOUT ITS NAME',
        consequence: 'The workshops produce better dividers and better menus, then share both freely with the district. The project is slower and smaller than a patent release, but every improvement has been tested at lunch.',
        now: { cash: -8, reach: 8 }, later: { aura: 9, craft: 2 }, luxury: 2,
      },
      {
        id: 'academy', title: 'License it through an academy',
        body: 'Charge large manufacturers a modest royalty and use every payment to train school-kitchen apprentices. The blueprint spreads, the patent earns, and the program can continue without donations.',
        response: 'The first license and first apprenticeship are signed at the same cafeteria table. A mass-market factory engineer stays to eat with the students.',
        newsHeadline: 'THE DIVIDER THAT PAYS FOR COOKS',
        consequence: 'Royalties fund a durable training program and improve boxes across the market. Purists call the licensing ordinary; families mostly notice that berries no longer taste like pasta.',
        now: { cash: 6, reach: 4 }, later: { aura: 3, craft: 6 }, luxury: 1,
      },
    ],
  },
  {
    title: 'The museum wants it empty',
    body: 'The national design museum offers the Morrow lunchbox a permanent white plinth. It wants an untouched anniversary example, displayed open and empty under glass, to represent “the elevation of the everyday.”',
    timeoutChoice: 0,
    choices: [
      {
        id: 'museum-edition', title: 'Make the perfect example',
        body: 'Create one flawless box for the collection with a mirror finish, invisible maker’s marks, and dividers that will never touch food. Treat the commission as the atelier’s final examination.',
        response: 'Six masters spend four months eliminating every tremor from an object no one will carry. White gloves close the lid for the last time.',
        newsHeadline: 'A PERFECT LUNCHBOX THAT WILL NEVER HOLD LUNCH',
        consequence: 'Critics praise the finish and apprentices study its tolerances in photographs. Owners find the sterile perfection less moving than the scratched boxes they wash each night.',
        now: { cash: -10 }, later: { craft: 10, aura: -2 }, luxury: 1,
      },
      {
        id: 'founders-box', title: 'Lend the founder’s box',
        body: 'Send the dented 1949 prototype, complete with soldered handle, mustard stain, and the handwritten repair dates beneath its tray. Require the museum to display what its owners actually packed.',
        response: 'The registrar hesitates over a dark stain that no conservator has been allowed to remove. This month’s display lunch is bread, apple, and Comté.',
        newsHeadline: 'MUSEUM ACQUIRES SEVENTY-FIVE YEARS OF CRUMBS',
        consequence: 'Visitors lean close to read the repair marks and argue about the stain. The box returns to the family table one week each year, leaving an empty plinth behind.',
        now: { cash: -3 }, later: { aura: 12, craft: 5, reach: 5 }, luxury: 2,
      },
      {
        id: 'refuse-museum', title: 'Refuse the plinth',
        body: 'Tell the museum that a lunchbox is not alive beneath glass and offer a free repair clinic instead. If it wants a Morrow, the curator must carry one to work for a year.',
        response: 'The loan agreement comes back unsigned with a repair appointment clipped to it. The curator chooses a battered green box from the teaching shelf.',
        newsHeadline: 'MORROW TELLS THE MUSEUM TO PACK LUNCH',
        consequence: 'The empty display is quietly canceled, but the curator’s yearlong diary becomes a small exhibition about use. Some trustees admire the refusal; others simply acquire a different brand.',
        now: {}, later: { aura: 7, craft: 2 }, luxury: 2,
      },
    ],
  },
  {
    title: 'What belongs in the anniversary box?',
    body: 'For the final seventy-fifth-year object, the atelier agrees to make exactly one lunchbox. The shell is finished and the inside is blank. What you place in it will become the message of your tenure.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'chef-menus', title: 'Commission seventy-five chefs',
        body: 'Publish a lavish book of impossible lunches from the world’s most famous chefs and pack the first menu inside. Auction the box on a global broadcast with every contributor present.',
        response: 'The finished book weighs more than the lunchbox and cannot fit without removing a divider. The broadcast director requests three identical backup meals.',
        newsHeadline: 'SEVENTY-FIVE CHEFS FILL ONE VERY SMALL BOX',
        consequence: 'The spectacle raises a fortune and dominates culture pages for a week. Almost nobody cooks from the book, and the single box spends its life traveling empty between events.',
        now: { cash: 14, reach: 18 }, later: { aura: -8, craft: -2 }, luxury: 0,
      },
      {
        id: 'makers-lunch', title: 'Pack the makers’ lunch',
        body: 'Ask every atelier worker to contribute one small thing they actually eat on shift. Fit the shared meal into the dividers, close the lid, and give the box to the youngest apprentice.',
        response: 'Thirty-seven contributions somehow fit: bread heels, olives, dumplings, two chocolates, and a clementine peeled in one long spiral. The apprentice misses the first speech because she is eating.',
        newsHeadline: 'THE LAST BOX GOES TO THE FIRST DAY',
        consequence: 'There is no auction and only one hurried photograph. Years later the apprentice, now a master, still uses the box and can name who packed every compartment.',
        now: { cash: -3 }, later: { aura: 13, craft: 11 }, luxury: 2,
      },
      {
        id: 'open-table', title: 'Leave one compartment open',
        body: 'Pack a simple founder’s lunch but leave the smallest compartment empty for the next custodian. Record no instructions beyond the date and the names of everyone currently at the atelier.',
        response: 'Bread, apple, and cheese fill three spaces. The fourth holds only the smell of fresh enamel and a folded list of names.',
        newsHeadline: 'MORROW LEAVES ROOM FOR WHAT COMES NEXT',
        consequence: 'The anniversary box enters the archive unfinished by design. Each future custodian may add one meal and one repair, but nobody may fill the final compartment permanently.',
        now: { cash: -1 }, later: { aura: 10, craft: 7 }, luxury: 2,
      },
    ],
  },
]

export function addDelta(metrics: Metrics, delta: Delta): Metrics {
  return {
    aura: clamp(metrics.aura + (delta.aura ?? 0)),
    craft: clamp(metrics.craft + (delta.craft ?? 0)),
    cash: Math.max(-99, Math.min(199, metrics.cash + (delta.cash ?? 0))),
    reach: clamp(metrics.reach + (delta.reach ?? 0)),
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

export type Decision = { crisisIndex: number; choiceIndex: number }

export function combineDeltas(deltas: Delta[]): Delta {
  return deltas.reduce<Delta>((total, delta) => {
    for (const key of Object.keys(delta) as (keyof Metrics)[]) {
      total[key] = (total[key] ?? 0) + (delta[key] ?? 0)
    }
    return total
  }, {})
}

export function applyDecisionPhase(metrics: Metrics, decisions: Decision[], phase: 'now' | 'later') {
  return addDelta(metrics, combineDeltas(decisions.map(({ crisisIndex, choiceIndex }) => (
    CRISES[crisisIndex].choices[choiceIndex][phase]
  ))))
}

export function playStrategy(choiceIndices: number[]) {
  let metrics = { ...INITIAL_METRICS }
  let luxury = 0

  DECISION_ROUNDS.forEach(round => {
    const decisions = round.crisisIndices.map(crisisIndex => ({
      crisisIndex,
      choiceIndex: choiceIndices[crisisIndex] ?? CRISES[crisisIndex].timeoutChoice,
    }))
    metrics = applyDecisionPhase(metrics, decisions, 'now')
    luxury += decisions.reduce((score, { crisisIndex, choiceIndex }) => score + CRISES[crisisIndex].choices[choiceIndex].luxury, 0)
    metrics = applyDecisionPhase(metrics, decisions, 'later')
  })

  return { metrics, luxury, result: evaluate(metrics, luxury) }
}

export function evaluate(metrics: Metrics, luxury: number) {
  if (metrics.cash < 0) return 'insolvent' as const
  if (metrics.aura >= 78 && metrics.craft >= 70 && luxury >= 17) return 'icon' as const
  if (metrics.aura >= 66 && metrics.craft >= 60 && luxury >= 15) return 'independent' as const
  return 'ordinary' as const
}

export type CompanyStatus = 'bad' | 'okay' | 'good'

export function getCompanyStatus(metrics: Metrics): CompanyStatus {
  const integrity = (metrics.aura + metrics.craft) / 2
  if (metrics.cash < 12 || integrity < 48) return 'bad'
  if (metrics.cash >= 20 && integrity >= 72) return 'good'
  return 'okay'
}

export function deltaLabel(delta: Delta) {
  const entries = (Object.entries(delta) as [keyof Metrics, number][]).filter(([, value]) => value !== 0)
  return entries.map(([key, value]) => `${key === 'cash' ? '$' : key === 'reach' ? 'noise' : key} ${value > 0 ? '+' : ''}${value}`).join('  ·  ')
}
