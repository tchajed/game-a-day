import { useEffect, useRef, useState } from 'react'
import rough from 'roughjs'
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, MessageSquareText, ShieldAlert } from 'lucide-react'
import { styleOptions, type StyleId } from './styleOptions'

const validStyle = (value: string): value is StyleId => styleOptions.some(option => option.id === value)

function RoughSelection({ color }: { color: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const draw = () => {
      const width = svg.clientWidth
      const height = svg.clientHeight
      svg.replaceChildren()
      const roughSvg = rough.svg(svg)
      svg.appendChild(roughSvg.rectangle(5, 5, Math.max(0, width - 10), Math.max(0, height - 10), {
        seed: 41,
        stroke: color,
        strokeWidth: 2,
        roughness: 1.1,
        bowing: 1,
      }))
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [color])
  return <svg className="rough-selection" ref={ref} aria-hidden="true" />
}

function EnvoyDrawing() {
  return <svg className="review-envoy" viewBox="0 0 260 260" role="img" aria-label="Illustration of alien envoy Lyra-of-Mists">
    <path className="envoy-outline" d="M130 20C78 20 53 72 69 128c9 33 20 74 61 103 41-29 52-70 61-103 16-56-9-108-61-108Z" />
    <path className="envoy-face" d="M91 75q39-29 78 0l-12 91q-27 24-54 0Z" />
    <ellipse cx="107" cy="110" rx="9" ry="16" /><ellipse cx="153" cy="110" rx="9" ry="16" />
    <circle cx="95" cy="141" r="4" /><circle cx="165" cy="141" r="4" />
    <path className="envoy-line" d="M109 161q21 13 42 0M82 189c-28 15-36 31-43 57M178 189c28 15 36 31 43 57M73 105c-33 20-39 55-31 84M187 105c33 20 39 55 31 84" />
  </svg>
}

const cards = [
  { id: 'listen', type: 'OBSERVE', symbol: '耳', name: 'Active Listen', body: 'Gain 1 trust. Record one observation.', result: '+1 trust · +1 insight' },
  { id: 'mirror', type: 'CONNECT', symbol: '◇', name: 'Mirror Rite', body: 'Gain 3 trust when the signal is ceremonial.', result: '+3 trust · signal match' },
]

function GamePreview({ style }: { style: StyleId }) {
  const [selected, setSelected] = useState('mirror')
  const chosen = cards.find(card => card.id === selected)!
  const option = styleOptions.find(item => item.id === style)!
  return <section className={`game-preview ${style}`} data-style={style} aria-label={`${option.name} game screen prototype`}>
    <header className="preview-header">
      <div className="preview-brand"><span className="preview-seal">NP</span><div><strong>NULL PROTOCOL</strong><small>Interstellar Liaison Office</small></div></div>
      <nav><b>Conversation</b><span>Deck of methods</span><span>Case notes</span></nav>
      <div className="case-number">CASE 07 <i>•</i> ATTEMPT 04</div>
    </header>

    <div className="preview-content">
      <aside className="case-rail">
        <p className="section-kicker">TODAY’S CONTACTS</p>
        <h2>Bridge<br />Conversations</h2>
        <div className="contact-list">
          <div className="done"><b>01</b><span><strong>Lyra-of-Mists</strong><small>In conversation</small></span></div>
          <div><b>02</b><span><strong>Archivist Tal</strong><small>Waiting</small></span></div>
          <div><b>03</b><span><strong>The Confluence</strong><small>Unconfirmed</small></span></div>
        </div>
        <blockquote>“Do not mistake unfamiliar manners for unfamiliar motives.”</blockquote>
      </aside>

      <main className="conversation">
        <div className="contact-heading"><div><p className="section-kicker">FIRST DELEGATE</p><h1>Lyra-of-Mists</h1><span>Vessel envoy · Lagrange Parlour 03</span></div><div className="classification"><small>LIKELY AFFILIATION</small><b>Resonant</b><span>1 of 2 observations</span></div></div>
        <div className="contact-grid">
          <div className="envoy-panel"><span className="figure-label">FIG. 1 — OBSERVED FORM</span><EnvoyDrawing /><div className="signal"><small>CURRENT SIGNAL</small><b>Ceremonial gesture</b><span>The envoy traces a diamond in the condensation.</span></div></div>
          <div className="case-notes"><div className="notes-title"><BookOpen /><b>Conversation notes</b><span>Live transcription</span></div>
            <p className="opening">Lyra folds four hands and waits for you to choose the shape of this meeting.</p>
            <div className="speaker alien"><b>LYRA</b><p>Repeats the diamond gesture, then turns both smaller palms upward.</p></div>
            <div className="margin-note">Ceremony? Greeting? Test a mirrored response.</div>
            <div className="meters"><div><span>TRUST <b>3 / 7</b></span><i><em style={{ width: '43%' }} /></i></div><div className="risk"><span>TENSION <b>0 / 5</b></span><i><em style={{ width: '3%' }} /></i></div></div>
          </div>
        </div>
      </main>

      <aside className="response-panel">
        <div className="response-heading"><p className="section-kicker">YOUR RESPONSE</p><h2>Choose one method</h2><span>2 cards in hand</span></div>
        <div className="review-cards">{cards.map(card => <button key={card.id} className={selected === card.id ? 'selected' : ''} onClick={() => setSelected(card.id)}>
          {selected === card.id && style === 'fieldbook' && <RoughSelection color="#b55f32" />}
          <div><small>{card.type}</small><b>{card.symbol}</b></div><span className="card-symbol">{card.symbol}</span><strong>{card.name}</strong><p>{card.body}</p>{selected === card.id && <i><Check /> selected</i>}
        </button>)}</div>
        <div className="outcome"><small>EXPECTED RESULT</small><b>{chosen.result}</b><p>{chosen.id === 'mirror' ? 'The gesture is likely to be understood as fluent respect.' : 'A useful observation, but this may concede momentum.'}</p></div>
        <button className="send-method">USE {chosen.name.toUpperCase()} <ArrowRight /></button>
        <div className="review-warning"><ShieldAlert /><span>Manual mode · all effects shown</span></div>
      </aside>
    </div>
  </section>
}

export default function StyleReview() {
  const initialHash = window.location.hash.replace('#', '')
  const [style, setStyle] = useState<StyleId>(validStyle(initialHash) ? initialHash : 'dossier')
  const option = styleOptions.find(item => item.id === style)!

  const chooseStyle = (id: StyleId) => {
    setStyle(id)
    history.replaceState(null, '', `#${id}`)
  }

  useEffect(() => {
    const onHash = () => {
      const value = window.location.hash.replace('#', '')
      if (validStyle(value)) setStyle(value)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return <div className="review-shell">
    <header className="review-topbar"><a href="./"><ArrowLeft /> Back to prototype</a><div><Eye /><span>Visual direction review</span></div><b>3 alternatives · same game state</b></header>
    <main className="review-layout">
      <aside className="review-sidebar">
        <p className="review-eyebrow">NULL PROTOCOL / UI STUDY</p>
        <h1>Choose a less<br />“futuristic” direction.</h1>
        <p className="review-intro">Each option shows the same conversation, cards, and information. Compare tone and readability—not mechanics.</p>
        <div className="style-options">{styleOptions.map(item => <button key={item.id} className={style === item.id ? 'active' : ''} onClick={() => chooseStyle(item.id)}>
          <span>{item.number}</span><div><b>{item.name}</b><small>{item.short}</small></div>{style === item.id && <Check />}
        </button>)}</div>
        <div className="direction-notes">
          <span className="direction-number">{option.number}</span><h2>{option.name}</h2><p>{option.summary}</p>
          <ul>{option.strengths.map(strength => <li key={strength}>{strength}</li>)}</ul>
          <div className="style-spec"><div><small>TYPE DIRECTION</small><b>{option.type}</b></div><div><small>PALETTE</small><span className="swatches">{option.palette.map(color => <i key={color} style={{ background: color }} title={color} />)}</span></div></div>
        </div>
      </aside>
      <section className="review-canvas">
        <div className="canvas-heading"><div><p>FULL SCREEN PROTOTYPE</p><h2>{option.name}</h2></div><span><MessageSquareText /> Click either response card to test its selected state.</span></div>
        <div className="preview-window"><div className="window-bar"><i /><i /><i /><span>null-protocol / manual-contact</span></div><GamePreview style={style} /></div>
        <div className="review-footer"><span>Small labels are raised to 10–12px; body copy and controls use 12–16px.</span><div>{styleOptions.map(item => <button key={item.id} className={style === item.id ? 'active' : ''} onClick={() => chooseStyle(item.id)} aria-label={`View ${item.name}`} />)}</div></div>
      </section>
    </main>
  </div>
}
