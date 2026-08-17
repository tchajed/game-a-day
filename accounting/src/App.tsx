import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Anchor,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileSearch,
  Mail,
  LockKeyhole,
  MapPinned,
  MessageSquareText,
  NotebookPen,
  RotateCcw,
  Search,
  Send,
  Ship,
  Stamp,
  X,
} from 'lucide-react'

type StageId = 'onboarding' | 'level1' | 'level5'
type Tool = 'report' | 'journal' | 'messages'
type TutorialMailState = 'draft' | 'sent' | 'reply'
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
type PendingAudit = { choiceId: string; remaining: number; startedDay: number }
type QuestDiscovery =
  | { factId: string; source: 'message'; revealedBy: string }
  | { factId: string; source: 'report'; rowId: string; revealedBy: string }
type QuestPlan = {
  discovery: QuestDiscovery
  email: { requires: string[]; grants: string; label: string; text: string }
  requests: { requires: string[]; availableAfter: 'email-sent' | 'staff-reply' }
  openQuestion: string
  journalOpening: string
}

type Stage = {
  id: StageId
  number: string
  kicker: string
  quest: QuestPlan
  days: number
  columns: string[]
  rows: Array<{ id: string; label: string; values: string[]; change: string; tone?: 'good' | 'warn' | 'bad' }>
  choices: Choice[]
}

