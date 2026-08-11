import { useEffect, useState, type CSSProperties } from 'react'

function Grinder() {
  return (
    <g className="grinder prop" aria-label="Coffee grinder">
      <ellipse cx="1102" cy="305" rx="61" ry="14" fill="#b8d7d0" />
      <path d="M1048 307h108l-12 110h-82z" fill="#d7ebe6" stroke="#233b3b" strokeWidth="7" />
      <ellipse cx="1103" cy="417" rx="40" ry="11" fill="#153b3b" />
      <path d="M1057 430h92l14 172h-122z" fill="#296967" stroke="#233b3b" strokeWidth="8" />
      <rect x="1075" y="455" width="58" height="60" rx="16" fill="#1e4e4e" />
      <circle cx="1104" cy="474" r="9" fill="#ffd66b" />
      <path d="M1081 538h47l-5 46h-37z" fill="#162f30" />
      <path d="M1085 546h39" stroke="#f6c7a5" strokeWidth="8" strokeLinecap="round" />
      <rect x="1028" y="593" width="146" height="28" rx="13" fill="#183c3c" />
      <g fill="#6e4531" opacity=".88">
        <ellipse cx="1077" cy="345" rx="13" ry="8" transform="rotate(23 1077 345)" />
        <ellipse cx="1110" cy="332" rx="13" ry="8" transform="rotate(-18 1110 332)" />
        <ellipse cx="1125" cy="371" rx="13" ry="8" transform="rotate(30 1125 371)" />
        <ellipse cx="1088" cy="388" rx="13" ry="8" transform="rotate(-30 1088 388)" />
      </g>
      <path d="M1074 570h60" stroke="#7fb6ab" strokeWidth="7" strokeLinecap="round" />
    </g>
  )
}

function EspressoMachine() {
  return (
    <g className="machine prop" aria-label="Two-group espresso machine">
      <path d="M587 385q0-31 31-31h315q31 0 31 31v190H587z" fill="#f5d267" stroke="#233b3b" strokeWidth="8" />
      <path d="M603 387q0-17 17-17h311q17 0 17 17v47H603z" fill="#ffe599" />
      <rect x="621" y="397" width="73" height="28" rx="11" fill="#173d3d" />
      <rect x="847" y="397" width="73" height="28" rx="11" fill="#173d3d" />
      <text x="657" y="417" textAnchor="middle" className="machine-readout">93°</text>
      <text x="883" y="417" textAnchor="middle" className="machine-readout">93°</text>
      <g fill="#f8f1df" stroke="#233b3b" strokeWidth="6">
        <circle cx="717" cy="412" r="10" />
        <circle cx="749" cy="412" r="10" />
        <circle cx="781" cy="412" r="10" />
        <circle cx="813" cy="412" r="10" />
      </g>
      <path d="M615 451h321v104H615z" fill="#27716c" />
      <g>
        <path d="M656 455v39" stroke="#233b3b" strokeWidth="12" strokeLinecap="round" />
        <ellipse cx="656" cy="489" rx="38" ry="13" fill="#173d3d" />
        <path d="M657 489l-88-11" stroke="#233b3b" strokeWidth="11" strokeLinecap="round" />
        <circle cx="567" cy="478" r="12" fill="#f16852" stroke="#233b3b" strokeWidth="6" />
        <path d="M875 455v39" stroke="#233b3b" strokeWidth="12" strokeLinecap="round" />
        <ellipse cx="875" cy="489" rx="38" ry="13" fill="#173d3d" />
        <path d="M874 489l88-11" stroke="#233b3b" strokeWidth="11" strokeLinecap="round" />
        <circle cx="964" cy="478" r="12" fill="#f16852" stroke="#233b3b" strokeWidth="6" />
      </g>
      <g className="coffee-flow">
        <path d="M646 497v56M666 497v56" stroke="#7e4328" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d="M627 544h298" stroke="#b3c9be" strokeWidth="8" strokeLinecap="round" />
      <g stroke="#678d87" strokeWidth="3">
        <path d="M645 539v11M670 539v11M695 539v11M720 539v11M745 539v11M770 539v11M795 539v11M820 539v11M845 539v11M870 539v11M895 539v11" />
      </g>
      <path d="M608 560h336v49H608z" fill="#e8eee6" stroke="#233b3b" strokeWidth="8" />
      <rect x="568" y="602" width="416" height="31" rx="14" fill="#193c3c" />
      <path d="M606 447q-31 9-29 64l-2 55" fill="none" stroke="#cbdcd5" strokeWidth="9" strokeLinecap="round" />
      <path d="M946 447q31 9 29 64l2 55" fill="none" stroke="#cbdcd5" strokeWidth="9" strokeLinecap="round" />
      <circle cx="609" cy="447" r="12" fill="#f16852" stroke="#233b3b" strokeWidth="6" />
      <circle cx="944" cy="447" r="12" fill="#f16852" stroke="#233b3b" strokeWidth="6" />
      <g className="espresso-cup">
        <path d="M628 539h56l-6 38q-2 14-17 14h-10q-15 0-17-14z" fill="#fff9e9" stroke="#233b3b" strokeWidth="6" />
        <path d="M682 551q24 0 19 21-3 13-21 10" fill="none" stroke="#233b3b" strokeWidth="6" />
        <ellipse cx="656" cy="539" rx="26" ry="7" fill="#693b29" />
      </g>
    </g>
  )
}

