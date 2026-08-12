import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Anchor,
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileSearch,
  Flag,
  Headphones,
  Inbox,
  Lightbulb,
  Mail,
  MapPinned,
  Music2,
  Paperclip,
  Play,
  RotateCcw,
  Search,
  ShipWheel,
  Sparkles,
  Stamp,
  VolumeX,
  Waves,
  X,
} from 'lucide-react'

type Phase = 'orientation' | 'mystery'
type View = 'ledger' | 'inbox' | 'evidence'
type SelectedCell = { row: string; col: string }
type RowKind = 'heading' | 'data' | 'total' | 'profit'

type LedgerRow = {
  id: string
  label: string
  kind: RowKind
  values?: Record<string, number>
  note?: string
}

type Audit = {
  id: string
  row: string
  title: string
  source: string
  days: number
  description: string
  finding: string
  evidence?: Evidence
  email?: GameEmail
}

type Evidence = {
  id: string
  icon: 'fuel' | 'passenger' | 'cargo' | 'map' | 'invoice' | 'repair'
  title: string
  kicker: string
  description: string
}

type GameEmail = {
  id: string
  from: string
  initials: string
  subject: string
  date: string
  body: string[]
  tone?: 'amber' | 'blue' | 'red'
}

const orientationRows: LedgerRow[] = [
  { id: 'income', label: 'OPERATING INCOME', kind: 'heading' },
  { id: 'passenger', label: 'Passenger fares', kind: 'data', values: { Q1: 812400, Q2: 846200 }, note: 'People, bicycles, and the occasional damp dog.' },
  { id: 'cargo', label: 'Cargo contracts', kind: 'data', values: { Q1: 334100, Q2: 361800 }, note: 'Freight billed by declared weight.' },
  { id: 'charter', label: 'Charter service', kind: 'data', values: { Q1: 95800, Q2: 82100 }, note: 'Private sailings and municipal contracts.' },
  { id: 'revenue', label: 'Total operating income', kind: 'total', values: { Q1: 1242300, Q2: 1290100 }, note: 'Everything earned before the sea takes its share.' },
  { id: 'costs', label: 'OPERATING COSTS', kind: 'heading' },
  { id: 'fuel', label: 'Fuel & lubricants', kind: 'data', values: { Q1: -298400, Q2: -312600 }, note: 'Diesel, oil, and reasons to watch the weather.' },
  { id: 'crew', label: 'Crew & payroll', kind: 'data', values: { Q1: -420900, Q2: -427300 }, note: 'Wages, overtime, meals, and shore leave.' },
  { id: 'maintenance', label: 'Maintenance', kind: 'data', values: { Q1: -187500, Q2: -171900 }, note: 'Scheduled service and unscheduled metal noises.' },
  { id: 'ports', label: 'Port fees & insurance', kind: 'data', values: { Q1: -166200, Q2: -169800 }, note: 'The privilege of touching land.' },
  { id: 'profit', label: 'OPERATING PROFIT', kind: 'profit', values: { Q1: 169300, Q2: 208500 }, note: 'What remains. In theory.' },
]

const mysteryRows: LedgerRow[] = [
  { id: 'income', label: 'OPERATING INCOME', kind: 'heading' },
  { id: 'passenger', label: 'Passenger fares', kind: 'data', values: { SEP: 148200, OCT: 151800, NOV: 153100 }, note: 'Ticket revenue is up. Headcount is not.' },
  { id: 'cargo', label: 'Cargo contracts', kind: 'data', values: { SEP: 86400, OCT: 103700, NOV: 119600 }, note: 'A strong month for a route with one cannery.' },
  { id: 'charter', label: 'Charter service', kind: 'data', values: { SEP: 12200, OCT: 11800, NOV: 12400 }, note: 'Private and municipal sailings.' },
  { id: 'revenue', label: 'Total operating income', kind: 'total', values: { SEP: 246800, OCT: 267300, NOV: 285100 }, note: 'Reported revenue for the North Reef service.' },
  { id: 'costs', label: 'OPERATING COSTS', kind: 'heading' },
  { id: 'fuel', label: 'Fuel & lubricants', kind: 'data', values: { SEP: -82100, OCT: -84700, NOV: -145900 }, note: 'November usage implies 611 extra nautical miles.' },
  { id: 'crew', label: 'Crew overtime', kind: 'data', values: { SEP: -44800, OCT: -46700, NOV: -63100 }, note: 'Night premiums appear on twelve unlisted shifts.' },
  { id: 'maintenance', label: 'Maintenance', kind: 'data', values: { SEP: -29700, OCT: -31200, NOV: -51800 }, note: 'Propeller and hull work, recently frequent.' },
  { id: 'ports', label: 'Port fees & insurance', kind: 'data', values: { SEP: -40800, OCT: -41100, NOV: -42200 }, note: 'No new port is listed. Curiously stable.' },
  { id: 'profit', label: 'ROUTE CONTRIBUTION', kind: 'profit', values: { SEP: 49400, OCT: 63600, NOV: -17900 }, note: 'The figure the board will vote on.' },
]