const stages: Record<StageId, Stage> = {
  onboarding: {
    id: 'onboarding', number: 'TUTORIAL', kicker: 'A QUIET TUESDAY',
    quest: {
      discovery: { factId: 'extra-sailing-proposed', source: 'message', revealedBy: 'Mara’s email proposes another sailing after two freight calls were turned away.' },
      email: { requires: ['extra-sailing-proposed'], grants: 'capacity-question-open', label: 'Ask what to check first', text: 'Not yet. Before we pay for another run, Mira, what can we check to find out how full Kestrel’s cargo deck really is?' },
      requests: { requires: ['capacity-question-open'], availableAfter: 'staff-reply' },
      openQuestion: 'How full is the cargo deck, really?',
      journalOpening: 'Before paying for another sailing, I need to know whether Kestrel is actually full.',
    },
    days: 1, columns: ['LAST MONTH', 'THIS MONTH'],
    rows: [
      { id: 'tickets', label: 'Passenger tickets', values: ['¤ 42,800', '¤ 45,200'], change: '+6%', tone: 'good' },
      { id: 'cargo', label: 'Cargo sales', values: ['¤ 18,400', '¤ 19,100'], change: '+4%', tone: 'good' },
      { id: 'fuel', label: 'Fuel', values: ['¤ 12,900', '¤ 13,100'], change: '+2%' },
      { id: 'profit', label: 'Route profit', values: ['¤ 11,600', '¤ 13,900'], change: '+20%', tone: 'good' },
    ],
    choices: [{ id: 'capacity', title: 'Check deck capacity', detail: 'Compare sold weight with safe capacity.', time: 1, icon: 'records', strong: true,
      finding: 'The deck sails only 61% full. Market-day freight alone could fill most of the gap—without adding a sailing.', evidence: '39% unused cargo capacity', noteFrom: 'Mira, dock clerk', note: 'Farmers keep asking about market-day crates. We have always told them the deck is full. It clearly is not.' }],
  },
  level1: {
    id: 'level1', number: 'LEVEL 1', kicker: 'THE VANISHING BICYCLES',
    quest: {
      discovery: { factId: 'bicycle-fees-down-34', source: 'report', rowId: 'bikes', revealedBy: 'Route report · Bicycle fees · −34%' },
      email: { requires: ['bicycle-fees-down-34'], grants: 'bicycle-question-open', label: 'Challenge the −34% bicycle figure', text: 'Cash is intact and passengers are up. So why are bicycle fees down 34%? Before we blame the dock, trace where those fees went.' },
      requests: { requires: ['bicycle-question-open'], availableAfter: 'email-sent' },
      openQuestion: 'Why are bicycle fees down 34%?',
      journalOpening: 'The cash is present and passengers are up. The bicycle line is the thing that does not fit.',
    },
    days: 3, columns: ['EXPECTED', 'REPORTED'],
    rows: [
      { id: 'tickets', label: 'Passenger tickets', values: ['¤ 47,600', '¤ 51,200'], change: '+8%', tone: 'good' },
      { id: 'bikes', label: 'Bicycle fees', values: ['¤ 6,400', '¤ 4,200'], change: '−34%', tone: 'warn' },
      { id: 'cargo', label: 'Cargo sales', values: ['¤ 20,100', '¤ 20,500'], change: '+2%' },
      { id: 'cash', label: 'Cash received', values: ['¤ 74,100', '¤ 75,900'], change: '+2%' },
    ],
    choices: [
      { id: 'sample', title: 'Sample ten tickets', detail: 'Trace bicycle tickets into the ledger.', time: 1, icon: 'records', strong: true,
        finding: 'All ten fees were collected. A new clerk posted them to Passenger tickets instead of Bicycle fees.', evidence: '10 ticket stubs matched', noteFrom: 'Jori, ticket clerk', note: 'That was me. The new screen puts “bicycle” under passenger extras. I used the line above it. I’m sorry—I can fix the batch.' },
      { id: 'ask', title: 'Ask the dockmaster', detail: 'Check whether fewer bicycles boarded.', time: 1, icon: 'people',
        finding: 'The dockmaster remembers a normal number of bicycles, but cannot explain where the fees were posted.', evidence: 'Verbal count only', noteFrom: 'Petra, dockmaster', note: 'Plenty of bicycles. More than last month, if anything. You should check with the ticket desk.' },
      { id: 'count', title: 'Count today’s bicycles', detail: 'Compare one sailing with today’s sales.', time: 1, icon: 'map',
        finding: 'Today’s count matches today’s sales. The earlier weekly discrepancy remains unresolved.', evidence: 'One sailing observed', noteFrom: 'Petra, dockmaster', note: 'Today looks fine. Whatever happened, it happened before this morning.' },
    ],
  },
  level5: {
    id: 'level5', number: 'LEVEL 5', kicker: 'THE NORTH REEF VOTE',
    quest: {
      discovery: { factId: 'fuel-up-72', source: 'report', rowId: 'fuel', revealedBy: 'Finance route report · Fuel · +72%' },
      email: { requires: ['fuel-up-72'], grants: 'north-reef-question-open', label: 'Ask about the +72% fuel jump', text: 'A loss does not explain seventy-two percent more fuel. What is Kestrel doing after Beacon 9? I want records from outside Finance.' },
      requests: { requires: ['north-reef-question-open'], availableAfter: 'email-sent' },
      openQuestion: 'What is Kestrel doing after Beacon 9?',
      journalOpening: 'Finance sees a loss. Vale sees a reason for every extra litre. I need to find where the ship goes.',
    },
    days: 4, columns: ['OCTOBER', 'NOVEMBER'],
    rows: [
      { id: 'passengers', label: 'Passenger fares', values: ['¤ 151,800', '¤ 153,100'], change: '+1%' },
      { id: 'cargo', label: 'Cargo contracts', values: ['¤ 103,700', '¤ 119,600'], change: '+15%', tone: 'warn' },
      { id: 'fuel', label: 'Fuel', values: ['¤ 84,700', '¤ 145,900'], change: '+72%', tone: 'bad' },
      { id: 'profit', label: 'Route profit', values: ['¤ 63,600', '−¤ 17,900'], change: 'LOSS', tone: 'bad' },
    ],
    choices: [
      { id: 'gps', title: 'Recover GPS tracks', detail: 'Restore November route history.', time: 2, icon: 'map', strong: true,
        finding: 'Seven night voyages turn west after Beacon 9 and stop at Lysa—an inhabited island erased from public charts.', evidence: '7 recovered tracks to Lysa', noteFrom: 'Ivo, fleet systems', note: 'The bridge history was deleted. The antenna cache was not. Someone wanted these voyages forgotten.' },
      { id: 'weight', title: 'Cross-check cargo', detail: 'Compare manifests with weighbridge records.', time: 2, icon: 'records', strong: true,
        finding: 'Kestrel carried 74 undeclared tonnes for Aster Trading. Finance signed every late manifest.', evidence: '74 hidden tonnes', noteFrom: 'Oren, dockmaster', note: 'The scales are right. The manifests are fiction. Aster trucks arrive after my freight office closes.' },
      { id: 'scans', title: 'Reconcile scans', detail: 'Match boardings with destinations.', time: 1, icon: 'records', strong: true,
        finding: 'Thirty-seven passengers boarded late sailings and never scanned off at any listed port.', evidence: '37 open journeys', noteFrom: 'Mina, ticketing', note: 'It is not a reader fault. The same people disappear after Beacon 9 every Thursday.' },
      { id: 'captain', title: 'Interview Captain Vale', detail: 'Ask about fuel and night sailings.', time: 2, icon: 'people',
        finding: 'Vale says Kestrel supplies sixty-two people on Lysa. She also alleges Finance sells spare hold space to smugglers.', evidence: 'Captain’s signed statement', noteFrom: 'Captain Vale', note: 'Lysa was struck from the map. Its people did not stop existing. Protect my crew, and I will testify.' },
    ],
  },
}

