import { useMemo, useState } from 'react'
import {
  Anchor,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileSearch,
  Mail,
  MapPinned,
  MessageSquareText,
  RotateCcw,
  Search,
  Ship,
  Sparkles,
  Stamp,
  Waves,
  X,
} from 'lucide-react'

type StageId = 'onboarding' | 'level1' | 'level5'
type Tool = 'report' | 'audit' | 'messages'
type Choice = {
  id: string
  title: string
  detail: string
  time: number
  icon: 'records' | 'people' | 'map'
  finding: string
  noteFrom: string
  note: string
  evidence: string
  strong?: boolean
}

type Stage = {
  id: StageId
  number: string
  kicker: string
  title: string
  brief: string
  question: string
  days: number
  columns: string[]
  rows: Array<{ id: string; label: string; values: string[]; change: string; tone?: 'good' | 'warn' | 'bad' }>
  focus: string
  guide?: string
  choices: Choice[]
}

const stages: Record<StageId, Stage> = {
  onboarding: {
    id: 'onboarding', number: 'TUTORIAL', kicker: 'A QUIET TUESDAY', title: 'There is room on the boat.',
    brief: 'The morning ferry is profitable, but your instinct says it could do more. Let’s follow one number together.',
    question: 'How full is the cargo deck, really?', days: 1, columns: ['LAST MONTH', 'THIS MONTH'], focus: 'cargo',
    guide: 'Start here. Capacity tells you whether higher sales need another boat—or just better use of this one.',
    rows: [
      { id: 'tickets', label: 'Passenger tickets', values: ['¤ 42,800', '¤ 45,200'], change: '+6%', tone: 'good' },
      { id: 'cargo', label: 'Cargo sales', values: ['¤ 18,400', '¤ 19,100'], change: '+4%', tone: 'good' },
      { id: 'fuel', label: 'Fuel', values: ['¤ 12,900', '¤ 13,100'], change: '+2%' },
      { id: 'profit', label: 'Route profit', values: ['¤ 11,600', '¤ 13,900'], change: '+20%', tone: 'good' },
    ],
    choices: [{ id: 'capacity', title: 'Check deck capacity', detail: 'Compare sold cargo weight with the ship’s safe capacity.', time: 0, icon: 'records', strong: true,
      finding: 'The deck sails only 61% full. Market-day freight alone could fill most of the gap—without adding a sailing.', evidence: '39% unused cargo capacity', noteFrom: 'Mira, dock clerk', note: 'Farmers keep asking about market-day crates. We have always told them the deck is full. It clearly is not.' }],
  },
  level1: {
    id: 'level1', number: 'LEVEL 1', kicker: 'THE VANISHING BICYCLES', title: 'A small number is out of place.',
    brief: 'Bicycle fees fell sharply, but passenger traffic did not. You have time for one check before the weekly close.',
    question: 'Why are bicycle fees down 34%?', days: 1, columns: ['EXPECTED', 'REPORTED'], focus: 'bikes',
    rows: [
      { id: 'tickets', label: 'Passenger tickets', values: ['¤ 47,600', '¤ 51,200'], change: '+8%', tone: 'good' },
      { id: 'bikes', label: 'Bicycle fees', values: ['¤ 6,400', '¤ 4,200'], change: '−34%', tone: 'warn' },
      { id: 'cargo', label: 'Cargo sales', values: ['¤ 20,100', '¤ 20,500'], change: '+2%' },
      { id: 'cash', label: 'Cash received', values: ['¤ 74,100', '¤ 75,900'], change: '+2%' },
    ],
    choices: [
      { id: 'sample', title: 'Sample ten tickets', detail: 'Trace bicycle tickets from the kiosk to the ledger.', time: 1, icon: 'records', strong: true,
        finding: 'All ten fees were collected. A new clerk posted them to Passenger tickets instead of Bicycle fees.', evidence: '10 ticket stubs matched', noteFrom: 'Jori, ticket clerk', note: 'That was me. The new screen puts “bicycle” under passenger extras. I used the line above it. I’m sorry—I can fix the batch.' },
      { id: 'ask', title: 'Ask the dockmaster', detail: 'Check whether fewer bicycles boarded this week.', time: 1, icon: 'people',
        finding: 'The dockmaster remembers a normal number of bicycles, but cannot explain where the fees were posted.', evidence: 'Verbal count only', noteFrom: 'Petra, dockmaster', note: 'Plenty of bicycles. More than last month, if anything. You should check with the ticket desk.' },
      { id: 'count', title: 'Count today’s bicycles', detail: 'Observe one sailing and compare it with today’s sales.', time: 1, icon: 'map',
        finding: 'Today’s count matches today’s sales. The earlier weekly discrepancy remains unresolved.', evidence: 'One sailing observed', noteFrom: 'Petra, dockmaster', note: 'Today looks fine. Whatever happened, it happened before this morning.' },
    ],
  },
  level5: {
    id: 'level5', number: 'LEVEL 5', kicker: 'THE NORTH REEF VOTE', title: 'The route is hiding something.',
    brief: 'Finance wants North Reef closed in four days. Fuel surged, cargo got heavier, and some passengers never scanned off.',
    question: 'What is Kestrel doing after Beacon 9?', days: 4, columns: ['OCTOBER', 'NOVEMBER'], focus: 'fuel',
    rows: [
      { id: 'passengers', label: 'Passenger fares', values: ['¤ 151,800', '¤ 153,100'], change: '+1%' },
      { id: 'cargo', label: 'Cargo contracts', values: ['¤ 103,700', '¤ 119,600'], change: '+15%', tone: 'warn' },
      { id: 'fuel', label: 'Fuel', values: ['¤ 84,700', '¤ 145,900'], change: '+72%', tone: 'bad' },
      { id: 'profit', label: 'Route profit', values: ['¤ 63,600', '−¤ 17,900'], change: 'LOSS', tone: 'bad' },
    ],
    choices: [
      { id: 'gps', title: 'Recover deleted GPS tracks', detail: 'Restore Kestrel’s antenna cache and map every November voyage.', time: 2, icon: 'map', strong: true,
        finding: 'Seven night voyages turn west after Beacon 9 and stop at Lysa—an inhabited island erased from public charts.', evidence: '7 recovered tracks to Lysa', noteFrom: 'Ivo, fleet systems', note: 'The bridge history was deleted. The antenna cache was not. Someone wanted these voyages forgotten.' },
      { id: 'weight', title: 'Cross-check cargo weights', detail: 'Compare manifests with independent weighbridge records.', time: 2, icon: 'records', strong: true,
        finding: 'Kestrel carried 74 undeclared tonnes for Aster Trading. Finance signed every late manifest.', evidence: '74 hidden tonnes', noteFrom: 'Oren, dockmaster', note: 'The scales are right. The manifests are fiction. Aster trucks arrive after my freight office closes.' },
      { id: 'scans', title: 'Reconcile passenger scans', detail: 'Match each boarding scan with an official destination.', time: 1, icon: 'records', strong: true,
        finding: 'Thirty-seven passengers boarded late sailings and never scanned off at any listed port.', evidence: '37 open journeys', noteFrom: 'Mina, ticketing', note: 'It is not a reader fault. The same people disappear after Beacon 9 every Thursday.' },
      { id: 'captain', title: 'Interview Captain Vale', detail: 'Ask directly about the fuel, passengers, and night sailings.', time: 2, icon: 'people',
        finding: 'Vale says Kestrel supplies sixty-two people on Lysa. She also alleges Finance sells spare hold space to smugglers.', evidence: 'Captain’s signed statement', noteFrom: 'Captain Vale', note: 'Lysa was struck from the map. Its people did not stop existing. Protect my crew, and I will testify.' },
    ],
  },
}