const initialEmails: GameEmail[] = [
  {
    id: 'board', from: 'Elina Voss · Board Secretary', initials: 'EV', subject: 'Agenda: North Reef route vote', date: 'Today, 08:12', tone: 'red',
    body: ['The board will meet in six working days to decide whether North Reef Service should be discontinued.', 'Please bring a recommendation supported by the November management accounts. Mr. Soren has requested that no operational delays be allowed to move the vote.'],
  },
  {
    id: 'cfo', from: 'Marek Soren · Finance Director', initials: 'MS', subject: 'November close — nothing exotic', date: 'Today, 07:46', tone: 'amber',
    body: ['Fuel made November ugly. That is all there is to it.', 'The route has been sentimentalized for too long. I suggest we keep the review narrow, close North Reef, and spend our time on profitable water.'],
  },
  {
    id: 'captain', from: 'Anja Vale · Captain, M/V Kestrel', initials: 'AV', subject: 'Before you close us', date: 'Yesterday, 22:19', tone: 'blue',
    body: ['Owner—', 'The numbers will say Kestrel is wasteful. The numbers do not wait on a black jetty in sleet for people who cannot be put on a timetable.', 'Ask for the records. Please.'],
  },
]

const audits: Audit[] = [
  {
    id: 'bunker', row: 'fuel', title: 'Request bunker delivery logs', source: 'Harbor fuel office', days: 1,
    description: 'Match each fuel delivery to vessel telemetry and dock status.',
    finding: 'Kestrel received 18,400 L while logged “cold and docked.” The delivery chit is countersigned by Finance—not the captain.',
    evidence: { id: 'fuel', icon: 'fuel', title: 'The dockside fuel', kicker: '18,400 L with nowhere to go', description: 'Fuel was delivered while Kestrel was officially cold and docked. Finance authorized it.' },
    email: { id: 'fuelmail', from: 'Leif Tor · Bunker Clerk', initials: 'LT', subject: 'RE: Delivery chits — you did not get this from me', date: 'Audit reply', tone: 'amber', body: ['The meter is not wrong. Eighteen thousand four hundred litres, 23:40, Pier 6.', 'Mr. Soren’s office told us to mark Kestrel docked. I kept the carbon copy because instructions like that have a way of becoming someone else’s mistake.'] },
  },
  {
    id: 'gps', row: 'fuel', title: 'Recover vessel GPS history', source: 'Fleet telemetry archive', days: 2,
    description: 'Restore deleted November positions from the Kestrel navigation backup.',
    finding: 'Seven late-night voyages break west at Beacon 9 and stop at an unnamed island absent from the route plan.',
    evidence: { id: 'gps', icon: 'map', title: 'The ghost passage', kicker: '7 voyages to an island off the chart', description: 'Deleted GPS points form a repeated passage to an unnamed island west of Beacon 9.' },
    email: { id: 'gpsmail', from: 'Ivo Renn · Fleet Systems', initials: 'IR', subject: 'Recovered track / KESTREL_NOV', date: 'Audit reply', tone: 'blue', body: ['The bridge console was cleared correctly. The antenna cache was not.', 'I have attached the recovered points. Seven tracks dogleg west after Beacon 9. There is land there, although our route map calls it open water.'] },
  },
  {
    id: 'scans', row: 'passenger', title: 'Reconcile ticket scans', source: 'Passenger systems', days: 1,
    description: 'Compare boarding and disembarkation scans by sailing.',
    finding: 'Thirty-seven passengers boarded late sailings and never scanned off at any official North Reef stop.',
    evidence: { id: 'passengers', icon: 'passenger', title: 'The missing tap-offs', kicker: '37 passengers, no official destination', description: 'The same late sailings carry passengers who never disembark at a listed port.' },
    email: { id: 'scanmail', from: 'Mina Elt · Ticketing', initials: 'ME', subject: '37 open journeys is not a software bug', date: 'Audit reply', tone: 'red', body: ['I checked the readers twice. They are not missed scans—several of these passengers travel every Thursday and always vanish after Beacon 9.', 'Their tickets are charged to Aster Trading’s house account. That account should be freight-only.'] },
  },
  {
    id: 'callbacks', row: 'passenger', title: 'Call a passenger sample', source: 'Customer care', days: 2,
    description: 'Contact twelve riders from late North Reef sailings.',
    finding: 'Most numbers are false. One passenger says “we get off after the lighthouse” before the call cuts out.',
    evidence: { id: 'callbacks', icon: 'passenger', title: 'After the lighthouse', kicker: 'One passenger confirms an extra stop', description: 'A sampled passenger describes leaving Kestrel at an unlisted stop after Beacon 9.' },
    email: { id: 'callbackmail', from: 'Sella Park · Customer Care', initials: 'SP', subject: 'Passenger sample — strange result', date: 'Audit reply', tone: 'amber', body: ['Eleven dead numbers. The twelfth person asked whether “the owner finally knows.”', 'They said they get off after the lighthouse. Then another person took the phone and ended the call. I would prefer not to call again.'] },
  },
  {
    id: 'weight', row: 'cargo', title: 'Cross-check weighbridge records', source: 'North Reef dockmaster', days: 2,
    description: 'Compare cargo manifests with axle weights at origin.',
    finding: 'The Kestrel carried 74 tonnes more than declared across nine trips. The excess cargo belongs to Aster Trading.',
    evidence: { id: 'weight', icon: 'cargo', title: 'Seventy-four hidden tonnes', kicker: 'Heavy cargo, light paperwork', description: 'Independent weighbridge totals exceed manifests by 74 tonnes, all tied to Aster Trading.' },
    email: { id: 'weightmail', from: 'Oren Pell · Dockmaster', initials: 'OP', subject: 'Weighbridge copies', date: 'Audit reply', tone: 'blue', body: ['Our bridge is calibrated every Monday. The manifests are the fiction here.', 'Aster’s trucks arrive after the freight office closes. Your finance director’s standing letter tells us to wave them through.'] },
  },
  {
    id: 'invoices', row: 'cargo', title: 'Sample cargo invoices', source: 'Accounts receivable', days: 1,
    description: 'Trace Aster Trading invoices, remittances, and beneficial owner.',
    finding: 'Aster pays 38% above tariff from an island municipal account. Its registered address is an empty chandlery.',
    evidence: { id: 'aster', icon: 'invoice', title: 'Aster’s impossible margin', kicker: 'A shell customer paying above tariff', description: 'Aster Trading is a shell company funded through a municipal account not found in the archipelago register.' },
    email: { id: 'astermail', from: 'Ruth Kaar · Receivables', initials: 'RK', subject: 'Aster Trading account history', date: 'Audit reply', tone: 'amber', body: ['They always pay early and always over tariff. Finance told me never to correct the rate.', 'Their address is Belltower Chandlery. It has been boarded up since I was a child.'] },
  },
  {
    id: 'overtime', row: 'crew', title: 'Interview the Kestrel crew', source: 'Operations office', days: 2,
    description: 'Conduct separate interviews about the twelve unlisted shifts.',
    finding: 'Three crew members describe humanitarian landings at an off-chart island. All say Finance threatened their families’ ferry access.',
    evidence: { id: 'crew', icon: 'passenger', title: 'The crew’s silence', kicker: 'Twelve shifts omitted by instruction', description: 'Crew corroborate secret island landings and identify Finance as the source of the cover-up.' },
    email: { id: 'crewmail', from: 'Tomas Vik · Chief Engineer', initials: 'TV', subject: 'Statement, if you will protect the crew', date: 'Audit reply', tone: 'red', body: ['There are sixty-two people on Lysa. They were struck from the civil map during the boundary dispute, but they did not stop existing.', 'We bring medicine, fuel, and passengers. Soren sells the spare hold to smugglers and uses the island to hide it. The captain kept sailing because closing the route strands everyone.'] },
  },
  {
    id: 'repairs', row: 'maintenance', title: 'Inspect repair work orders', source: 'Kestrel engineering', days: 1,
    description: 'Review removed parts, damage photos, and engineer notes.',
    finding: 'Hull scoring contains blue volcanic grit found only west of Beacon 9. The original work order was altered by Finance.',
    evidence: { id: 'repairs', icon: 'repair', title: 'Blue grit in the hull', kicker: 'Physical proof of western landings', description: 'Damage residue matches the shoals around the island erased from the company route map.' },
    email: { id: 'repairmail', from: 'Niko Kass · Shipyard Foreman', initials: 'NK', subject: 'Original work order attached', date: 'Audit reply', tone: 'blue', body: ['Your copy says “North Reef shoal impact.” Mine says “blue grit, Lysa east jetty.”', 'Someone in Finance amended the digital work order after we closed it. Sloppy work. Not ours.'] },
  },
  {
    id: 'harbor', row: 'ports', title: 'Request harbor invoices', source: 'Archipelago port authority', days: 1,
    description: 'Search for fees or exemptions outside the registered route.',
    finding: 'A recurring “weather refuge” exemption references LYSA-12, a jurisdiction removed from public charts eleven years ago.',
    evidence: { id: 'lysa', icon: 'map', title: 'Lysa-12 exists', kicker: 'An island deleted, not abandoned', description: 'Port authority records preserve an exemption for Lysa-12, officially removed from charts.' },
    email: { id: 'harbormail', from: 'Ada Holm · Port Authority', initials: 'AH', subject: 'Restricted record: LYSA-12', date: 'Audit reply', tone: 'red', body: ['I cannot explain this over company email.', 'Lysa was removed from public navigation records after the boundary settlement. A weather-refuge code remained so essential vessels could legally land. Your Kestrel uses it every Thursday.'] },
  },
]