for (const stage of Object.values(stages)) {
  const { discovery, email, requests } = stage.quest
  if (!email.requires.includes(discovery.factId)) throw new Error(`${stage.id}: email must require its discovered fact`)
  if (!requests.requires.includes(email.grants)) throw new Error(`${stage.id}: requests must require the email’s granted fact`)
  if (discovery.source === 'report' && !stage.rows.some((row) => row.id === discovery.rowId)) throw new Error(`${stage.id}: report discovery row is missing`)
}

const order: StageId[] = ['onboarding', 'level1', 'level5']
const emptyPending = (): Record<StageId, PendingAudit[]> => ({ onboarding: [], level1: [], level5: [] })

function RequestIcon({ kind }: { kind: Choice['icon'] }) {
  return kind === 'map' ? <MapPinned /> : kind === 'people' ? <MessageSquareText /> : <FileSearch />
}

function playMailSound(context: AudioContext, kind: 'send' | 'received') {
  const now = context.currentTime
  const tone = (frequency: number, start: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now + start)
    gain.gain.setValueAtTime(0.0001, now + start)
    gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now + start)
    oscillator.stop(now + start + duration + 0.02)
  }
  if (kind === 'send') {
    tone(560, 0, 0.13, 0.05, 'triangle')
    tone(820, 0.08, 0.16, 0.045, 'triangle')
    return
  }
  tone(659, 0, 0.24, 0.055)
  tone(880, 0.16, 0.3, 0.06)
  tone(1175, 0.32, 0.38, 0.045)
}