function MouseBarista() {
  return (
    <g className="barista prop" aria-label="Mouse barista">
      <path d="M397 610q1-94 67-116 77-25 126 52 17 27 23 64z" fill="#f0a65e" stroke="#233b3b" strokeWidth="8" />
      <path d="M426 613q12-75 65-89 64 15 79 89z" fill="#f6efe0" />
      <path d="M450 554h84l19 58H431z" fill="#28706c" />
      <path d="M467 541v72M520 541v72" stroke="#173d3d" strokeWidth="7" />
      <path d="M470 499v32q22 17 48 0v-36" fill="#d88753" stroke="#233b3b" strokeWidth="7" />
      <ellipse cx="492" cy="431" rx="70" ry="75" fill="#efa668" stroke="#233b3b" strokeWidth="8" />
      <circle cx="439" cy="375" r="37" fill="#efa668" stroke="#233b3b" strokeWidth="8" />
      <circle cx="439" cy="375" r="21" fill="#f7c4a7" />
      <circle cx="546" cy="375" r="37" fill="#efa668" stroke="#233b3b" strokeWidth="8" />
      <circle cx="546" cy="375" r="21" fill="#f7c4a7" />
      <path d="M425 403q67-60 135 0-3-58-67-58t-68 58" fill="#f36b55" stroke="#233b3b" strokeWidth="8" />
      <path d="M434 391q59-33 118 0" fill="none" stroke="#ffd66b" strokeWidth="12" strokeLinecap="round" />
      <ellipse cx="466" cy="430" rx="7" ry="10" fill="#1f3535" />
      <ellipse cx="519" cy="430" rx="7" ry="10" fill="#1f3535" />
      <ellipse cx="492" cy="452" rx="10" ry="8" fill="#6e453b" />
      <path d="M492 461q-1 13-14 15M492 461q1 13 14 15" fill="none" stroke="#6e453b" strokeWidth="4" strokeLinecap="round" />
      <path d="M449 451l-42-6M450 462l-46 8M535 451l42-6M534 462l46 8" stroke="#714b3d" strokeWidth="3" strokeLinecap="round" />
      <path d="M406 547q-40 14-55 57M576 544q34 10 52 60" fill="none" stroke="#efa668" strokeWidth="24" strokeLinecap="round" />
      <circle cx="352" cy="605" r="15" fill="#efa668" stroke="#233b3b" strokeWidth="6" />
      <circle cx="629" cy="605" r="15" fill="#efa668" stroke="#233b3b" strokeWidth="6" />
      <path d="M463 481q30 13 59 0" fill="none" stroke="#233b3b" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

function Plant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="plant prop">
        <path d="M25 86C4 55 10 23 38 2c14 35 10 61-13 84z" fill="#6ea05f" />
        <path d="M40 87c-5-35 13-64 48-72 0 38-17 62-48 72z" fill="#4c8b5a" />
        <path d="M33 88C3 82-12 59-8 29c34 10 48 29 41 59z" fill="#8ab866" />
        <path d="M24 52l14 53M63 42l-25 63M2 51l36 54" stroke="#356f50" strokeWidth="5" strokeLinecap="round" />
        <path d="M2 92h73l-10 65H13z" fill="#ee8a59" stroke="#233b3b" strokeWidth="7" />
        <path d="M10 111h58" stroke="#ffd49c" strokeWidth="8" />
      </g>
    </g>
  )
}

