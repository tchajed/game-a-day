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
    reply: 'Retail, then. Close enough for our purposes.',
  },
  {
    label: 'I learn quickly.',
    reply: 'Most things here do. You should fit in.',
  },
  {
    label: 'I found the door, didn’t I?',
    reply: 'You did. The previous applicant is still looking for it.',
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
    dialogue: 'The customer says this prophecy “did not spark joy.” It did accurately predict the divorce, which feels like user error.',
    detail: 'The receipt is legible, but only when held under a funeral moon. Our policy is, regrettably, your policy now.',
    choices: [
      {
        label: 'Approve the refund',
        note: 'Keep the customer, eat the cost',
        effects: { till: -2, morale: 1, veil: 1 },
        reply: 'A generous precedent. I will place the returned future in the staff room, facing down.',
        stamp: 'REFUND APPROVED',
      },
      {
        label: 'Offer store credit',
        note: 'A compromise with an expiry date',
        effects: { till: -1, morale: 1 },
        reply: 'Store credit issued. It expires last Thursday. That is apparently permitted.',
        stamp: 'CREDIT ISSUED',
      },
      {
        label: 'Enforce final sale',
        note: 'Protect the margin, test the wards',
        effects: { till: 2, morale: -1, veil: -1 },
        reply: 'Understood. The customer has promised to haunt our reviews. So, a normal one-star.',
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
    dialogue: 'My dinner break overlaps the moonrise again. I can skip it, but then I may unionize with my other selves.',
    detail: 'Reassigning the rota leaves the shop floor uncovered for twelve minutes. The mannequins have offered to help.',
    choices: [
      {
        label: 'Cover the floor yourself',
        note: 'Lose sales, earn loyalty',
        effects: { till: -1, morale: 2 },
        reply: 'Thank you. If anyone asks for fitting-room access, remember: never count the mirrors aloud.',
        stamp: 'BREAK COVERED',
      },
      {
        label: 'Put a mannequin on till',
        note: 'Efficient, technically forbidden',
        effects: { till: 1, morale: 1, veil: -2 },
        reply: 'Bold. It already has an employee number. I have chosen not to ask since when.',
        stamp: 'TEMP ASSIGNED',
      },
      {
        label: 'Deny the request',
        note: 'Keep coverage, lose goodwill',
        effects: { till: 2, morale: -2 },
        reply: 'Of course. I will simply be professional about this in every body I currently possess.',
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
    dialogue: 'The Whisper Candles sell three times faster by the entrance. They also tell passersby their childhood nicknames.',
    detail: 'Our conversion rate is excellent. So is the rate at which the front window has begun to breathe.',
    choices: [
      {
        label: 'Keep the display',
        note: 'Strong sales, porous reality',
        effects: { till: 2, veil: -2 },
        reply: 'Wonderful. I have adjusted the lighting from “ominous” to “commercially ominous.”',
        stamp: 'DISPLAY KEPT',
      },
      {
        label: 'Move them behind glass',
        note: 'Modest sales, modest screaming',
        effects: { till: 1, veil: 1 },
        reply: 'Tasteful and cautious. The glass has begun whispering instead, but more quietly.',
        stamp: 'DISPLAY MOVED',
      },
      {
        label: 'Pull them from sale',
        note: 'Safety first, targets second',
        effects: { till: -2, morale: 1, veil: 2 },
        reply: 'I will extinguish them. Please ignore anything they say in your mother’s voice.',
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
    dialogue: 'Our screaming kettles are nearly sold out. The supplier offers a bulk rate, payable in cash or one fond memory per unit.',
    detail: 'Quarterly targets favor volume. Staff retention guidelines are frustratingly silent on abstract collateral.',
    choices: [
      {
        label: 'Pay cash for a small order',
        note: 'Safe stock, thinner margin',
        effects: { till: -2, morale: 1, veil: 1 },
        reply: 'Conservative. Sensible. I feel unclean saying both words, but the books will survive.',
        stamp: 'ORDER: SMALL',
      },
      {
        label: 'Trade your own memory',
        note: 'Save cash, misplace something nice',
        effects: { till: 2, morale: 1, veil: -1 },
        reply: 'Excellent initiative. You no longer remember your first day here. This is still your first day here.',
        stamp: 'MEMORY TENDERED',
      },
      {
        label: 'Ask staff to contribute',
        note: 'Great margin, terrible meeting',
        effects: { till: 3, morale: -3, veil: -1 },
        reply: 'Efficient delegation. HR requests that we stop calling the collection jar “voluntary.”',
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
    dialogue: 'There is one customer outside. They want the Last Umbrella, but only have seven years of good luck. It costs ten.',
    detail: 'We closed four minutes ago. The customer has no face, but has maintained excellent eye contact.',
    choices: [
      {
        label: 'Honor the discount',
        note: 'Make the sale, bend the rules',
        effects: { till: 1, morale: -1, veil: -1 },
        reply: 'I’ll let them in. Please stand clear when I unlock the door; it dislikes being perceived after two.',
        stamp: 'DISCOUNT HONORED',
      },
      {
        label: 'Hold it until tomorrow',
        note: 'Good service, extra admin',
        effects: { morale: 2, veil: 1 },
        reply: 'A hold slip, then. I will write their name as a tasteful blank space.',
        stamp: 'ITEM HELD',
      },
      {
        label: 'Close on time',
        note: 'Protect the team, miss the sale',
        effects: { till: -1, morale: 1, veil: 2 },
        reply: 'Finally, a manager who respects closing hours. The customer has unfolded and gone home.',
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

function CharacterPortrait({ type, speaking = false }: { type: Character; speaking?: boolean }) {
  return (
    <div className={`portrait portrait--${type} ${speaking ? 'is-speaking' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 320 420" role="img">
        <defs>
          <linearGradient id={`coat-${type}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#3e315e" />
            <stop offset="1" stopColor="#18152f" />
          </linearGradient>
          <filter id={`glow-${type}`}><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        {type === 'balthazar' && <><path className="horn" d="M114 99C57 78 54 21 79 4c-3 38 26 48 69 46Z"/><path className="horn" d="M206 99c57-21 60-78 35-95 3 38-26 48-69 46Z"/></>}
        {type === 'hector' && <><path className="ear" d="m92 116-66-69 88 18Z"/><path className="ear" d="m228 116 66-69-88 18Z"/><path className="crack" d="m210 105-22 36 17 29-24 28"/></>}
        {type === 'brindle' && <><path className="ear" d="m96 106 8-94 57 72Z"/><path className="ear" d="m224 106-8-94-57 72Z"/></>}
        {type === 'calyx' && <><path className="wing wing-left" d="M130 124C54 54 9 80 20 189c8 82 74 96 126 49Z"/><path className="wing wing-right" d="M190 124c76-70 121-44 110 65-8 82-74 96-126 49Z"/><path className="antenna" d="M140 84C111 38 112 19 86 12M180 84c29-46 28-65 54-72"/></>}
        {type === 'nix' && <path className="mane" d="M83 104C30 124 52 178 18 202c42 19 11 73 73 79l163-13c47-34 4-56 43-88-49-5-19-63-78-76Z"/>}
        {type === 'customer' && <path className="hood" d="M54 260C58 91 92 31 160 26s102 65 106 234Z"/>}
        <path className="body" fill={`url(#coat-${type})`} d="M53 420c4-103 29-160 74-172h66c45 12 70 69 74 172Z"/>
        <path className="neck" d="M126 221h68v65h-68z"/>
        <path className="head" d={type === 'hector' ? 'M84 105 126 57h71l42 48-22 128-57 33-57-33Z' : type === 'brindle' ? 'M88 103 127 62h66l39 41-16 115-56 55-56-55Z' : 'M91 100c9-47 38-68 69-68s60 21 69 68l-13 123-56 43-56-43Z'} />
        {type === 'calyx' && <path className="fuzz" d="M105 102q55-47 110 0l-16-58-39 26-39-26Z"/>}
        {type === 'nix' && <path className="forelock" d="M87 122c-8-72 53-107 125-73-49 5-29 43-94 80Z"/>}
        {type === 'customer' ? (
          <path className="void-face" d="M110 96q50-45 100 0l-10 122-40 27-40-27Z"/>
        ) : (
          <>
            <ellipse className="eye-glow" cx="130" cy="145" rx="13" ry="8" filter={`url(#glow-${type})`} />
            <ellipse className="eye-glow" cx="190" cy="145" rx="13" ry="8" filter={`url(#glow-${type})`} />
            <path className="eye" d="m115 145 15-7 15 7-15 7Z"/><path className="eye" d="m175 145 15-7 15 7-15 7Z"/>
            <path className="nose" d={type === 'brindle' ? 'm147 176 13-8 13 8-13 11Z' : 'm157 163-6 29 13 2'} />
            <path className="mouth" d={speaking ? 'M138 215q22 18 44 0-22-8-44 0Z' : 'M137 215q23 10 46 0'} />
            {type === 'balthazar' && <><path className="brow" d="m111 126 34 8M209 126l-34 8"/><path className="fang" d="m144 219 7 14 6-13M176 219l-7 14-6-13"/></>}
          </>
        )}
        <path className="lapel" d="m126 268 34 57 34-57 22 152H104Z"/>
        <path className="badge" d="M181 315h47v26h-47z"/>
        <path className="badge-line" d="M187 323h34M187 332h22"/>
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
        <p className="eyebrow">SOMEWHERE BETWEEN MIDNIGHT &amp; REGRET</p>
        <h1 id="market-title">{step === 0 ? <>The night market<br/><em>wasn’t here yesterday.</em></> : <>WANTED:<br/><em>Assistant store manager.</em></>}</h1>
        <p className="narration">{step === 0 ? 'You came out looking for work. The yellow lights appear to be looking back.' : 'Competitive wage. Flexible hours. Dental, pending verification that you possess teeth.'}</p>
        <button className="primary-button" onClick={step === 0 ? advance : start} data-testid={step === 0 ? 'enter-market' : 'start-shift'}>
          <span>{step === 0 ? 'Follow the yellow light' : 'Apply immediately'}</span><b>→</b>
        </button>
      </div>
      <p className="chapter-mark">A TINY MANAGEMENT NIGHTMARE</p>
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
          <p className="eyebrow">A VERY SHORT INTERVIEW</p>
          {answer === null ? (
            <>
              <h1>You’re here about the vacancy.</h1>
              <p className="interview-dialogue">“Assistant manager. Nights. Some lifting, some listening at locked doors. What experience do you have?”</p>
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
              <p>He signs the application without turning it over.</p>
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
      <div className="shift-footer"><span>INTERVIEWS BY APPOINTMENT OR ARRIVAL</span><span>REFERENCES MAY BE CONTACTED IN DREAMS</span></div>
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
            <div className="choice-heading"><span>YOUR DECISION</span><i>Choose before the bell rings</i></div>
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
      <div className="shift-footer"><span>EMPLOYEE ID: TEMP-000</span><span>PLEASE KEEP ALL LIMBS BEHIND THE VEIL</span></div>
    </section>
  )
}

function getEnding(stats: Stats) {
  if (stats.veil <= 2) return { grade: 'D', title: 'Employee of the Apocalypse', copy: 'Sales were brisk right up until the shop became an open concept portal. Excellent quarter. No further quarters expected.' }
  if (stats.morale <= 2) return { grade: 'C−', title: 'Acting Assistant to Nobody', copy: 'The team has left. Some resigned, some transformed, and Hector is “working remotely” from the cathedral gutter.' }
  if (stats.till <= 2) return { grade: 'C', title: 'Spiritually Rich, Fiscally Dead', copy: 'Everyone likes you and reality remains stubbornly intact. Regrettably, the till contains one button and a moth.' }
  if (stats.till >= 6 && stats.morale >= 6 && stats.veil >= 6) return { grade: 'A+', title: 'Assistant Manager of the Month', copy: 'Profit, people, and planar integrity: balanced. Your portrait will hang beside the exits, where it can watch both of them.' }
  return { grade: 'B', title: 'Permanently on Probation', copy: 'The store survived, the numbers mostly add up, and only one complaint was written in blood. Balthazar calls this “leadership potential.”' }
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
            <p className="eyebrow">CONGRATULATIONS, PROBABLY</p>
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
      <p className="review-fineprint">EMPLOYMENT IS AT-WILL · THE WILL IN QUESTION IS BALTHAZAR’S</p>
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