function App() {
  const [stageId, setStageId] = useState<StageId>('onboarding')
  const [tool, setTool] = useState<Tool>('messages')
  const [selectedRow, setSelectedRow] = useState('')
  const [questionUnlocked, setQuestionUnlocked] = useState<Record<StageId, boolean>>({ onboarding: false, level1: false, level5: false })
  const [tutorialMailState, setTutorialMailState] = useState<TutorialMailState>('draft')
  const audioContext = useRef<AudioContext | null>(null)
  const [completed, setCompleted] = useState<Record<StageId, string[]>>({ onboarding: [], level1: [], level5: [] })
  const [pending, setPending] = useState<Record<StageId, PendingAudit[]>>(emptyPending)
  const [daysSpent, setDaysSpent] = useState<Record<StageId, number>>({ onboarding: 0, level1: 0, level5: 0 })
  const [result, setResult] = useState<Choice | null>(null)
  const [resultQueue, setResultQueue] = useState<Choice[]>([])
  const [journalVisible, setJournalVisible] = useState(false)
  const [showDecision, setShowDecision] = useState(false)
  const [ending, setEnding] = useState<'protect' | 'close' | null>(null)
  const params = new URLSearchParams(location.search)
  const debug = params.get('debug') === 'true'
  const soundEnabled = params.get('sound') !== 'off'
  const tutorialThreadRead = tutorialMailState === 'reply'
  const stage = stages[stageId]
  const stageIndex = order.indexOf(stageId)
  const done = completed[stageId]
  const stagePending = pending[stageId]
  const currentDay = daysSpent[stageId]
  const remaining = stage.days - currentDay
  const foundChoices = stage.choices.filter((choice) => done.includes(choice.id))
  const strongEvidence = foundChoices.filter((choice) => choice.strong).length
  const questionIsUnlocked = questionUnlocked[stageId]
  const hasReportDiscovery = stage.quest.discovery.source === 'report'
  const discoveryMade = stage.quest.discovery.source === 'message' || selectedRow === stage.quest.discovery.rowId
  const knownFacts = new Set<string>()
  if (discoveryMade) knownFacts.add(stage.quest.discovery.factId)
  const emailCommitted = questionIsUnlocked && (stageId !== 'onboarding' || tutorialMailState !== 'draft')
  if (emailCommitted) knownFacts.add(stage.quest.email.grants)
  const emailRequirementsMet = stage.quest.email.requires.every((fact) => knownFacts.has(fact))
  const requestRequirementsMet = stage.quest.requests.requires.every((fact) => knownFacts.has(fact))
  const requestTimingMet = stage.quest.requests.availableAfter === 'email-sent' || tutorialMailState === 'reply'
  const requestsUnlocked = requestRequirementsMet && requestTimingMet
  const requestedToday = stagePending.some((item) => item.startedDay === currentDay)

  useEffect(() => {
    if (tutorialMailState !== 'sent') return
    const replyTimer = window.setTimeout(() => {
      setTutorialMailState('reply')
      const context = audioContext.current
      if (soundEnabled && context) void context.resume().then(() => playMailSound(context, 'received'))
    }, 1800)
    return () => window.clearTimeout(replyTimer)
  }, [soundEnabled, tutorialMailState])

  useEffect(() => () => { void audioContext.current?.close() }, [])

  useEffect(() => {
    setJournalVisible(false)
    if (!result) return
    const journalTimer = window.setTimeout(() => setJournalVisible(true), 650)
    return () => window.clearTimeout(journalTimer)
  }, [result])

  const message = useMemo(() => {
    const latest = foundChoices.at(-1)
    if (latest) return { from: latest.noteFrom, body: latest.note, new: true }
    if (stageId === 'onboarding') return { from: 'Mira, dock clerk', body: 'Morning. The accounts are ready. Start with the cargo line—I think the boat has more room than we tell people.', new: false }
    if (stageId === 'level1') return { from: 'Mara, route manager', body: 'The cash total reconciles and passenger volume is healthy. I attached the route report; one operating line does not fit. Find it before we write back.', new: false }
    return { from: 'Captain Vale', body: 'The board sees only this month’s loss. Finance attached its route report. Find what changed before we answer them.', new: false }
  }, [foundChoices, stageId])

  function ensureAudio(kind: 'send' | 'received') {
    if (!soundEnabled) return
    const context = audioContext.current ?? new AudioContext()
    audioContext.current = context
    void context.resume().then(() => playMailSound(context, kind))
  }

  function jumpTo(id: StageId) {
    setStageId(id)
    setTool('messages')
    setSelectedRow('')
    setResult(null)
    setResultQueue([])
    setShowDecision(false)
    setEnding(null)
  }

  function unlockQuestion() {
    if (stageId !== 'onboarding') ensureAudio('send')
    setQuestionUnlocked((all) => ({ ...all, [stageId]: true }))
  }

  function sendTutorialReply() {
    if (tutorialMailState !== 'draft') return
    ensureAudio('send')
    setTutorialMailState('sent')
  }

  function queueAudit(choice: Choice) {
    const alreadyPending = stagePending.some((item) => item.choiceId === choice.id)
    if (!requestsUnlocked || requestedToday || done.includes(choice.id) || alreadyPending || choice.time > remaining) return
    ensureAudio('send')
    setPending((all) => ({
      ...all,
      [stageId]: [...all[stageId], { choiceId: choice.id, remaining: choice.time, startedDay: currentDay }],
    }))
  }

  function advanceDay() {
    if (remaining <= 0 || stagePending.length === 0) return
    const progressed = stagePending.map((item) => ({ ...item, remaining: item.remaining - 1 }))
    const arrivals = progressed.filter((item) => item.remaining <= 0)
    const waiting = progressed.filter((item) => item.remaining > 0)
    setPending((all) => ({ ...all, [stageId]: waiting }))
    setDaysSpent((all) => ({ ...all, [stageId]: all[stageId] + 1 }))
    if (arrivals.length > 0) {
      setCompleted((all) => ({ ...all, [stageId]: [...all[stageId], ...arrivals.map((item) => item.choiceId)] }))
      const replies = arrivals.map((item) => stage.choices.find((choice) => choice.id === item.choiceId)).filter((choice): choice is Choice => Boolean(choice))
      setResult(replies[0] ?? null)
      setResultQueue(replies.slice(1))
      setTool('messages')
      ensureAudio('received')
    }
  }

  function dismissResult() {
    const next = resultQueue[0] ?? null
    setResult(next)
    setResultQueue((queue) => queue.slice(1))
  }

  function nextStage() {
    if (stageIndex < order.length - 1) jumpTo(order[stageIndex + 1])
  }

  function reset() {
    setCompleted({ onboarding: [], level1: [], level5: [] })
    setPending(emptyPending())
    setDaysSpent({ onboarding: 0, level1: 0, level5: 0 })
    setTutorialMailState('draft')
    setQuestionUnlocked({ onboarding: false, level1: false, level5: false })
    jumpTo('onboarding')
  }

  const stageComplete = stageId === 'onboarding' ? done.length > 0 : stageId === 'level1' ? done.length > 0 : remaining === 0 || done.length >= 2
  const currentPrompt = !questionIsUnlocked
    ? hasReportDiscovery
      ? emailRequirementsMet ? 'Send your question.' : 'Open the report.'
      : 'Choose your reply.'
    : stageComplete
      ? 'Case solved.'
      : stageId === 'onboarding' && tutorialMailState === 'draft'
        ? 'Reply to Mara.'
        : stageId === 'onboarding' && tutorialMailState === 'sent'
          ? 'Waiting for Mira…'
          : requestedToday
            ? 'Request sent. End the day.'
            : stagePending.length > 0
              ? 'One reply is pending.'
              : 'Choose today’s request.'

  return (
    <main className={`game stage-${stageId}`}>
      <div className="chart-lines" />
      <header className="game-header">
        <div className="brand"><span><Anchor /></span><div><b>NORTHSTAR</b><small>THE LEDGER GAME</small></div></div>
        <nav className="voyage-progress" aria-label="Demo chapters">
          {order.map((id, index) => <button key={id} className={`${id === stageId ? 'current' : ''} ${index < stageIndex ? 'past' : ''}`} onClick={() => jumpTo(id)}><i>{index < stageIndex ? <Check /> : index + 1}</i><span>{stages[id].number}</span></button>)}
        </nav>
        <div className="day-counter"><Clock3 /><span><b>{remaining}</b><small>DAYS LEFT</small></span></div>
      </header>

      <section className={`chapter-intro ${questionIsUnlocked ? 'unlocked' : 'locked'}`}>
        <div className="chapter-marker"><span>{stage.number}</span><b>{stage.kicker}</b></div>
        {questionIsUnlocked
          ? <div className="chapter-question"><Search /><span><small>OPEN QUESTION</small><b>{stage.quest.openQuestion}</b></span></div>
          : <div className="question-lock" aria-label="Open question locked"><LockKeyhole /><span>LOCKED</span></div>}
      </section>

      <section className="play-area">
        <nav className="tools" aria-label="Investigation tools">
          <button className={tool === 'messages' ? 'active' : ''} onClick={() => setTool('messages')}><Mail /><span><b>MESSAGES</b></span>{(stageId === 'onboarding' && !tutorialThreadRead) || foundChoices.length > 0 ? <i /> : null}</button>
          <button disabled={!hasReportDiscovery} className={tool === 'report' ? 'active' : ''} onClick={() => setTool('report')}><BookOpen /><span><b>REPORT</b></span>{hasReportDiscovery && !emailRequirementsMet && <i />}</button>
          <button disabled={!questionIsUnlocked} className={tool === 'journal' ? 'active' : ''} onClick={() => setTool('journal')}><NotebookPen /><span><b>JOURNAL</b></span>{foundChoices.length > 0 && <i />}</button>
        </nav>

        <div className="tool-screen" key={tool}>
          {tool === 'report' && <Report stage={stage} selectedRow={selectedRow} onSelect={setSelectedRow} onContinue={() => setTool('messages')} />}
          {tool === 'journal' && <Journal stage={stage} found={foundChoices} pending={stagePending} />}
          {tool === 'messages' && <Messages message={message} stage={stage} found={foundChoices} pending={stagePending} remaining={remaining} requestedToday={requestedToday} questionUnlocked={questionIsUnlocked} discoveryMade={emailRequirementsMet} requestsUnlocked={requestsUnlocked} tutorialMailState={tutorialMailState} onUnlockQuestion={unlockQuestion} onTutorialSend={sendTutorialReply} onOpenReport={() => setTool('report')} onQueue={queueAudit} />}
        </div>

        <aside className="mission-card day-card">
          <span className="mission-label">DAY {currentDay + 1} · TODAY</span>
          <h2>{currentPrompt}</h2>
          {stagePending.length > 0 && <div className="day-agenda">
            <span>OUTBOX</span>
            {stagePending.map((item) => {
              const choice = stage.choices.find((candidate) => candidate.id === item.choiceId)!
              return <div key={item.choiceId}><Clock3 /><span><b>{choice.title}</b><small>{item.remaining} day{item.remaining === 1 ? '' : 's'}</small></span></div>
            })}
          </div>}
          {remaining > 0 && stagePending.length > 0 && <button className="big-action next-day" onClick={advanceDay}>End day <ArrowRight /></button>}
          {stageId !== 'level5' && stageComplete && <button className="big-action success" onClick={nextStage}>Continue to {stageId === 'onboarding' ? 'Level 1' : 'Level 5'} <ArrowRight /></button>}
          {stageId === 'level5' && (stageComplete || debug) && <button className="big-action danger" onClick={() => setShowDecision(true)}>Face the board <ArrowRight /></button>}
          {debug && <button className="debug-reset" onClick={reset}><RotateCcw /> Reset demo</button>}
        </aside>
      </section>

      {result && <div className="overlay"><article className="result-card mail-result"><button className="close" onClick={dismissResult}><X /></button><div className="mail-result-heading"><div className="result-icon"><Mail /></div><div><span>NEW EMAIL · REQUEST COMPLETE</span><h2>{result.noteFrom}</h2></div></div><div className="result-email"><header><b>{result.noteFrom}</b><time>THIS MORNING</time></header><p>{result.note}</p></div><div className={`journal-response ${journalVisible ? 'writing' : ''}`} aria-live="polite"><div><NotebookPen /><span><small>ADDED TO JOURNAL</small><b>{journalVisible ? 'Writing…' : 'Reading…'}</b></span></div>{journalVisible && <p>{result.finding}</p>}</div>{journalVisible && <div className="evidence-ticket"><Stamp /><span><small>KEY EVIDENCE</small><b>{result.evidence}</b></span></div>}<button disabled={!journalVisible} onClick={() => { dismissResult(); setTool('messages') }}>{resultQueue.length > 0 ? 'Read next reply' : 'Back to inbox'} <ArrowRight /></button></article></div>}

      {showDecision && !ending && <div className="overlay dark"><article className="decision-card"><button className="close" onClick={() => setShowDecision(false)}><X /></button><span>BOARD VOTE · FINAL DECISION</span><h2>What do you tell them?</h2><p>You found <b>{strongEvidence} strong lead{strongEvidence === 1 ? '' : 's'}</b>. Finance is asking for an immediate vote.</p><div className="decision-options"><button onClick={() => setEnding('close')}><i>A</i><span><b>Close North Reef</b><small>Accept the reported loss and end the route.</small></span><ChevronRight /></button><button className={strongEvidence >= 2 ? 'supported' : ''} onClick={() => setEnding('protect')}><i>B</i><span><b>Protect the route and disclose Lysa</b><small>Freeze Aster cargo, protect the islanders, and investigate Finance.</small></span>{strongEvidence >= 2 && <em>SUPPORTED</em>}<ChevronRight /></button></div></article></div>}

      {ending && <div className={`ending ${ending}`}><div className="ending-content"><Ship /><span>{ending === 'protect' && strongEvidence >= 2 ? 'THE LIGHTS STAY ON' : 'ROUTE 04 · CLOSED'}</span><h1>{ending === 'protect' && strongEvidence >= 2 ? 'You found the story behind the numbers.' : ending === 'protect' ? 'You had the truth, but not the proof.' : 'The cleanest answer was not the honest one.'}</h1><p>{ending === 'protect' && strongEvidence >= 2 ? 'The board suspends Finance, seals the hidden cargo, and places Lysa under emergency service. Captain Vale’s last message is only four words: “We saw the lights.”' : 'North Reef disappears from next month’s report. So do the passengers beyond Beacon 9. Profit improves. The horizon gets darker.'}</p><button onClick={reset}><RotateCcw /> Play the three-part demo again</button></div></div>}
    </main>
  )
}