function Customers() {
  return (
    <g className="customers foreground">
      <g transform="translate(108 686)">
        <circle cx="0" cy="10" r="77" fill="#7c98b6" stroke="#233b3b" strokeWidth="8" />
        <path d="M-65 9q64-80 130 0-1-86-65-86S-64-33-65 9" fill="#ef765e" stroke="#233b3b" strokeWidth="8" />
        <circle cx="-47" cy="-53" r="30" fill="#7c98b6" stroke="#233b3b" strokeWidth="8" />
        <circle cx="47" cy="-53" r="30" fill="#7c98b6" stroke="#233b3b" strokeWidth="8" />
        <path d="M-34 18q34 25 68 0" fill="none" stroke="#233b3b" strokeWidth="6" strokeLinecap="round" />
        <circle cx="-25" cy="0" r="6" fill="#233b3b" /><circle cx="25" cy="0" r="6" fill="#233b3b" />
      </g>
      <g transform="translate(1325 716)">
        <path d="M-86 31q3-102 86-102t86 102" fill="#8d6048" stroke="#233b3b" strokeWidth="8" />
        <path d="M-65-36l-57-77q71 8 83 50M65-36l57-77q-71 8-83 50" fill="#8d6048" stroke="#233b3b" strokeWidth="8" />
        <path d="M-105-99l52 22M105-99L53-77" stroke="#efb08a" strokeWidth="9" strokeLinecap="round" />
        <circle cx="-28" cy="-8" r="6" fill="#233b3b" /><circle cx="28" cy="-8" r="6" fill="#233b3b" />
        <path d="M-12 14h24l-12 10z" fill="#df8b7d" />
      </g>
    </g>
  )
}