const order: StageId[] = ['onboarding', 'level1', 'level5']

function AuditIcon({ kind }: { kind: Choice['icon'] }) {
  return kind === 'map' ? <MapPinned /> : kind === 'people' ? <MessageSquareText /> : <FileSearch />
}

function App() {
  const [stageId, setStageId] = useState<StageId>('onboarding')
  const [tool, setTool] = useState<Tool>('report')
  const [selectedRow, setSelectedRow] = useState('cargo')
  const [completed, setCompleted] = useState<Record<StageId, string[]>>({ onboarding: [], level1: [], level5: [] })
  const [daysSpent, setDaysSpent] = useState<Record<StageId, number>>({ onboarding: 0, level1: 0, level5: 0 })
  const [result, setResult] = useState<Choice | null>(null)
  const [running, setRunning] = useState<Choice | null>(null)
  const [showDecision, setShowDecision] = useState(false)
  const [ending, setEnding] = useState<'protect' | 'close' | null>(null)
  const debug = new URLSearchParams(location.search).get('debug') === 'true'
  const stage = stages[stageId]
  const stageIndex = order.indexOf(stageId)
  const done = completed[stageId]
  const remaining = stage.days - daysSpent[stageId]
  const foundChoices = stage.choices.filter((choice) => done.includes(choice.id))
  const strongEvidence = foundChoices.filter((choice) => choice.strong).length

  const message = useMemo(() => {
    const latest = foundChoices.at(-1)
    if (latest) return { from: latest.noteFrom, body: latest.note, new: true }
    if (stageId === 'onboarding') return { from: 'Mira, dock clerk', body: 'Morning. The accounts are ready. Start with the cargo line—I think the boat has more room than we tell people.', new: false }
    if (stageId === 'level1') return { from: 'Mara, route manager', body: 'The cash total looks normal, so I doubt anything was stolen. But bicycle fees should not fall this far in summer.', new: false }
    return { from: 'Captain Vale', body: 'The board will call Kestrel wasteful. Before they close us, ask what the fuel was used for. Ask where we went.', new: false }
  }, [foundChoices, stageId])

  function jumpTo(id: StageId) {
    setStageId(id)
    setTool('report')
    setSelectedRow(stages[id].focus)
    setResult(null)
    setShowDecision(false)
    setEnding(null)
  }

  function runAudit(choice: Choice) {
    if (done.includes(choice.id) || choice.time > remaining || running) return
    setRunning(choice)
    window.setTimeout(() => {
      setCompleted((all) => ({ ...all, [stageId]: [...all[stageId], choice.id] }))
      setDaysSpent((all) => ({ ...all, [stageId]: all[stageId] + choice.time }))
      setRunning(null)
      setResult(choice)
    }, 650)
  }

  function nextStage() {
    if (stageIndex < order.length - 1) jumpTo(order[stageIndex + 1])
  }

  function reset() {
    setCompleted({ onboarding: [], level1: [], level5: [] })
    setDaysSpent({ onboarding: 0, level1: 0, level5: 0 })
    jumpTo('onboarding')
  }

  const stageComplete = stageId === 'onboarding' ? done.length > 0 : stageId === 'level1' ? done.length > 0 : remaining === 0 || done.length >= 2

  return (
    <main className={`game stage-${stageId}`}>
      <div className="chart-lines" />
      <header className="game-header">
        <div className="brand"><span><Anchor /></span><div><b>NORTHSTAR</b><small>THE LEDGER GAME</small></div></div>
        <nav className="voyage-progress" aria-label="Demo chapters">
          {order.map((id, index) => <button key={id} className={`${id === stageId ? 'current' : ''} ${index < stageIndex ? 'past' : ''}`} onClick={() => jumpTo(id)}><i>{index < stageIndex ? <Check /> : index + 1}</i><span>{stages[id].number}<small>{id === 'onboarding' ? 'Find an opportunity' : id === 'level1' ? 'Fix a mistake' : 'Follow the mystery'}</small></span></button>)}
        </nav>
        <div className="day-counter"><Clock3 /><span><b>{remaining}</b><small>{stageId === 'onboarding' ? 'GUIDED STEP' : 'DAYS LEFT'}</small></span></div>
      </header>

      <section className="chapter-intro">
        <div><span>{stage.number} · {stage.kicker}</span><h1>{stage.title}</h1><p>{stage.brief}</p></div>
        <div className="chapter-question"><CircleAlert /><span><small>YOUR QUESTION</small><b>{stage.question}</b></span></div>
      </section>

      <section className="play-area">
        <nav className="tools" aria-label="Investigation tools">
          <button className={tool === 'report' ? 'active' : ''} onClick={() => setTool('report')}><BookOpen /><span><b>REPORT</b><small>See the numbers</small></span>{stage.guide && tool !== 'report' && <i />}</button>
          <button className={tool === 'audit' ? 'active' : ''} onClick={() => setTool('audit')}><FileCheck2 /><span><b>AUDIT</b><small>Choose a check</small></span>{done.length === 0 && <i />}</button>
          <button className={tool === 'messages' ? 'active' : ''} onClick={() => setTool('messages')}><Mail /><span><b>MESSAGES</b><small>Hear from people</small></span>{foundChoices.length > 0 && <i />}</button>
        </nav>

        <div className="tool-screen">
          {tool === 'report' && <Report stage={stage} selectedRow={selectedRow} onSelect={setSelectedRow} onAudit={() => setTool('audit')} />}
          {tool === 'audit' && <AuditDesk stage={stage} done={done} remaining={remaining} onRun={runAudit} />}
          {tool === 'messages' && <Messages message={message} stage={stage} found={foundChoices} />}
        </div>

        <aside className="mission-card">
          <span className="mission-label">{stageId === 'onboarding' ? 'YOUR FIRST AUDIT' : 'CURRENT OBJECTIVE'}</span>
          <h2>{stage.question}</h2>
          {stage.guide && done.length === 0 ? <div className="guide-box"><Sparkles /><p>{stage.guide}</p></div> : (
            <div className="evidence-stack">
              <span>EVIDENCE FOUND</span>
              {foundChoices.length === 0 ? <p className="empty-evidence">Nothing yet. A useful check connects a number to the real world.</p> : foundChoices.map((choice) => <div key={choice.id}><Stamp /><span><b>{choice.evidence}</b><small>{choice.title}</small></span></div>)}
            </div>
          )}
          {done.length === 0 && <button className="big-action" onClick={() => setTool('audit')}>Choose an audit <ArrowRight /></button>}
          {stageId !== 'level5' && stageComplete && <button className="big-action success" onClick={nextStage}>Continue to {stageId === 'onboarding' ? 'Level 1' : 'Level 5'} <ArrowRight /></button>}
          {stageId === 'level5' && (stageComplete || debug) && <button className="big-action danger" onClick={() => setShowDecision(true)}>Face the board <ArrowRight /></button>}
          {debug && <button className="debug-reset" onClick={reset}><RotateCcw /> Reset demo</button>}
        </aside>
      </section>

      {running && <div className="overlay"><div className="running-card"><div className="sonar"><Waves /></div><span>AUDIT IN PROGRESS</span><h2>{running.title}</h2><p>Following the paper trail…</p><div className="loader"><i /></div></div></div>}

      {result && <div className="overlay"><article className="result-card"><button className="close" onClick={() => setResult(null)}><X /></button><div className="result-icon"><Check /></div><span>AUDIT COMPLETE</span><h2>{result.finding}</h2><div className="evidence-ticket"><Stamp /><span><small>EVIDENCE ADDED</small><b>{result.evidence}</b></span></div><div className="message-preview"><MessageSquareText /><p><b>{result.noteFrom}</b> “{result.note}”</p></div><button onClick={() => { setResult(null); setTool('messages') }}>Read the message <ArrowRight /></button></article></div>}

      {showDecision && !ending && <div className="overlay dark"><article className="decision-card"><button className="close" onClick={() => setShowDecision(false)}><X /></button><span>BOARD VOTE · FINAL DECISION</span><h2>What do you tell them?</h2><p>You found <b>{strongEvidence} strong lead{strongEvidence === 1 ? '' : 's'}</b>. Finance is asking for an immediate vote.</p><div className="decision-options"><button onClick={() => setEnding('close')}><i>A</i><span><b>Close North Reef</b><small>Accept the reported loss and end the route.</small></span><ChevronRight /></button><button className={strongEvidence >= 2 ? 'supported' : ''} onClick={() => setEnding('protect')}><i>B</i><span><b>Protect the route and disclose Lysa</b><small>Freeze Aster cargo, protect the islanders, and investigate Finance.</small></span>{strongEvidence >= 2 && <em>SUPPORTED</em>}<ChevronRight /></button></div></article></div>}

      {ending && <div className={`ending ${ending}`}><div className="ending-content"><Ship /><span>{ending === 'protect' && strongEvidence >= 2 ? 'THE LIGHTS STAY ON' : 'ROUTE 04 · CLOSED'}</span><h1>{ending === 'protect' && strongEvidence >= 2 ? 'You found the story behind the numbers.' : ending === 'protect' ? 'You had the truth, but not the proof.' : 'The cleanest answer was not the honest one.'}</h1><p>{ending === 'protect' && strongEvidence >= 2 ? 'The board suspends Finance, seals the hidden cargo, and places Lysa under emergency service. Captain Vale’s last message is only four words: “We saw the lights.”' : 'North Reef disappears from next month’s report. So do the passengers beyond Beacon 9. Profit improves. The horizon gets darker.'}</p><button onClick={reset}><RotateCcw /> Play the three-part demo again</button></div></div>}
    </main>
  )
}