function Report({ stage, selectedRow, onSelect, onContinue }: { stage: Stage; selectedRow: string; onSelect: (id: string) => void; onContinue: () => void }) {
  const selected = stage.rows.find((row) => row.id === selectedRow)
  const focusId = stage.quest.discovery.source === 'report' ? stage.quest.discovery.rowId : ''
  const focusSelected = selectedRow === focusId
  return <section className="report-screen"><div className="tool-title"><div><span>ATTACHMENT</span><h2>Route report</h2></div><Search /></div><div className="report-table"><div className="report-head"><span>ACCOUNT</span>{stage.columns.map((col) => <span key={col}>{col}</span>)}<span>CHANGE</span></div>{stage.rows.map((row) => <button key={row.id} className={`${selectedRow === row.id ? 'selected' : ''} ${row.tone ?? ''}`} onClick={() => onSelect(row.id)}><b>{row.label}</b>{row.values.map((value) => <span key={value}>{value}</span>)}<em>{row.change}</em></button>)}</div><div className="report-tip"><span><b>{selected?.label ?? 'No account selected'}</b><small>{focusSelected ? 'Discrepancy identified. You can now cite this figure in your email.' : selected ? 'Interesting, but this line moves with the rest of the report.' : 'Look for the line that does not fit the rest of the report.'}</small></span><button disabled={!focusSelected} onClick={onContinue}>{focusSelected ? 'Return to email' : 'Find the unusual line'} {focusSelected && <ArrowRight />}</button></div></section>
}

