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
  detail: string
  response: string
  consequence: string
  now: Delta
  later: Delta
  luxury: 0 | 1 | 2
}

export type Crisis = {
  quarter: string
  source: string
  headline: string
  brief: string
  note: string
  choices: [Choice, Choice, Choice]
  timeoutChoice: number
}

export const INITIAL_METRICS: Metrics = { aura: 62, craft: 64, cash: 24, reach: 18 }

export const CRISES: Crisis[] = [
  {
    quarter: 'I · THE LEDGER',
    source: 'Finance director',
    headline: 'The empty order book',
    brief: 'Our bank wants reassurance by Friday. HyperMart offers cash now for 40,000 lunchboxes bearing our crest.',
    note: 'VOLUME IS NOT DEMAND.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'hypermart', title: 'License the crest', detail: 'Take the 40,000-unit order.', luxury: 0,
        response: 'The board applauds the first large order in years.', consequence: 'Within weeks, the crest is seen in every clearance aisle.',
        now: { cash: 24, reach: 22 }, later: { aura: -20, craft: -5 },
      },
      {
        id: 'salon', title: 'Open a private salon', detail: 'Invite 80 collectors to place deposits.', luxury: 2,
        response: 'Seventy-three handwritten invitations leave the atelier.', consequence: 'A waiting list appears before a single box does.',
        now: { cash: 7 }, later: { aura: 10, craft: 2, cash: 4 },
      },
      {
        id: 'bridge', title: 'Take the bridge loan', detail: 'Keep production unchanged and borrow.', luxury: 1,
        response: 'The bank buys you a season. No one outside this room knows.', consequence: 'Interest bites, but the maison remains unobserved.',
        now: { cash: 13 }, later: { cash: -7, aura: 1 },
      },
    ],
  },
  {
    quarter: 'II · THE WORKSHOP',
    source: 'Master enameller',
    headline: 'Only 600 sheets remain',
    brief: 'Our midnight enamel supplier has closed. A modern composite looks identical in photographs and costs almost nothing.',
    note: 'THE OBJECT MUST SURVIVE THE STORY.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'composite', title: 'Use the composite', detail: 'Keep every delivery date.', luxury: 0,
        response: 'Production triples. The finish passes inspection under studio lights.', consequence: 'Owners notice that the new boxes sound hollow when closed.',
        now: { cash: 12 }, later: { craft: -19, aura: -9, reach: 5 },
      },
      {
        id: 'serialize', title: 'Stop at 600', detail: 'Number each remaining enamel box.', luxury: 2,
        response: 'You cancel two-thirds of the year’s orders.', consequence: 'The final enamel run becomes known simply as “The Six Hundred.”',
        now: { cash: -8 }, later: { aura: 13, craft: 8, cash: 5 },
      },
      {
        id: 'reformulate', title: 'Rebuild the enamel', detail: 'Fund a slower in-house formula.', luxury: 1,
        response: 'The atelier goes dark while the kilns are refitted.', consequence: 'Months later, the finish returns—slightly warmer, entirely yours.',
        now: { cash: -12 }, later: { craft: 11, aura: 4, cash: 2 },
      },
    ],
  },
  {
    quarter: 'III · THE FEED',
    source: 'Communications director',
    headline: 'Everyone is talking',
    brief: 'A pop star was photographed carrying a Morrow. Searches are up 900%. The team has a global campaign ready to launch tonight.',
    note: 'ATTENTION IS CHEAP. ACCESS IS NOT.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'campaign', title: 'Own the moment', detail: 'Buy every screen for a week.', luxury: 0,
        response: 'The Morrow crest fills stations, feeds, and airports.', consequence: 'By Sunday it has become content; by Tuesday, old content.',
        now: { cash: -9, reach: 28 }, later: { aura: -14, reach: -5 },
      },
      {
        id: 'twelve', title: 'Invite twelve', detail: 'Host a silent supper for archivists.', luxury: 2,
        response: 'No phones. No press wall. Twelve place cards.', consequence: 'Nobody can prove the supper happened, which only improves the story.',
        now: { cash: -4 }, later: { aura: 11, craft: 2, reach: 3 },
      },
      {
        id: 'nothing', title: 'Say nothing', detail: 'Let the photograph travel alone.', luxury: 1,
        response: 'The press inbox receives one line: “We noticed too.”', consequence: 'The image lingers without ever becoming an advertisement.',
        now: {}, later: { aura: 6, reach: 5 },
      },
    ],
  },
  {
    quarter: 'IV · THE IMITATION',
    source: 'General counsel',
    headline: 'A perfect counterfeit',
    brief: 'A $35 copy called “Tomorrow” is going viral. The board wants a cheaper official line before imitators own the shape.',
    note: 'DO NOT COMPETE DOWNHILL.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'diffusion', title: 'Launch Morrow / Daily', detail: 'A $90 box for everyone.', luxury: 0,
        response: 'Retailers place the largest orders in company history.', consequence: 'The copy disappears—and takes the original’s mystique with it.',
        now: { cash: 21, reach: 20 }, later: { aura: -21, craft: -7 },
      },
      {
        id: 'furnace', title: 'Build a public furnace', detail: 'Melt every seized copy into one sculpture.', luxury: 2,
        response: 'A black furnace is installed in the flagship window.', consequence: 'Crowds gather to watch false crests become a nameless bronze mass.',
        now: { cash: -6 }, later: { aura: 12, craft: 3, reach: 7 },
      },
      {
        id: 'registry', title: 'Create the Registry', detail: 'Authenticate and repair every real Morrow.', luxury: 1,
        response: 'Owners receive a brass passport tied to the atelier ledger.', consequence: 'Provenance becomes a service the counterfeit cannot copy.',
        now: { cash: -5 }, later: { craft: 7, aura: 6, cash: 2 },
      },
    ],
  },
  {
    quarter: 'V · THE REQUEST',
    source: 'Private client director',
    headline: 'One client, one hundred gifts',
    brief: 'The year’s most visible actor wants one hundred custom boxes for an awards-week party. Payment is generous. So is the exposure.',
    note: 'A CLIENT IS NOT A BILLBOARD.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'hundred', title: 'Make all one hundred', detail: 'Add a discreet press clause.', luxury: 0,
        response: 'The atelier works three nights beneath a confidentiality banner.', consequence: 'One hundred identical “custom” boxes appear in one hundred posts.',
        now: { cash: 17, reach: 22 }, later: { aura: -15, craft: -6 },
      },
      {
        id: 'one', title: 'Make one, without a name', detail: 'No photographs. No duplicates.', luxury: 2,
        response: 'The client laughs, then agrees. Ninety-nine guests receive champagne.', consequence: 'The single box is never photographed. It is discussed all week.',
        now: { cash: -4 }, later: { aura: 12, craft: 5, reach: 2 },
      },
      {
        id: 'auction', title: 'Make one for auction', detail: 'Let the public set its value.', luxury: 1,
        response: 'The commission becomes a benefit lot with no estimate.', consequence: 'A record price makes headlines; some old clients call it vulgar.',
        now: { cash: 6, reach: 8 }, later: { aura: 5, craft: 2 },
      },
    ],
  },
  {
    quarter: 'VI · THE MACHINE',
    source: 'Operations chief',
    headline: 'The robot never slips',
    brief: 'A polishing robot can match our artisans to the micron. It would halve costs and erase the four-year waiting list.',
    note: 'TIME IS AN INGREDIENT.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'automate', title: 'Automate the line', detail: 'Perfect polish, twice the output.', luxury: 0,
        response: 'For the first time, every finished lid is exactly alike.', consequence: 'Collectors struggle to explain what has gone missing. They stop trying.',
        now: { cash: 16, reach: 7 }, later: { craft: -20, aura: -10 },
      },
      {
        id: 'assist', title: 'Give it to the artisans', detail: 'Let each bench choose one task to automate.', luxury: 2,
        response: 'The machine sands hinges. Human hands keep the final polish.', consequence: 'Wait time falls by months, while every lid still carries its maker.',
        now: { cash: -9 }, later: { craft: 12, aura: 6, cash: 4 },
      },
      {
        id: 'secondshift', title: 'Add a second shift', detail: 'Train quickly; change nothing else.', luxury: 1,
        response: 'Thirty apprentices arrive before dawn.', consequence: 'Output rises, along with small inconsistencies the old guard can see.',
        now: { cash: 5 }, later: { craft: -4, aura: 1 },
      },
    ],
  },
  {
    quarter: 'VII · THE PRICE',
    source: 'Supervisory board',
    headline: 'We are leaving money behind',
    brief: 'Demand now exceeds supply twelve to one. The board proposes a simple choice: create an entry product, or raise the price.',
    note: 'PRICE MUST PROTECT THE PROMISE.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'sleeve', title: 'Create a snack sleeve', detail: 'An accessible first step into Morrow.', luxury: 0,
        response: 'The sleeve sells out before lunch.', consequence: 'It becomes the most common Morrow object—and defines the name.',
        now: { cash: 20, reach: 20 }, later: { aura: -19, craft: -5 },
      },
      {
        id: 'double', title: 'Double the price', detail: 'Include repairs for the next 75 years.', luxury: 2,
        response: 'The new price is printed once, in the smallest type.', consequence: 'Orders increase. More importantly, old boxes return to the atelier.',
        now: { cash: -3 }, later: { cash: 17, aura: 13, craft: 5 },
      },
      {
        id: 'hold', title: 'Hold the line', detail: 'Change neither price nor production.', luxury: 1,
        response: 'The board calls it indecision. The atelier calls it Tuesday.', consequence: 'The waiting list lengthens, but the promise remains legible.',
        now: { cash: 3 }, later: { aura: 4, craft: 1 },
      },
    ],
  },
  {
    quarter: 'VIII · THE FUTURE',
    source: 'Chairman emeritus',
    headline: 'Who owns the next 75 years?',
    brief: 'A conglomerate offers a fortune for Maison Morrow. Or we can spend nearly everything to secure its independence.',
    note: 'THE MAISON MUST OUTLIVE YOU.',
    timeoutChoice: 0,
    choices: [
      {
        id: 'sell', title: 'Accept the offer', detail: 'Turn heritage into shareholder value.', luxury: 0,
        response: 'The signatures are quick. The number has nine zeroes.', consequence: 'Morrow survives everywhere, owned by people who never waited for one.',
        now: { cash: 38, reach: 18 }, later: { aura: -28, craft: -12 },
      },
      {
        id: 'buyback', title: 'Buy back the distributor', detail: 'Control every door, at any cost.', luxury: 2,
        response: 'The reserve account empties by midnight.', consequence: 'Every future Morrow will pass from an artisan to an owner—no middleman.',
        now: { cash: -24 }, later: { aura: 16, craft: 7, cash: 6 },
      },
      {
        id: 'trust', title: 'Place the maison in trust', detail: 'No sale. No heirs. One charter.', luxury: 2,
        response: 'The family gives up its right to sell the company.', consequence: 'The charter names craft, restraint, and another seventy-five years.',
        now: { cash: -9 }, later: { aura: 11, craft: 13 },
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

export function playStrategy(choiceIndices: number[]) {
  let metrics = { ...INITIAL_METRICS }
  let luxury = 0
  CRISES.forEach((crisis, index) => {
    const choice = crisis.choices[choiceIndices[index] ?? crisis.timeoutChoice]
    metrics = addDelta(addDelta(metrics, choice.now), choice.later)
    luxury += choice.luxury
  })
  return { metrics, luxury, result: evaluate(metrics, luxury) }
}

export function evaluate(metrics: Metrics, luxury: number) {
  if (metrics.cash < 0) return 'insolvent' as const
  if (metrics.aura >= 78 && metrics.craft >= 68 && luxury >= 11) return 'icon' as const
  if (metrics.aura >= 66 && metrics.craft >= 60 && luxury >= 10) return 'independent' as const
  return 'ordinary' as const
}

export function deltaLabel(delta: Delta) {
  const entries = (Object.entries(delta) as [keyof Metrics, number][]).filter(([, value]) => value !== 0)
  return entries.map(([key, value]) => `${key === 'cash' ? '$' : key === 'reach' ? 'noise' : key} ${value > 0 ? '+' : ''}${value}`).join('  ·  ')
}