const rowAuditFallback: Audit = {
  id: 'variance', row: '*', title: 'Recalculate monthly variance', source: 'Internal accounting', days: 1,
  description: 'Check additions, posting dates, and quarter-to-date arithmetic.',
  finding: 'The arithmetic is correct. Whatever is wrong here happened before the numbers reached the ledger.',
}

const formatMoney = (value: number) => `${value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('en-US')}`
const pct = (a: number, b: number) => {
  if (!a) return '—'
  const n = Math.round(((b - a) / Math.abs(a)) * 100)
  return `${n > 0 ? '+' : ''}${n}%`
}

function CompanyMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`company-mark ${small ? 'small' : ''}`} aria-label="Northstar Ferries">
      <div className="mark-icon"><Anchor size={small ? 15 : 20} strokeWidth={1.8} /></div>
      <div><strong>NORTHSTAR</strong><span>FERRIES &amp; FREIGHT</span></div>
    </div>
  )
}

function App() {
  const [phase, setPhase] = useState<Phase>('orientation')
  const [view, setView] = useState<View>('ledger')
  const [selected, setSelected] = useState<SelectedCell>({ row: 'passenger', col: 'Q2' })
  const [orientationResult, setOrientationResult] = useState(false)
  const [intro, setIntro] = useState(false)
  const [spentDays, setSpentDays] = useState(0)
  const [completed, setCompleted] = useState<string[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [emails, setEmails] = useState<GameEmail[]>(initialEmails)
  const [readEmails, setReadEmails] = useState<string[]>([])
  const [openEmail, setOpenEmail] = useState<string | null>('board')
  const [processing, setProcessing] = useState<Audit | null>(null)
  const [finding, setFinding] = useState<Audit | null>(null)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [ending, setEnding] = useState<'truth' | 'theft' | 'close' | null>(null)
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)
  const debug = new URLSearchParams(window.location.search).get('debug') === 'true'
  const musicDisabled = new URLSearchParams(window.location.search).get('music') === 'off'

  const rows = phase === 'orientation' ? orientationRows : mysteryRows
  const cols = phase === 'orientation' ? ['Q1', 'Q2'] : ['SEP', 'OCT', 'NOV']
  const selectedRow = rows.find((row) => row.id === selected.row) ?? rows[1]
  const unread = emails.filter((email) => !readEmails.includes(email.id)).length
  const remaining = 6 - spentDays

  useEffect(() => {
    return () => {
      void audioRef.current?.close()
    }
  }, [])

  const availableAudits = useMemo(() => {
    if (phase === 'orientation') return []
    const specific = audits.filter((audit) => audit.row === selectedRow.id)
    return specific.length ? specific : [{ ...rowAuditFallback, id: `variance-${selectedRow.id}` }]
  }, [phase, selectedRow.id])

  function toggleSound() {
    if (musicDisabled) return
    if (soundOn) {
      audioRef.current?.close()
      audioRef.current = null
      setSoundOn(false)
      return
    }
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const master = ctx.createGain()
    master.gain.value = 0.025
    master.connect(ctx.destination)
    ;[55, 82.4, 110].forEach((frequency, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = i === 0 ? 'sine' : 'triangle'
      osc.frequency.value = frequency
      gain.gain.value = i === 0 ? 0.7 : 0.16
      osc.connect(gain).connect(master)
      osc.start()
    })
    audioRef.current = ctx
    setSoundOn(true)
  }

  function selectCell(row: string, col: string) {
    setSelected({ row, col })
    setView('ledger')
  }

  function completeOrientation() {
    setOrientationResult(true)
  }

  function beginMystery() {
    setOrientationResult(false)
    setIntro(true)
  }

  function openNovember() {
    setPhase('mystery')
    setSelected({ row: 'fuel', col: 'NOV' })
    setIntro(false)
  }

  function runAudit(audit: Audit) {
    if (processing || completed.includes(audit.id) || audit.days > remaining) return
    setProcessing(audit)
    window.setTimeout(() => {
      setProcessing(null)
      setCompleted((prev) => [...prev, audit.id])
      if (audit.evidence) setEvidence((prev) => prev.some((item) => item.id === audit.evidence!.id) ? prev : [...prev, audit.evidence!])
      if (audit.email) setEmails((prev) => prev.some((item) => item.id === audit.email!.id) ? prev : [audit.email!, ...prev])
      const nextSpent = spentDays + audit.days
      setSpentDays(nextSpent)
      setFinding(audit)
      if (nextSpent >= 6) window.setTimeout(() => setMeetingOpen(true), 800)
    }, 760)
  }

  function openMail(id: string) {
    setOpenEmail(id)
    setReadEmails((prev) => prev.includes(id) ? prev : [...prev, id])
  }

  function resetGame() {
    setPhase('orientation')
    setView('ledger')
    setSelected({ row: 'passenger', col: 'Q2' })
    setOrientationResult(false)
    setIntro(false)
    setSpentDays(0)
    setCompleted([])
    setEvidence([])
    setEmails(initialEmails)
    setReadEmails([])
    setOpenEmail('board')
    setProcessing(null)
    setFinding(null)
    setMeetingOpen(false)
    setEnding(null)
  }

  function debugReveal() {
    setPhase('mystery')
    setIntro(false)
    setCompleted(audits.map((audit) => audit.id))
    setEvidence(audits.flatMap((audit) => audit.evidence ? [audit.evidence] : []))
    setEmails([...audits.flatMap((audit) => audit.email ? [audit.email] : []), ...initialEmails])
    setSpentDays(5)
    setSelected({ row: 'fuel', col: 'NOV' })
  }

  const selectedValue = selectedRow.values?.[selected.col]
  const priorCol = phase === 'orientation' ? 'Q1' : selected.col === 'SEP' ? 'SEP' : selected.col === 'OCT' ? 'SEP' : 'OCT'
  const priorValue = selectedRow.values?.[priorCol]

  return (
    <main className="game-shell">
      <header className="system-bar">
        <div className="system-left"><ShipWheel size={15} /><span>Northstar Office System</span><span className="menu-word">File</span><span className="menu-word">Records</span><span className="menu-word">Window</span></div>
        <div className="system-right"><span className="secure"><span /> LOCAL / SECURE</span><span>{phase === 'orientation' ? '30 JUN 1996' : `${6 - remaining + 14} DEC 1996`}</span><span>09:42</span></div>
      </header>

      <section className="application-window">
        <div className="titlebar">
          <CompanyMark />
          <div className="title-actions">
            {phase === 'mystery' && <button className="deadline-pill" onClick={() => setMeetingOpen(true)} aria-label="Open board meeting"><CalendarDays size={15} /><span><b>{remaining}</b> working day{remaining === 1 ? '' : 's'} to board vote</span><ChevronRight size={15} /></button>}
            <button className="icon-button" onClick={toggleSound} title={musicDisabled ? 'Music disabled by URL' : soundOn ? 'Mute ambience' : 'Play ambience'} disabled={musicDisabled}>{soundOn ? <Music2 size={18} /> : <VolumeX size={18} />}</button>
            <button className="icon-button" title="Help"><CircleHelp size={18} /></button>
          </div>
        </div>

        <div className="workspace">
          <nav className="app-nav" aria-label="Applications">
            <div className="nav-top">
              <button className={view === 'ledger' ? 'active' : ''} onClick={() => setView('ledger')}><span className="nav-icon"><BarChart3 /></span><span>Ledger</span></button>
              <button className={view === 'inbox' ? 'active' : ''} onClick={() => setView('inbox')}><span className="nav-icon"><Mail /></span><span>Post</span>{unread > 0 && <b className="count">{unread}</b>}</button>
              <button className={view === 'evidence' ? 'active' : ''} onClick={() => setView('evidence')} disabled={phase === 'orientation'}><span className="nav-icon"><Archive /></span><span>Case file</span>{evidence.length > 0 && <b className="count pale">{evidence.length}</b>}</button>
            </div>
            <div className="nav-bottom">
              <div className="user-seal">AO</div>
              <div><strong>A. OWNER</strong><span>Managing Director</span></div>
            </div>
          </nav>

          {view === 'ledger' && (
            <div className="ledger-view">
              <div className="document-head">
                <div>
                  <div className="eyebrow">MANAGEMENT ACCOUNTS / {phase === 'orientation' ? 'ALL ROUTES' : 'ROUTE 04'}</div>
                  <h1>{phase === 'orientation' ? 'Quarterly operating statement' : 'North Reef service'}</h1>
                  <p>{phase === 'orientation' ? 'Quarter ended 30 June 1996 · unaudited · ¤ whole units' : 'November close · prepared by Finance · ¤ whole units'}</p>
                </div>
                <div className={`status-stamp ${phase === 'mystery' ? 'warning' : ''}`}><span>{phase === 'orientation' ? 'Q2 / 1996' : 'BOARD COPY'}</span><b>{phase === 'orientation' ? 'CLOSED' : 'REVIEW'}</b></div>
              </div>

              <div className="sheet-and-inspector">
                <section className="sheet-wrap" aria-label="Financial spreadsheet">
                  <div className="sheet-toolbar">
                    <button><BookOpen size={14} /> Statement</button>
                    <button><Search size={14} /> Find</button>
                    <span className="cell-address">{String.fromCharCode(65 + cols.indexOf(selected.col) + 1)}{rows.findIndex((r) => r.id === selected.row) + 1}</span>
                    <div className="formula-display"><span>fx</span>{selectedRow.label}</div>
                  </div>
                  <div className="spreadsheet">
                    <div className="row-numbers" aria-hidden="true"><div className="corner" />{rows.map((_, i) => <div key={i}>{i + 1}</div>)}</div>
                    <table>
                      <thead><tr><th className="label-col">ACCOUNT</th>{cols.map((col) => <th key={col}>{col}{phase === 'orientation' ? ' 1996' : ''}</th>)}<th>CHANGE</th></tr></thead>
                      <tbody>
                        {rows.map((row) => {
                          if (row.kind === 'heading') return <tr key={row.id} className="heading-row"><th>{row.label}</th><td colSpan={cols.length + 1} /></tr>
                          const values = row.values!
                          return (
                            <tr key={row.id} className={`${row.kind}-row ${row.id === selected.row ? 'row-active' : ''}`}>
                              <th>{row.label}{phase === 'mystery' && ['fuel', 'passenger', 'cargo'].includes(row.id) && <span className="anomaly-dot" title="Notable variance" />}</th>
                              {cols.map((col) => <td key={col}><button className={selected.row === row.id && selected.col === col ? 'cell-selected' : ''} onClick={() => selectCell(row.id, col)}>{formatMoney(values[col])}</button></td>)}
                              <td className={`variance ${values[cols.at(-1)!] > values[cols.at(-2)!] ? 'up' : 'down'}`}>{pct(values[cols.at(-2)!], values[cols.at(-1)!])}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sheet-tabs"><button className="tab-arrow">‹</button><button className="active">Income statement</button><button>Route detail</button><button>Notes</button><span /></div>
                  <div className="sheet-status"><span>READY</span><span>{rows.length - 2} accounts</span><span>¤ {selectedValue !== undefined ? formatMoney(selectedValue) : '—'}</span></div>
                </section>

                <aside className="inspector">
                  <div className="inspector-title"><div><span>SELECTED ACCOUNT</span><h2>{selectedRow.label}</h2></div><FileSearch size={21} /></div>
                  <div className="metric-card">
                    <span>{selected.col} VALUE</span><strong>{selectedValue !== undefined ? `¤ ${formatMoney(selectedValue)}` : '—'}</strong>
                    {selectedValue !== undefined && priorValue !== undefined && selected.col !== priorCol && <em className={selectedValue > priorValue ? 'up' : 'down'}>{pct(priorValue, selectedValue)} from {priorCol}</em>}
                  </div>
                  <p className="dry-note">“{selectedRow.note ?? 'A heading. Even accountants need somewhere to put the underline.'}”</p>

                  {phase === 'orientation' ? (
                    <div className="orientation-task">
                      <div className="task-label"><Sparkles size={15} /> FIRST REVIEW</div>
                      <h3>Can the reported sales be trusted?</h3>
                      <p>Trace a small sample back to the tickets that created it.</p>
                      <button className="primary-action" onClick={completeOrientation} disabled={selectedRow.id !== 'passenger'}><span><FileSearch size={18} /><b>Sample ticket receipts</b><small>Internal check · no time cost</small></span><ChevronRight size={18} /></button>
                      {selectedRow.id !== 'passenger' && <button className="text-action" onClick={() => selectCell('passenger', 'Q2')}>Return to Passenger fares</button>}
                    </div>
                  ) : (
                    <div className="audit-section">
                      <div className="section-label"><span>AVAILABLE INQUIRIES</span><span>{remaining} DAYS LEFT</span></div>
                      {availableAudits.map((audit) => {
                        const done = completed.includes(audit.id)
                        const tooLate = audit.days > remaining
                        return <button key={audit.id} className={`audit-option ${done ? 'done' : ''}`} disabled={done || tooLate} onClick={() => runAudit(audit)}><span className="audit-icon">{done ? <Check size={17} /> : <FileSearch size={17} />}</span><span><b>{audit.title}</b><small>{done ? 'Filed in case record' : audit.description}</small><em>{done ? 'COMPLETE' : `${audit.days} WORKING DAY${audit.days === 1 ? '' : 'S'}`}</em></span><ChevronRight size={17} /></button>
                      })}
                      <p className="audit-hint"><Lightbulb size={14} /> Select a different account to ask different questions.</p>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {view === 'inbox' && (
            <div className="mail-view">
              <div className="mail-sidebar">
                <div className="mail-head"><div><span className="eyebrow">NORTHSTAR POST</span><h1>Inbox</h1></div><button className="icon-button"><Search size={18} /></button></div>
                <div className="mail-filter"><button className="active">All mail <span>{emails.length}</span></button><button>Flagged</button></div>
                <div className="message-list">
                  {emails.map((email) => <button key={email.id} className={`${openEmail === email.id ? 'active' : ''} ${!readEmails.includes(email.id) ? 'unread' : ''}`} onClick={() => openMail(email.id)}><span className={`sender-avatar ${email.tone ?? ''}`}>{email.initials}</span><span className="message-preview"><span><b>{email.from.split(' · ')[0]}</b><time>{email.date}</time></span><strong>{email.subject}</strong><p>{email.body[0]}</p></span>{!readEmails.includes(email.id) && <i />}</button>)}
                </div>
              </div>
              <EmailReader email={emails.find((email) => email.id === openEmail) ?? emails[0]} onBack={() => setOpenEmail(null)} />
            </div>
          )}

          {view === 'evidence' && (
            <div className="evidence-view">
              <div className="case-header">
                <div><span className="eyebrow">INTERNAL / PRIVILEGED</span><h1>North Reef case file</h1><p>Corroborated findings for your board recommendation.</p></div>
                <div className="case-score"><strong>{evidence.length}</strong><span>FINDINGS<br />FILED</span></div>
              </div>
              {evidence.length === 0 ? <div className="empty-case"><Archive size={42} /><h2>The folder is empty.</h2><p>Run inquiries from the ledger. Findings with documentary support will be filed here.</p><button onClick={() => setView('ledger')}>Return to ledger</button></div> : (
                <div className="evidence-grid">
                  {evidence.map((item, i) => <article key={item.id} className="evidence-card"><div className="evidence-number">EXHIBIT {String(i + 1).padStart(2, '0')}</div><EvidenceIcon icon={item.icon} /><span className="paperclip"><Paperclip size={17} /></span><h2>{item.title}</h2><strong>{item.kicker}</strong><p>{item.description}</p><div className="verified"><Stamp size={15} /> SOURCE VERIFIED</div></article>)}
                </div>
              )}
              <div className="case-footer"><div><Flag size={18} /><span><b>Ready to make a recommendation?</b><small>The board needs more than suspicion.</small></span></div><button onClick={() => setMeetingOpen(true)}>Convene board <ChevronRight size={16} /></button></div>
            </div>
          )}
        </div>
      </section>

      {debug && <div className="debug-tools"><span>DEBUG</span><button onClick={debugReveal}>Reveal case</button><button onClick={() => setMeetingOpen(true)}>Board</button><button onClick={resetGame}>Reset</button></div>}

      {orientationResult && <div className="modal-layer"><div className="receipt-modal paper-modal"><button className="modal-x" onClick={() => setOrientationResult(false)}><X size={18} /></button><div className="success-mark"><Check size={24} /></div><span className="eyebrow">SAMPLE COMPLETE · 12 OF 12 MATCHED</span><h2>The books agree with the boats.</h2><p>You followed twelve entries from the ledger to ticket scans and bank receipts. Every passenger existed. Every fare arrived.</p><div className="reconcile-line"><span>LEDGER</span><i /><Check size={15} /><i /><span>TICKETS</span><i /><Check size={15} /><i /><span>BANK</span></div><blockquote>“A number is only as honest as the trail behind it.”</blockquote><button className="continue-button" onClick={beginMystery}>Continue <ChevronRight size={17} /></button></div></div>}

      {intro && <div className="modal-layer dark"><div className="time-jump-modal"><div className="jump-rule"><span>6 MONTHS LATER</span></div><CompanyMark /><h2>Business is booming.<br /><em>Something else is, too.</em></h2><p>One route has posted record cargo sales, impossible fuel use, and its first loss in nine years.</p><div className="memo-strip"><CalendarDays size={21} /><span><b>BOARD VOTE IN 6 WORKING DAYS</b><small>Close North Reef Service — or explain its books.</small></span></div><button onClick={openNovember}>Open the November accounts <ArrowLeft className="reverse-arrow" size={17} /></button></div></div>}

      {processing && <div className="processing-layer"><div className="processing-card"><div className="radar"><span /><Waves size={28} /></div><span>REQUEST IN PROGRESS</span><h2>{processing.title}</h2><p>{processing.source}</p><div className="progress-bar"><i /></div><small>Retrieving records…</small></div></div>}

      {finding && !processing && <div className="modal-layer"><div className="finding-modal paper-modal"><button className="modal-x" onClick={() => setFinding(null)}><X size={18} /></button><div className="finding-top"><span className="report-tag">INQUIRY RETURNED</span><span><Clock3 size={14} /> {finding.days} day{finding.days === 1 ? '' : 's'} elapsed</span></div><h2>{finding.title}</h2><p className="source-line">SOURCE / {finding.source.toUpperCase()}</p><div className="finding-text"><FileSearch size={21} /><p>{finding.finding}</p></div>{finding.evidence ? <div className="filed-note"><Stamp size={18} /><span><b>Finding added to case file</b><small>{finding.evidence.title}</small></span></div> : <div className="no-finding">No documentary evidence added.</div>}<button className="continue-button" onClick={() => setFinding(null)}>Return to the ledger <ChevronRight size={17} /></button></div></div>}

      {meetingOpen && !ending && <div className="modal-layer dark"><div className="board-modal"><button className="modal-x light" onClick={() => setMeetingOpen(false)}><X size={19} /></button><div className="board-kicker"><span>BOARDROOM 4A</span><span>{remaining} DAYS REMAIN</span></div><div className="board-heading"><div className="board-seal"><Anchor size={23} /></div><div><span>ITEM 03 / NORTH REEF SERVICE</span><h2>Your recommendation?</h2></div></div><p className="board-prompt">The room is waiting. Finance wants the route closed. Captain Vale is not invited.</p><div className="evidence-summary"><span>YOUR CASE FILE</span><div><b>{evidence.length}</b><small>corroborated finding{evidence.length === 1 ? '' : 's'}</small></div><div className="mini-files">{evidence.slice(0, 5).map((item) => <span key={item.id} title={item.title}><Check size={12} /></span>)}</div></div><div className="verdict-options"><button onClick={() => setEnding('close')}><span>A</span><div><b>Close North Reef Service</b><small>Accept Finance’s explanation: the route is simply unprofitable.</small></div><ChevronRight size={17} /></button><button onClick={() => setEnding('theft')}><span>B</span><div><b>Keep the route; dismiss the captain</b><small>Treat the extra fuel and voyages as theft by the Kestrel crew.</small></div><ChevronRight size={17} /></button><button className={evidence.length >= 3 ? 'best' : ''} onClick={() => setEnding('truth')}><span>C</span><div><b>Disclose the unregistered Lysa service</b><small>Suspend Aster contracts, protect the islanders, and open Finance’s books.</small></div>{evidence.length >= 3 && <em>SUPPORTED</em>}<ChevronRight size={17} /></button></div><button className="not-yet" onClick={() => setMeetingOpen(false)}>Not yet — return to inquiry</button></div></div>}

      {ending && <Ending ending={ending} evidenceCount={evidence.length} onReset={resetGame} />}
    </main>
  )
}

function EmailReader({ email, onBack }: { email: GameEmail; onBack: () => void }) {
  return <section className="email-reader"><div className="email-toolbar"><button onClick={onBack}><ArrowLeft size={17} /> Inbox</button><div><button title="Archive"><Archive size={17} /></button><button title="Flag"><Flag size={17} /></button></div></div><article><div className="email-subject"><span className={`sender-avatar large ${email.tone ?? ''}`}>{email.initials}</span><div><h2>{email.subject}</h2><p>From <b>{email.from}</b></p><span>To: A. Owner · {email.date}</span></div></div><div className="email-body">{email.body.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<div className="email-signature">— {email.from.split(' · ')[0]}</div></div></article><footer><Paperclip size={15} /> Internal correspondence retained for 7 years</footer></section>
}

function EvidenceIcon({ icon }: { icon: Evidence['icon'] }) {
  const item = icon === 'map' ? <MapPinned /> : icon === 'passenger' ? <Inbox /> : icon === 'cargo' ? <Archive /> : icon === 'invoice' ? <BookOpen /> : icon === 'repair' ? <ShipWheel /> : <Waves />
  return <div className={`evidence-icon ${icon}`}>{item}</div>
}

function Ending({ ending, evidenceCount, onReset }: { ending: 'truth' | 'theft' | 'close'; evidenceCount: number; onReset: () => void }) {
  const strongTruth = ending === 'truth' && evidenceCount >= 3
  const data = strongTruth ? {
    tag: 'THE BOOKS OPEN', title: 'The route stays. The secret does not.',
    body: 'Your evidence survives the room. Soren is removed pending investigation. Lysa’s service is placed under emergency protection, and the Aster cargo hold is sealed before nightfall.',
    quote: 'Captain Vale’s final email contains only four words: “We saw the lights.”',
  } : ending === 'truth' ? {
    tag: 'A TRUE STORY, POORLY PROVED', title: 'The room chooses the cleaner number.',
    body: 'You name Lysa, but suspicion is not a paper trail. Soren calls it an invention. The board closes North Reef by four votes to two.',
    quote: 'Somewhere beyond Beacon 9, the Thursday lights wait for a ferry that does not come.',
  } : ending === 'theft' ? {
    tag: 'THE WRONG CULPRIT', title: 'The numbers balance. The story does not.',
    body: 'Captain Vale is dismissed and Soren volunteers to “clean up” the route. Aster cargo continues under another name. Lysa disappears from even the private logs.',
    quote: 'The easiest fraud to sell is the one with a convenient villain.',
  } : {
    tag: 'ROUTE 04 / DISCONTINUED', title: 'North Reef closes on schedule.',
    body: 'The loss vanishes from next quarter’s report. So do the fuel, the strange passengers, and every trace of the western passage. Profit improves by 3.1%.',
    quote: 'A clean ledger can hide an empty horizon.',
  }
  return <div className={`ending-layer ${strongTruth ? 'win' : ''}`}><div className="ending-noise" /><div className="ending-content"><CompanyMark /><div className="ending-rule" /><span>{data.tag}</span><h1>{data.title}</h1><p>{data.body}</p><blockquote>{data.quote}</blockquote><div className="ending-stats"><div><strong>{evidenceCount}</strong><span>FINDINGS</span></div><div><strong>{strongTruth ? 'LYSA' : '—'}</strong><span>DISCLOSED</span></div><div><strong>{strongTruth ? 'OPEN' : 'CLOSED'}</strong><span>ROUTE 04</span></div></div><button onClick={onReset}><RotateCcw size={17} /> Review the books again</button><small>NORTHSTAR LEDGER · A FIVE-MINUTE ACCOUNTING MYSTERY</small></div></div>
}

export default App