function Journal({ stage, found, pending }: { stage: Stage; found: Choice[]; pending: PendingAudit[] }) {
  return <section className="journal-screen"><div className="tool-title"><div><span>PRIVATE JOURNAL</span><h2>{stage.quest.openQuestion}</h2></div><NotebookPen /></div><div className="journal-pages"><article className="journal-opening"><small>OPEN QUESTION</small><p>{stage.quest.journalOpening}</p></article>{found.map((choice, index) => <article className="journal-entry" key={choice.id}><header><span>FINDING {String(index + 1).padStart(2, '0')}</span><Stamp /></header><h3>{choice.evidence}</h3><p>{choice.finding}</p><small>Source: reply from {choice.noteFrom}</small></article>)}{pending.length > 0 && <div className="journal-pending"><Clock3 /><span><b>{pending.length} request{pending.length === 1 ? '' : 's'} in progress</b><small>The journal updates only when a reply supplies new evidence.</small></span></div>}</div></section>
}

function RequestDesk({ stage, found, pending, remaining, requestedToday, onQueue }: { stage: Stage; found: Choice[]; pending: PendingAudit[]; remaining: number; requestedToday: boolean; onQueue: (choice: Choice) => void }) {
  return <div className="request-desk"><div className="request-heading"><span>CHOOSE TODAY’S REQUEST</span></div><div className="request-cards">{stage.choices.map((choice) => {
    const isDone = found.some((item) => item.id === choice.id)
    const queued = pending.find((item) => item.choiceId === choice.id)
    const tooLate = choice.time > remaining
    const disabled = isDone || Boolean(queued) || tooLate || requestedToday
    return <button key={choice.id} className={`${isDone ? 'done' : ''} ${queued ? 'queued' : ''}`} disabled={disabled} onClick={() => onQueue(choice)}><span className="request-icon"><RequestIcon kind={choice.icon} /></span><span><b>{choice.title}</b><small>{choice.detail}</small><em>{isDone ? 'REPLY RECEIVED' : queued ? `SENT · ${queued.remaining} DAY${queued.remaining === 1 ? '' : 'S'}` : tooLate ? 'TOO LATE TO REPLY' : requestedToday ? 'AVAILABLE TOMORROW' : `SEND · ${choice.time} DAY${choice.time === 1 ? '' : 'S'}`}</em></span></button>
  })}</div></div>
}