function ShopScene() {
  return (
    <svg className="shop-scene" viewBox="0 0 1440 900" role="img" aria-labelledby="scene-title scene-description">
      <title id="scene-title">Little Peak Coffee shop interior</title>
      <desc id="scene-description">A warm geometric illustration of a mouse barista behind a specialty coffee bar, with a grinder and two-group espresso machine.</desc>
      <defs>
        <pattern id="tiles" width="58" height="58" patternUnits="userSpaceOnUse">
          <rect width="58" height="58" fill="#f7eddb" />
          <path d="M58 0H0V58" fill="none" stroke="#dfd2bc" strokeWidth="3" />
        </pattern>
        <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8dd5cf" />
          <stop offset="1" stopColor="#dff0df" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#1d3c3b" floodOpacity=".17" />
        </filter>
      </defs>

      <rect width="1440" height="900" fill="#f4cc86" />
      <rect x="0" y="0" width="1440" height="106" fill="#ef6654" />
      <path d="M0 106h1440v42c-39 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-80 39-120 0-40 39-81 39-120 0-40 39-80 39-120 0z" fill="#f36b55" />
      <path d="M60 107v40c40 39 80 39 120 0v-40M300 107v40c40 39 80 39 120 0v-40M540 107v40c40 39 80 39 120 0v-40M780 107v40c40 39 80 39 120 0v-40M1020 107v40c40 39 80 39 120 0v-40M1260 107v40c40 39 80 39 120 0v-40" fill="#ffd36b" />
      <rect y="148" width="1440" height="575" fill="url(#tiles)" />

      <g className="back-wall">
        <rect x="55" y="194" width="273" height="327" rx="20" fill="url(#window)" stroke="#233b3b" strokeWidth="9" />
        <path d="M190 198v319M59 374h265" stroke="#fff6dd" strokeWidth="12" />
        <path d="M70 344l94-92 52 57 101-99v154H70z" fill="#80b881" opacity=".8" />
        <circle cx="270" cy="249" r="32" fill="#ffd66b" />
        <rect x="1167" y="194" width="218" height="326" rx="20" fill="url(#window)" stroke="#233b3b" strokeWidth="9" />
        <path d="M1277 198v318M1172 360h209" stroke="#fff6dd" strokeWidth="12" />
        <path d="M1174 338l73-67 47 41 84-92v140h-204z" fill="#80b881" opacity=".8" />
        <rect x="380" y="198" width="696" height="125" rx="20" fill="#245b59" stroke="#233b3b" strokeWidth="9" />
        <text x="728" y="240" textAnchor="middle" className="menu-heading">LITTLE PEAK</text>
        <text x="457" y="284" className="menu-copy">ESPRESSO  3</text>
        <text x="652" y="284" className="menu-copy">FILTER  4</text>
        <text x="827" y="284" className="menu-copy">BEANS  16</text>
        <path d="M1010 237q18 23 0 46-18-23 0-46z" fill="#efca63" />
      </g>

      <Plant x={335} y={466} scale={0.88} />
      <Plant x={1212} y={461} scale={0.92} />
      <MouseBarista />
      <EspressoMachine />
      <Grinder />

      <g className="counter" filter="url(#softShadow)">
        <path d="M42 616h1356q24 0 24 24v87H18v-87q0-24 24-24z" fill="#f8e4bd" stroke="#233b3b" strokeWidth="9" />
        <path d="M18 683h1404v181H18z" fill="#ee805d" stroke="#233b3b" strokeWidth="9" />
        <path d="M78 721h1284v143H78z" fill="#dc6b51" />
        <path d="M271 684v180M512 684v180M753 684v180M994 684v180M1235 684v180" stroke="#be5948" strokeWidth="7" />
        <rect x="635" y="720" width="170" height="86" rx="43" fill="#f6c96c" />
        <path d="M686 766q34-45 68 0-4 31-34 31t-34-31z" fill="#2a6963" />
        <path d="M700 762q20-19 40 0" fill="none" stroke="#f8e4bd" strokeWidth="5" strokeLinecap="round" />
      </g>

      <Customers />
      <g className="foreground-table foreground">
        <ellipse cx="724" cy="881" rx="405" ry="94" fill="#173e3d" />
        <ellipse cx="724" cy="858" rx="405" ry="94" fill="#2f716b" stroke="#233b3b" strokeWidth="9" />
        <g transform="translate(690 776)">
          <path d="M-39 0h77l-8 55q-3 22-27 22h-7q-24 0-27-22z" fill="#fff6df" stroke="#233b3b" strokeWidth="7" />
          <path d="M37 17q39 0 30 31-5 20-34 16" fill="none" stroke="#233b3b" strokeWidth="7" />
          <ellipse cx="0" cy="0" rx="37" ry="10" fill="#8a4e30" stroke="#233b3b" strokeWidth="5" />
          <path d="M-12-31q-11-18 4-35M10-31q-11-18 4-35" fill="none" stroke="#f7ead7" strokeWidth="6" strokeLinecap="round" className="steam" />
        </g>
      </g>
    </svg>
  )
}

export default function App() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLoaded(true))
    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2
      const y = (event.clientY / window.innerHeight - 0.5) * 2
      document.documentElement.style.setProperty('--look-x', x.toFixed(3))
      document.documentElement.style.setProperty('--look-y', y.toFixed(3))
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return (
    <main className={`game-shell ${loaded ? 'is-loaded' : ''}`} style={{ '--entrance-delay': '100ms' } as CSSProperties}>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-bean" aria-hidden="true" />
          <div>
            <p className="eyebrow">Morning shift</p>
            <h1>Little Peak Coffee</h1>
          </div>
        </div>
        <div className="status-pill"><span /> Open · 8:03 am</div>
      </header>

      <section className="scene-frame" aria-label="Coffee shop storefront visual prototype">
        <ShopScene />
        <div className="scene-vignette" aria-hidden="true" />
        <div className="welcome-card">
          <p className="welcome-kicker">Today's bar</p>
          <p className="welcome-title">Good morning.</p>
          <p className="welcome-copy">The first shot is dialing in.</p>
        </div>
        <div className="visual-only">Visual prototype · no interactions yet</div>
      </section>
    </main>
  )
}
