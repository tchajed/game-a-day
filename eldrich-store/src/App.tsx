import { useEffect, useMemo, useRef, useState } from 'react'

type StatKey = 'till' | 'morale' | 'veil'
type Stats = Record<StatKey, number>
type Scene = 'market' | 'interview' | 'shop' | 'review'
type Character = 'balthazar' | 'hector' | 'brindle' | 'calyx' | 'nix' | 'customer'

type Choice = {
  label: string
  note: string
  effects: Partial<Stats>
  reply: string
  stamp: string
}

type Decision = {
  id: string
  number: string
  speaker: string
  role: string
  character: Character
  item: string
  dialogue: string
  detail: string
  choices: Choice[]
}

const INITIAL_STATS: Stats = { till: 5, morale: 5, veil: 5 }

const interviewAnswers = [
  {
    label: 'I worked nights at a pharmacy.',
    reply: 'Night retail is useful. People behave differently after midnight.',
  },
  {
    label: 'I learn quickly.',
    reply: 'You may have to. The stock changes often.',
  },
  {
    label: 'I found the door, didn’t I?',
    reply: 'Yes. It doesn’t let every applicant in.',
  },
]

const decisions: Decision[] = [
  {
    id: 'returns',
    number: '01',
    speaker: 'Hector',
    role: 'Gargoyle · Returns Desk',
    character: 'hector',
    item: 'PRE-OWNED PROPHECY',
    dialogue: 'A customer has brought back this prophecy. They say the outcome was unsatisfactory. It was, however, accurate.',
    detail: 'The receipt appears in the right light. The returns policy does not mention divination.',
    choices: [
      {
        label: 'Approve the refund',
        note: 'Keep the customer, absorb the cost',
        effects: { till: -2, morale: 1, veil: 1 },
        reply: 'I’ll record it as unopened. We should keep it covered until the tense settles.',
        stamp: 'REFUND APPROVED',
      },
      {
        label: 'Offer store credit',
        note: 'A smaller loss with a time limit',
        effects: { till: -1, morale: 1 },
        reply: 'I’ll issue the credit. The date field has already filled itself in.',
        stamp: 'CREDIT ISSUED',
      },
      {
        label: 'Enforce final sale',
        note: 'Protect the margin, risk a complaint',
        effects: { till: 2, morale: -1, veil: -1 },
        reply: 'Very well. They asked for your full name before leaving.',
        stamp: 'RETURN DENIED',
      },
    ],
  },
  {
    id: 'breaks',
    number: '02',
    speaker: 'Brindle',
    role: 'Werewolf · Stock Associate',
    character: 'brindle',
    item: 'BREAK ROTA',
    dialogue: 'My break is scheduled for moonrise. I can stay on the floor, but I would rather not be around customers then.',
    detail: 'Cover is thin for twelve minutes. There is an old mannequin in the stockroom.',
    choices: [
      {
        label: 'Cover the floor yourself',
        note: 'Reduce coverage, support the team',
        effects: { till: -1, morale: 2 },
        reply: 'Thank you. The fitting rooms should remain closed while I’m away.',
        stamp: 'BREAK COVERED',
      },
      {
        label: 'Put a mannequin on till',
        note: 'Maintain coverage, accept the risk',
        effects: { till: 1, morale: 1, veil: -2 },
        reply: 'I’ll bring it down. It has used the till before, according to the log.',
        stamp: 'TEMP ASSIGNED',
      },
      {
        label: 'Deny the request',
        note: 'Keep coverage, strain the team',
        effects: { till: 2, morale: -2 },
        reply: 'Understood. I’ll remain in the stockroom for the worst of it.',
        stamp: 'REQUEST DENIED',
      },
    ],
  },
  {
    id: 'display',
    number: '03',
    speaker: 'Calyx',
    role: 'Mothkin · Visual Merchandising',
    character: 'calyx',
    item: 'WHISPER CANDLES',
    dialogue: 'The Whisper Candles sell better by the entrance. Some customers say they hear familiar names as they pass.',
    detail: 'Sales have risen since the move. There is condensation on the inside of the front window.',
    choices: [
      {
        label: 'Keep the display',
        note: 'Keep the sales lift and the exposure',
        effects: { till: 2, veil: -2 },
        reply: 'I’ll leave them where they are and lower the display lighting.',
        stamp: 'DISPLAY KEPT',
      },
      {
        label: 'Move them behind glass',
        note: 'Trade some sales for containment',
        effects: { till: 1, veil: 1 },
        reply: 'I’ll use the cabinet glass. It muffles most of the names.',
        stamp: 'DISPLAY MOVED',
      },
      {
        label: 'Pull them from sale',
        note: 'Protect the floor, miss the target',
        effects: { till: -2, morale: 1, veil: 2 },
        reply: 'I’ll extinguish them and return the display to storage.',
        stamp: 'STOCK RECALLED',
      },
    ],
  },
  {
    id: 'invoice',
    number: '04',
    speaker: 'Balthazar',
    role: 'Demon · Proprietor',
    character: 'balthazar',
    item: 'SUPPLIER INVOICE',
    dialogue: 'The screaming kettles are nearly sold out. The supplier offers a bulk rate, payable in cash or one fond memory per unit.',
    detail: 'A larger order would meet the quarterly target. The contract treats both forms of payment as equivalent.',
    choices: [
      {
        label: 'Pay cash for a small order',
        note: 'Limit the risk and the margin',
        effects: { till: -2, morale: 1, veil: 1 },
        reply: 'A small order, then. I’ll amend the forecast.',
        stamp: 'ORDER: SMALL',
      },
      {
        label: 'Trade your own memory',
        note: 'Preserve cash, give up something personal',
        effects: { till: 2, morale: 1, veil: -1 },
        reply: 'The supplier has accepted. You may notice a gap later.',
        stamp: 'MEMORY TENDERED',
      },
      {
        label: 'Ask staff to contribute',
        note: 'Maximize margin, burden the staff',
        effects: { till: 3, morale: -3, veil: -1 },
        reply: 'I’ll pass the jar around before closing. Quietly.',
        stamp: 'COST DISTRIBUTED',
      },
    ],
  },
  {
    id: 'closing',
    number: '05',
    speaker: 'Nix',
    role: 'Kelpie · Closing Supervisor',
    character: 'nix',
    item: 'AFTER-HOURS SALE',
    dialogue: 'There is a customer outside asking for the Last Umbrella. They have seven years of good luck. It costs ten.',
    detail: 'We closed four minutes ago. I cannot see their face from here.',
    choices: [
      {
        label: 'Honor the discount',
        note: 'Make the sale below the listed price',
        effects: { till: 1, morale: -1, veil: -1 },
        reply: 'I’ll let them in. Stand back while I unlock the door.',
        stamp: 'DISCOUNT HONORED',
      },
      {
        label: 'Hold it until tomorrow',
        note: 'Offer service without reopening',
        effects: { morale: 2, veil: 1 },
        reply: 'I’ll write a hold slip. They can give me a name tomorrow.',
        stamp: 'ITEM HELD',
      },
      {
        label: 'Close on time',
        note: 'Protect closing time, lose the sale',
        effects: { till: -1, morale: 1, veil: 2 },
        reply: 'All right. They seem to have gone.',
        stamp: 'DOORS LOCKED',
      },
    ],
  },
]