function Report({ stage, selectedRow, onSelect, onAudit }: { stage: Stage; selectedRow: string; onSelect: (id: string) => void; onAudit: () => void }) {
  return <section className="report-screen"><div className="tool-title"><div><span>TOOL 01 · REPORT</span><h2>Route snapshot</h2></div><Search /></div><div className="report-table"><div className="report-head"><span>ACCOUNT</span>{stage.columns.map((col) => <span key={col}>{col}</span>)}<span>CHANGE</span></div>{stage.rows.map((row) => <button key={row.id} className={`${selectedRow === row.id ? 'selected' : ''} ${row.tone ?? ''}`} onClick={() => onSelect(row.id)}><b>{row.label}</b>{row.values.map((value) => <span key={value}>{value}</span>)}<em>{row.change}</em></button>)}</div><div className="report-tip"><span><b>{stage.rows.find((row) => row.id === selectedRow)?.label}</b><small>{selectedRow === stage.focus ? 'This is the number your question points toward.' : 'Selected account'}</small></span><button onClick={onAudit}>Audit this story <ArrowRight /></button></div></section>
}

function AuditDesk({ stage, done, remaining, onRun }: { stage: Stage; done: string[]; remaining: number; onRun: (choice: Choice) => void }) {
  return <section className="audit-screen"><div className="tool-title"><div><span>TOOL 02 · AUDIT</span><h2>Choose how to check.</h2><p>{stage.id === 'onboarding' ? 'I’ll guide this one.' : `You have ${remaining} day${remaining === 1 ? '' : 's'} left. Different checks reveal different parts of the story.`}</p></div><FileCheck2 /></div><div className="audit-cards">{stage.choices.map((choice, index) => { const isDone = done.includes(choice.id); const unavailable = choice.time > remaining; return <button key={choice.id} className={`${choice.strong ? 'strong' : ''} ${isDone ? 'done' : ''}`} onClick={() => onRun(choice)} disabled={isDone || unavailable}><div className="choice-top"><span>{stage.id === 'onboarding' ? <Sparkles /> : <AuditIcon kind={choice.icon} />}</span><em>{choice.time === 0 ? 'GUIDED' : `${choice.time} DAY${choice.time === 1 ? '' : 'S'}`}</em></div><h3>{choice.title}</h3><p>{choice.detail}</p><div>{isDone ? <><Check /> COMPLETE</> : unavailable ? 'NOT ENOUGH TIME' : <>RUN AUDIT <ArrowRight /></>}</div>{stage.id === 'onboarding' && index === 0 && !isDone && <i className="pick-me">START HERE</i>}</button> })}</div></section>
}

function Messages({ message, stage, found }: { message: { from: string; body: string; new: boolean }; stage: Stage; found: Choice[] }) {
  return <section className="messages-screen"><div className="tool-title"><div><span>TOOL 03 · MESSAGES</span><h2>People know what cells don’t.</h2></div><Mail /></div><article className={message.new ? 'new' : ''}><div className="portrait">{message.from.split(/[ ,]/).map((part) => part[0]).slice(0, 2).join('')}</div><div><span>{message.new ? 'NEW MESSAGE' : 'MESSAGE'}</span><h3>{message.from}</h3><p>{message.body}</p></div></article>{found.length > 1 && <div className="older-messages"><span>EARLIER FINDINGS</span>{found.slice(0, -1).reverse().map((choice) => <div key={choice.id}><Check /><span><b>{choice.noteFrom}</b><small>{choice.evidence}</small></span></div>)}</div>}<div className="message-foot"><Anchor /><p>{stage.id === 'onboarding' ? 'Good audits do not only find problems. They can find room to grow.' : stage.id === 'level1' ? 'An odd number is a clue, not a conviction.' : 'When the records and people agree, you have a case.'}</p></div></section>
}

export default App