function DialogueChoice({ stage, onChoose }: { stage: Stage; onChoose: () => void }) {
  return <div className="dialogue-choice"><span>YOUR REPLY</span><button onClick={onChoose}><MessageSquareText /><b>{stage.quest.email.label}</b><ChevronRight /></button></div>
}

function Messages({ message, stage, found, pending, remaining, requestedToday, questionUnlocked, discoveryMade, requestsUnlocked, tutorialMailState, onUnlockQuestion, onTutorialSend, onOpenReport, onQueue }: { message: { from: string; body: string; new: boolean }; stage: Stage; found: Choice[]; pending: PendingAudit[]; remaining: number; requestedToday: boolean; questionUnlocked: boolean; discoveryMade: boolean; requestsUnlocked: boolean; tutorialMailState: TutorialMailState; onUnlockQuestion: () => void; onTutorialSend: () => void; onOpenReport: () => void; onQueue: (choice: Choice) => void }) {
  if (stage.id === 'onboarding' && found.length === 0) {
    const sent = tutorialMailState !== 'draft'
    const replied = tutorialMailState === 'reply'
    const reply = stage.quest.email.text
    return <section className="messages-screen tutorial-mail"><div className="tool-title"><div><span>INBOX</span><h2>Morning mail</h2></div><Mail /></div><div className="thread-subject"><h3>Add another sailing?</h3><small>{replied ? '3' : sent ? '2' : '1'} message{!sent ? '' : 's'}</small></div><div className="email-thread" aria-live="polite"><article className="thread-message"><div className="portrait">MR</div><div><header><span><b>Mara Rinne</b> · Route manager</span><time>08:12</time></header><p>We turned away two freight calls last week. Should I ask the harbor for a price on an extra Wednesday sailing?</p>{!questionUnlocked && <DialogueChoice stage={stage} onChoose={onUnlockQuestion} />}</div></article>{questionUnlocked && !sent && <article className="thread-message reply-composer"><div className="portrait">YOU</div><div><header><span><b>Reply all</b> · Mara, Mira</span><time>DRAFT</time></header><p>{reply}</p><button className="send-mail" onClick={onTutorialSend}><Send /> Send</button></div></article>}{sent && <article className="thread-message player-message sent-message"><div className="portrait">YOU</div><div><header><span><b>You</b> · Owner</span><time>08:19</time></header><p>{reply}</p></div></article>}{tutorialMailState === 'sent' && <div className="mail-waiting" role="status"><i /><span><b>Sent</b><small>Waiting for Mira…</small></span></div>}{replied && <article className="thread-message incoming-message"><div className="portrait">MK</div><div><header><span><b>Mira Koski</b> · Dock clerk</span><time>08:22</time></header><p>I’ll check the freight slips against Kestrel’s loading limit.</p></div></article>}</div>{requestsUnlocked && <RequestDesk stage={stage} found={found} pending={pending} remaining={remaining} requestedToday={requestedToday} onQueue={onQueue} />}</section>
  }

  const discovery = stage.quest.discovery
  return <section className="messages-screen"><div className="tool-title"><div><span>INBOX</span><h2>{found.length > 0 ? 'Latest reply' : 'New mail'}</h2></div><Mail /></div><article className={message.new ? 'new' : ''}><div className="portrait">{message.from.split(/[ ,]/).map((part) => part[0]).slice(0, 2).join('')}</div><div><span>{message.new ? 'NEW REPLY' : 'NEW MESSAGE'}</span><h3>{message.from}</h3><p>{message.body}</p>{!questionUnlocked && !discoveryMade && discovery.source === 'report' && <button className="attachment-button" onClick={onOpenReport}><BookOpen /><span><b>Open route report</b><small>Identify the line that does not fit before replying.</small></span><ArrowRight /></button>}{!questionUnlocked && discoveryMade && <><div className="discovery-source"><Check /><span><small>OBSERVED</small><b>{discovery.revealedBy}</b></span></div><DialogueChoice stage={stage} onChoose={onUnlockQuestion} /></>}</div></article>{questionUnlocked && !message.new && <article className="player-dialogue"><div className="portrait">YOU</div><div><span>YOUR EMAIL · SENT</span><p>{stage.quest.email.text}</p></div></article>}{requestsUnlocked && <RequestDesk stage={stage} found={found} pending={pending} remaining={remaining} requestedToday={requestedToday} onQueue={onQueue} />}{found.length > 1 && <div className="older-messages"><span>EARLIER REPLIES</span>{found.slice(0, -1).reverse().map((choice) => <div key={choice.id}><Check /><span><b>{choice.noteFrom}</b><small>{choice.evidence}</small></span></div>)}</div>}</section>
}

export default App