const statInfo: Record<StatKey, { label: string; icon: string }> = {
  till: { label: 'Till', icon: '◈' },
  morale: { label: 'Staff', icon: '✦' },
  veil: { label: 'Veil', icon: '◉' },
}

function clamp(value: number) {
  return Math.max(0, Math.min(10, value))
}

const characterNames: Record<Character, string> = {
  balthazar: 'Balthazar',
  hector: 'Hector',
  brindle: 'Brindle',
  calyx: 'Calyx',
  nix: 'Nix',
  customer: 'Customer',
}

const characterJobs: Record<Character, string> = {
  balthazar: 'Proprietor',
  hector: 'Returns Desk',
  brindle: 'Stock Associate',
  calyx: 'Visual Merchandising',
  nix: 'Closing Supervisor',
  customer: 'Customer',
}

function CharacterPortrait({ type, speaking = false }: { type: Character; speaking?: boolean }) {
  return (
    <div className={`portrait portrait--${type} ${speaking ? 'is-speaking' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 320 420" role="img">
        <defs>
          <linearGradient id={`coat-${type}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#49376b" />
            <stop offset=".55" stopColor="#2b2449" />
            <stop offset="1" stopColor="#141127" />
          </linearGradient>
          <radialGradient id={`iris-${type}`} cx="40%" cy="35%">
            <stop stopColor="#fff6a8" />
            <stop offset=".35" stopColor="#ffd85c" />
            <stop offset="1" stopColor="#9c5d2f" />
          </radialGradient>
          <filter id={`glow-${type}`}><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        {type === 'balthazar' && <>
          <path className="horn" d="M114 99C57 78 54 21 79 4c-3 38 26 48 69 46Z"/><path className="horn" d="M206 99c57-21 60-78 35-95 3 38-26 48-69 46Z"/>
          <path className="horn-ridge" d="M101 76 76 56m44 8L91 38m128 38 25-20m-44 8 29-26"/>
          <path className="demon-ear" d="m101 127-36-13 33 38m121-25 36-13-33 38"/>
        </>}
        {type === 'hector' && <>
          <path className="ear" d="m92 116-66-69 88 18Z"/><path className="ear" d="m228 116 66-69-88 18Z"/>
          <path className="ear-inner" d="M83 91 45 59l56 15m136 17 38-32-56 15"/>
        </>}
        {type === 'brindle' && <>
          <path className="ear" d="m96 106 8-94 57 72Z"/><path className="ear" d="m224 106-8-94-57 72Z"/>
          <path className="ear-inner" d="m109 76 2-45 29 46m71-1-2-45-29 46"/>
          <path className="fur-outline" d="m104 187-19 17 19 6-12 21 24-4m100-40 19 17-19 6 12 21-24-4"/>
        </>}
        {type === 'calyx' && <>
          <path className="wing wing-left" d="M130 124C54 54 9 80 20 189c8 82 74 96 126 49Z"/><path className="wing wing-right" d="M190 124c76-70 121-44 110 65-8 82-74 96-126 49Z"/>
          <path className="wing-vein" d="M129 128 36 102m99 58-101 46m106-15-71 56m122-119 93-26m-99 58 101 46m-106-15 71 56"/>
          <path className="wing-spot" d="M55 120c18-17 45-8 56 15-20 11-43 5-56-15Zm210 0c-18-17-45-8-56 15 20 11 43 5 56-15Z"/>
          <path className="antenna" d="M140 84C111 38 112 19 86 12M180 84c29-46 28-65 54-72"/>
          <circle className="antenna-tip" cx="85" cy="12" r="8"/><circle className="antenna-tip" cx="235" cy="12" r="8"/>
        </>}
        {type === 'nix' && <>
          <path className="mane" d="M83 104C30 124 52 178 18 202c42 19 11 73 73 79l163-13c47-34 4-56 43-88-49-5-19-63-78-76Z"/>
          <path className="mane-strand" d="M76 130c-32 28 10 50-29 75m22-13c-19 27 16 42-7 66m182-128c32 28-10 50 29 75m-22-13c19 27-16 42 7 66"/>
        </>}
        {type === 'customer' && <path className="hood" d="M54 260C58 91 92 31 160 26s102 65 106 234Z"/>}
        <path className="body" fill={`url(#coat-${type})`} d="M53 420c4-103 29-160 74-172h66c45 12 70 69 74 172Z"/>
        <path className="shoulder-trim" d="M58 383c23-72 45-112 75-122m129 122c-23-72-45-112-75-122"/>
        <path className="neck" d="M126 221h68v65h-68z"/>
        <path className="neck-shadow" d="M128 234q32 26 64 0v33q-32 22-64 0Z"/>
        <path className="head" d={type === 'hector' ? 'M84 105 126 57h71l42 48-22 128-57 33-57-33Z' : type === 'brindle' ? 'M88 103 127 62h66l39 41-16 115-56 55-56-55Z' : 'M91 100c9-47 38-68 69-68s60 21 69 68l-13 123-56 43-56-43Z'} />
        <path className="face-shadow" d="M102 170c8 45 29 73 58 86 28-13 49-41 58-86-18 14-37 20-58 20s-40-6-58-20Z"/>
        <path className="temple-detail" d="M109 115q20-15 42-5m60 5q-20-15-42-5"/>
        {type === 'calyx' && <>
          <path className="fuzz" d="M105 102q55-47 110 0l-16-58-39 26-39-26Z"/>
          <path className="ruff" d="m116 241-24 24 24 4-8 25 25-9 27 25 27-25 25 9-8-25 24-4-24-24-44 19Z"/>
        </>}
        {type === 'nix' && <>
          <path className="forelock" d="M87 122c-8-72 53-107 125-73-49 5-29 43-94 80Z"/>
          <path className="fin" d="m96 158-27 19 25 13m130-32 27 19-25 13"/>
          <path className="gill" d="m112 192-18 8m20 4-18 9m112-21 18 8m-20 4 18 9"/>
        </>}
        {type === 'hector' && <>
          <path className="stone-facet" d="m91 108 38 14 31-61 34 61 35-14m-116 94 47 54 47-54"/>
          <path className="crack" d="m210 105-22 36 17 29-24 28m-78-54 18 16-12 24 17 14m30-127 9 19-10 12"/>
          <circle className="stone-pit" cx="122" cy="96" r="4"/><circle className="stone-pit" cx="202" cy="188" r="5"/><circle className="stone-pit" cx="110" cy="219" r="3"/>
        </>}
        {type === 'brindle' && <>
          <path className="fur-marking" d="m119 91 12 22m15-31 5 29m50-20-12 22m-15-31-5 29M112 184l23 13m73-13-23 13"/>
          <path className="muzzle" d="M120 178q18-19 40 0 22-19 40 0l-6 39-34 22-34-22Z"/>
          <path className="whisker" d="m132 199-45-3m46 14-42 12m97-23 45-3m-46 14 42 12"/>
          <circle className="whisker-dot" cx="128" cy="201" r="2"/><circle className="whisker-dot" cx="123" cy="210" r="2"/><circle className="whisker-dot" cx="192" cy="201" r="2"/><circle className="whisker-dot" cx="197" cy="210" r="2"/>
        </>}
        {type === 'balthazar' && <>
          <path className="demon-mark" d="m160 86-11 17 11 11 11-11Zm-50 96 19-9m81 9-19-9"/>
          <path className="goatee" d="m145 226 15 38 15-38-15 9Z"/>
        </>}
        {type === 'customer' ? (
          <>
            <path className="void-face" d="M110 96q50-45 100 0l-10 122-40 27-40-27Z"/>
            <path className="hood-fold" d="M90 222c-3-86 16-144 70-173m70 173c3-86-16-144-70-173M76 253l38-17m130 17-38-17"/>
            <path className="void-eyes" d="m126 151 20-6-16 16m64-10-20-6 16 16"/>
          </>
        ) : (
          <>
            <path className="eye-socket" d="M108 145q22-24 44 0-22 21-44 0Zm60 0q22-24 44 0-22 21-44 0Z"/>
            <ellipse className="eye-glow" cx="130" cy="145" rx="13" ry="8" filter={`url(#glow-${type})`} />
            <ellipse className="eye-glow" cx="190" cy="145" rx="13" ry="8" filter={`url(#glow-${type})`} />
            <ellipse className="iris" fill={`url(#iris-${type})`} cx="130" cy="145" rx="10" ry="9"/><ellipse className="iris" fill={`url(#iris-${type})`} cx="190" cy="145" rx="10" ry="9"/>
            <ellipse className="pupil" cx="130" cy="145" rx="3" ry="7"/><ellipse className="pupil" cx="190" cy="145" rx="3" ry="7"/>
            <circle className="eye-shine" cx="127" cy="142" r="2"/><circle className="eye-shine" cx="187" cy="142" r="2"/>
            <path className="eyelid" d="m109 145q21-21 42 0m18 0q21-21 42 0"/>
            <path className="nose" d={type === 'brindle' ? 'm147 176 13-8 13 8-13 11Z' : type === 'hector' ? 'm160 157-14 37 14 7 14-7Z' : 'm157 163-6 29 13 2'} />
            <path className="mouth-shadow" d={speaking ? 'M137 214q23 25 46 0-23-13-46 0Z' : 'M137 215q23 10 46 0'} />
            <path className="mouth" d={speaking ? 'M138 215q22 18 44 0-22-8-44 0Z' : 'M137 215q23 10 46 0'} />
            {type === 'balthazar' && <><path className="brow" d="m111 126 34 8m64-8-34 8"/><path className="fang" d="m144 219 7 14 6-13m19-1-7 14-6-13"/></>}
            {type === 'hector' && <path className="tusk" d="m125 216 8 22 8-19m54-3-8 22-8-19"/>}
          </>
        )}
        <path className="shirt" d="m127 260 33 50 33-50 14 25-47 62-47-62Z"/>
        <path className="lapel" d="m126 268 34 57 34-57 22 152H104Z"/>
        <path className="lapel-edge" d="m126 269-18 30 30 28-15 18m71-76 18 30-30 28 15 18"/>
        <path className="tie" d="m153 306 7 12 7-12-2 78-5 13-5-13Z"/>
        <circle className="coat-button" cx="160" cy="362" r="3"/><circle className="coat-button" cx="160" cy="392" r="3"/>
        <path className="pocket" d="M137 294h112v62H137z"/>
        <path className="badge" d="M142 298h102v54H142z"/>
        <circle className="badge-pin" cx="149" cy="305" r="2"/>
        <text className="badge-name" x="193" y="318" textAnchor="middle" textLength="82" lengthAdjust="spacingAndGlyphs">
          {characterNames[type].toUpperCase()}
        </text>
        <path className="badge-rule" d="M150 325h86"/>
        <text className="badge-title" x="193" y="343" textAnchor="middle" textLength="82" lengthAdjust="spacingAndGlyphs">
          {characterJobs[type].toUpperCase()}
        </text>
      </svg>
    </div>
  )
}

function StoreBackdrop({ item }: { item?: string }) {
  return (
    <div className="store-backdrop" aria-hidden="true">
      <div className="ceiling-lines" />
      <div className="hanging-lamp lamp-one"><i /></div>
      <div className="hanging-lamp lamp-two"><i /></div>
      <div className="shelf shelf-one">
        <span className="jar jar-eye"/><span className="bottle"/><span className="box"/><span className="jar"/>
      </div>
      <div className="shelf shelf-two">
        <span className="candle"/><span className="candle short"/><span className="orb"/><span className="box tall"/>
      </div>
      <div className="counter"><div className="register">NO SALE</div></div>
      {item && <div className="item-placard">{item}</div>}
      <div className="dust dust-a">·</div><div className="dust dust-b">·</div><div className="dust dust-c">·</div>
    </div>
  )
}

function MarketScene({ step, advance, start }: { step: number; advance: () => void; start: () => void }) {
  return (
    <section className={`screen market-screen step-${step}`} aria-labelledby="market-title">
      <div className="market-sky"><span/><span/><span/></div>
      <div className="moon" />
      <div className="market-stalls" aria-hidden="true">
        <div className="stall stall-a"><i/><b/><em/></div>
        <div className="stall stall-b"><i/><b/><em/></div>
        <div className="stall stall-c"><i/><b/><em/></div>
      </div>
      <div className="shopfront" aria-hidden="true">
        <div className="awning" />
        <div className="shop-sign"><small>EST. EVENTUALLY</small>THE ELDRICH STORE</div>
        <div className="door"><div className="door-glow"/><span>APPLY<br/>WITHIN</span></div>
        <div className="window"><i/><i/><i/></div>
      </div>
      <div className="market-copy">
        <p className="eyebrow">SOMEWHERE AFTER MIDNIGHT</p>
        <h1 id="market-title">{step === 0 ? <>The night market<br/><em>wasn’t here yesterday.</em></> : <>WANTED:<br/><em>Assistant store manager.</em></>}</h1>
        <p className="narration">{step === 0 ? 'You came out looking for work. A yellow sign is lit at the far end of the market.' : 'Night work. References preferred. Applicants should be comfortable with inventory that moves after counting.'}</p>
        <button className="primary-button" onClick={step === 0 ? advance : start} data-testid={step === 0 ? 'enter-market' : 'start-shift'}>
          <span>{step === 0 ? 'Follow the yellow light' : 'Ask about the position'}</span><b>→</b>
        </button>
      </div>
      <p className="chapter-mark">OPEN UNTIL FURTHER NOTICE</p>
    </section>
  )
}

function ManagerScene({ onHired }: { onHired: () => void }) {
  const [answer, setAnswer] = useState<number | null>(null)

  return (
    <section className="screen manager-screen" aria-live="polite" data-testid="manager-interview">
      <StoreBackdrop item="APPLICATION · NIGHT STAFF" />
      <header className="manager-header">
        <div className="brand"><span className="brand-mark">E</span><div><b>THE ELDRICH STORE</b><small>EMPLOYMENT OFFICE / STOCKROOM</small></div></div>
        <span>APPLICANT: WALK-IN</span>
      </header>
      <div className="manager-layout">
        <div className="manager-stage">
          <CharacterPortrait type="balthazar" speaking={answer === null} />
          <div className="character-label"><i/><div><b>Balthazar</b><span>Proprietor</span></div></div>
        </div>
        <div className="interview-panel">
          <p className="eyebrow">EMPLOYMENT INTERVIEW</p>
          {answer === null ? (
            <>
              <h1>You’re here about the vacancy.</h1>
              <p className="interview-dialogue">“Assistant manager. Nights. There is lifting, closing, and some inventory that requires discretion. Where were you before this?”</p>
              <div className="interview-answers" aria-label="Choose your answer">
                {interviewAnswers.map((option, index) => (
                  <button key={option.label} onClick={() => setAnswer(index)} data-testid={`interview-choice-${index}`}>
                    <span>{String.fromCharCode(65 + index)}</span><b>{option.label}</b><i>→</i>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="job-offer" data-testid="job-offer">
              <span className="response-label">Balthazar considers this</span>
              <h1>“{interviewAnswers[answer].reply}”</h1>
              <p>He reads the first line of the application, then signs it.</p>
              <div className="offer-slip">
                <small>NOTICE OF APPOINTMENT</small>
                <b>ASSISTANT STORE MANAGER</b>
                <span>START DATE&nbsp;&nbsp; TONIGHT</span>
                <em>THE JOB IS YOURS</em>
              </div>
              <button className="primary-button" onClick={onHired} data-testid="accept-job"><span>Take the name badge</span><b>→</b></button>
            </div>
          )}
        </div>
      </div>
      <div className="shift-footer"><span>INTERVIEWS BY APPOINTMENT OR WALK-IN</span><span>REFERENCES WILL BE CONTACTED IF REQUIRED</span></div>
    </section>
  )
}

function StatMeter({ name, value }: { name: StatKey; value: number }) {
  const info = statInfo[name]
  return (
    <div className={`stat stat--${name}`} aria-label={`${info.label}: ${value} out of 10`}>
      <span className="stat-icon">{info.icon}</span>
      <div><span className="stat-name">{info.label}</span><div className="stat-track"><i style={{ width: `${value * 10}%` }}/></div></div>
      <b>{value}</b>
    </div>
  )
}

function EffectTags({ effects }: { effects: Partial<Stats> }) {
  return <span className="effect-tags">{(Object.entries(effects) as [StatKey, number][]).map(([key, value]) => <i className={value > 0 ? 'up' : 'down'} key={key}>{value > 0 ? '+' : ''}{value} {statInfo[key].label}</i>)}</span>
}

function ShiftScreen({
  index,
  stats,
  resolved,
  onChoose,
  onContinue,
}: {
  index: number
  stats: Stats
  resolved: { choice: Choice; before: Stats } | null
  onChoose: (choiceIndex: number) => void
  onContinue: () => void
}) {
  const decision = decisions[index]
  return (
    <section className="screen shift-screen" aria-live="polite">
      <StoreBackdrop item={decision.item} />
      <header className="shift-header">
        <div className="brand"><span className="brand-mark">E</span><div><b>THE ELDRICH STORE</b><small>ASSISTANT MANAGER TERMINAL</small></div></div>
        <div className="stats-row">{(Object.keys(stats) as StatKey[]).map(key => <StatMeter key={key} name={key} value={stats[key]} />)}</div>
        <div className="shift-clock"><small>NIGHT SHIFT</small><b>0{index + 1}:<span>{13 + index * 9}</span></b></div>
      </header>

      <div className="case-number"><small>CASE</small><b>{decision.number}</b><i>/ 05</i></div>
      <div className="character-stage">
        <div className="character-label"><i/><div><b>{decision.speaker}</b><span>{decision.role}</span></div></div>
        <CharacterPortrait type={decision.character} speaking={!resolved} />
      </div>

      <div className={`decision-panel ${resolved ? 'is-resolved' : ''}`}>
        {!resolved ? (
          <>
            <div className="dialogue-block">
              <span className="quote-mark">“</span>
              <h2>{decision.dialogue}</h2>
              <p>{decision.detail}</p>
            </div>
            <div className="choice-heading"><span>YOUR DECISION</span><i>The bell will ring shortly</i></div>
            <div className="choices">
              {decision.choices.map((choice, choiceIndex) => (
                <button key={choice.label} className="choice-button" onClick={() => onChoose(choiceIndex)} data-testid={`choice-${choiceIndex}`}>
                  <span className="choice-key">{String.fromCharCode(65 + choiceIndex)}</span>
                  <span className="choice-copy"><b>{choice.label}</b><small>{choice.note}</small></span>
                  <EffectTags effects={choice.effects} />
                  <span className="choice-arrow">→</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="resolution" data-testid="resolution">
            <div className="receipt">
              <small>MANAGEMENT DECISION · {decision.number}</small>
              <div className="stamp">{resolved.choice.stamp}</div>
              <div className="receipt-dots"/>
              {(Object.entries(resolved.choice.effects) as [StatKey, number][]).map(([key, delta]) => (
                <div className="receipt-line" key={key}><span>{statInfo[key].label}</span><b className={delta > 0 ? 'up' : 'down'}>{resolved.before[key]} {delta > 0 ? '+' : '−'} {Math.abs(delta)} → {stats[key]}</b></div>
              ))}
              <div className="receipt-total"><span>DECISIONS REMAINING</span><b>{decisions.length - index - 1}</b></div>
            </div>
            <div className="response-copy">
              <span className="response-label">{decision.speaker} says</span>
              <h2>“{resolved.choice.reply}”</h2>
              <button className="primary-button compact" onClick={onContinue} data-testid="continue">
                <span>{index === decisions.length - 1 ? 'End the shift' : 'Next problem'}</span><b>→</b>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="shift-footer"><span>EMPLOYEE ID: TEMP-000</span><span>INCIDENTS MUST BE ENTERED IN THE CLOSING LOG</span></div>
    </section>
  )
}

function getEnding(stats: Stats) {
  if (stats.veil <= 2) return { grade: 'D', title: 'Containment Failure', copy: 'The shop is still trading, though it now opens onto several locations. We will discuss access procedures next shift.' }
  if (stats.morale <= 2) return { grade: 'C−', title: 'A Quiet Shop Floor', copy: 'The rota has several new vacancies. Hector left his keys on the desk and has returned to the cathedral.' }
  if (stats.till <= 2) return { grade: 'C', title: 'Below Target', copy: 'The staff support your decisions and the premises remain stable. The till will need attention before morning.' }
  if (stats.till >= 6 && stats.morale >= 6 && stats.veil >= 6) return { grade: 'A+', title: 'A Balanced Shift', copy: 'Sales, staff, and the premises are all in good order. Your name will remain on next week’s rota.' }
  return { grade: 'B', title: 'Kept On', copy: 'The store survived the shift and most of the figures reconcile. Balthazar has scheduled you again tomorrow.' }
}

function ReviewScreen({ stats, history, restart }: { stats: Stats; history: number[]; restart: () => void }) {
  const ending = getEnding(stats)
  const total = stats.till + stats.morale + stats.veil
  return (
    <section className="screen review-screen" data-testid="review">
      <StoreBackdrop />
      <div className="review-card">
        <div className="review-heading"><span>END OF SHIFT · PERFORMANCE REVIEW</span><b className="review-grade">{ending.grade}</b></div>
        <div className="review-content">
          <div className="review-portrait"><CharacterPortrait type="balthazar" speaking /><span>BALTHAZAR<br/><small>Proprietor / Line Manager</small></span></div>
          <div className="review-copy">
            <p className="eyebrow">MANAGER’S NOTES</p>
            <h1>{ending.title}</h1>
            <p className="review-text">“{ending.copy}”</p>
            <div className="final-stats">
              {(Object.keys(stats) as StatKey[]).map(key => <StatMeter key={key} name={key} value={stats[key]} />)}
            </div>
            <div className="score-line"><span>MANAGERIAL INTEGRITY INDEX</span><b>{total}<i>/ 30</i></b></div>
            <div className="decision-tape" aria-label="Your five decisions">
              {history.map((choiceIndex, index) => <span key={index} title={decisions[index].choices[choiceIndex].label}>{decisions[index].number}<b>{String.fromCharCode(65 + choiceIndex)}</b></span>)}
            </div>
            <button className="primary-button" onClick={restart} data-testid="restart"><span>Work another shift</span><b>↻</b></button>
          </div>
        </div>
      </div>
      <p className="review-fineprint">EMPLOYMENT CONTINUES AT THE PROPRIETOR’S DISCRETION</p>
    </section>
  )
}

function SoundToggle({ enabled, toggle }: { enabled: boolean; toggle: () => void }) {
  return <button className="sound-toggle" onClick={toggle} aria-label={enabled ? 'Mute music' : 'Play music'} title={enabled ? 'Mute music' : 'Play music'}><span>{enabled ? '♫' : '♪'}</span>{enabled ? 'ON' : 'OFF'}</button>
}

function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const debug = params.get('debug') === 'true'
  const forcedMute = params.get('music') === 'off'
  const [scene, setScene] = useState<Scene>('market')
  const [marketStep, setMarketStep] = useState(0)
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState<Stats>(INITIAL_STATS)
  const [history, setHistory] = useState<number[]>([])
  const [resolved, setResolved] = useState<{ choice: Choice; before: Stats } | null>(null)
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef<{ context: AudioContext; nodes: AudioNode[]; timer: number } | null>(null)

  const stopSound = () => {
    if (!audioRef.current) return
    window.clearInterval(audioRef.current.timer)
    audioRef.current.nodes.forEach(node => node.disconnect())
    void audioRef.current.context.close()
    audioRef.current = null
    setSoundOn(false)
  }

  const startSound = () => {
    if (forcedMute || audioRef.current) return
    const context = new AudioContext()
    const master = context.createGain()
    master.gain.value = 0.065
    master.connect(context.destination)
    const nodes: AudioNode[] = [master]
    ;[73.42, 110, 146.83].forEach((frequency, i) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = i === 1 ? 'triangle' : 'sine'
      oscillator.frequency.value = frequency
      oscillator.detune.value = i * 5
      gain.gain.value = i === 1 ? 0.12 : 0.19
      oscillator.connect(gain).connect(master)
      oscillator.start()
      nodes.push(oscillator, gain)
    })
    const chime = () => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = [440, 523.25, 659.25][Math.floor(context.currentTime / 5) % 3]
      gain.gain.setValueAtTime(0, context.currentTime)
      gain.gain.linearRampToValueAtTime(0.11, context.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.8)
      oscillator.connect(gain).connect(master)
      oscillator.start()
      oscillator.stop(context.currentTime + 1.9)
    }
    chime()
    const timer = window.setInterval(chime, 5200)
    audioRef.current = { context, nodes, timer }
    setSoundOn(true)
  }

  useEffect(() => () => {
    if (audioRef.current) {
      window.clearInterval(audioRef.current.timer)
      void audioRef.current.context.close()
    }
  }, [])

  const beginInterview = () => {
    startSound()
    setScene('interview')
  }

  const beginShift = () => setScene('shop')

  const choose = (choiceIndex: number) => {
    if (resolved || choiceIndex < 0 || choiceIndex >= decisions[index].choices.length) return
    const choice = decisions[index].choices[choiceIndex]
    const before = { ...stats }
    setStats(current => {
      const next = { ...current }
      for (const [key, delta] of Object.entries(choice.effects) as [StatKey, number][]) next[key] = clamp(next[key] + delta)
      return next
    })
    setHistory(current => [...current, choiceIndex])
    setResolved({ choice, before })
  }

  const continueShift = () => {
    if (!resolved) return
    if (index === decisions.length - 1) {
      setScene('review')
    } else {
      setIndex(current => current + 1)
      setResolved(null)
    }
  }

  const restart = () => {
    setScene('shop')
    setIndex(0)
    setStats(INITIAL_STATS)
    setHistory([])
    setResolved(null)
  }

  useEffect(() => {
    window.__ELDRICH_STORE__ = {
      getState: () => ({ scene, index, stats, resolved: Boolean(resolved), history }),
      choose,
      continue: continueShift,
      restart,
    }
  })

  return (
    <main>
      {scene === 'market' && <MarketScene step={marketStep} advance={() => setMarketStep(1)} start={beginInterview} />}
      {scene === 'interview' && <ManagerScene onHired={beginShift} />}
      {scene === 'shop' && <ShiftScreen index={index} stats={stats} resolved={resolved} onChoose={choose} onContinue={continueShift} />}
      {scene === 'review' && <ReviewScreen stats={stats} history={history} restart={restart} />}
      <SoundToggle enabled={soundOn} toggle={soundOn ? stopSound : startSound} />
      {debug && (
        <aside className="debug-tools">
          <b>DEBUG</b>
          <button onClick={() => setScene('interview')}>Interview</button>
          <button onClick={() => setScene('shop')}>Shop</button>
          {decisions.map((decision, i) => <button key={decision.id} onClick={() => { setScene('shop'); setIndex(i); setResolved(null); setHistory(Array(i).fill(1)) }}>{i + 1}</button>)}
          <button onClick={() => { setStats({ till: 8, morale: 8, veil: 8 }); setHistory([1, 0, 1, 0, 1]); setScene('review') }}>Review</button>
        </aside>
      )}
    </main>
  )
}

declare global {
  interface Window {
    __ELDRICH_STORE__: {
      getState: () => { scene: Scene; index: number; stats: Stats; resolved: boolean; history: number[] }
      choose: (choiceIndex: number) => void
      continue: () => void
      restart: () => void
    }
  }
}

export default App
