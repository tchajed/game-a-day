import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { levels } from './gameData';
import './styles.css';

const SPEEDS = [0.75, 1, 1.35];

function useSound(enabled) {
  const context = useRef(null);

  return useCallback((type) => {
    if (!enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context.current ||= new AudioContext();
    const ctx = context.current;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const notes = {
      tick: [240, 0.06, 'sine', 0.035],
      correct: [520, 0.14, 'sine', 0.07],
      error: [105, 0.22, 'sawtooth', 0.05],
      complete: [440, 0.35, 'triangle', 0.06],
    };
    const [frequency, duration, wave, volume] = notes[type];
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (type === 'correct') oscillator.frequency.exponentialRampToValueAtTime(740, now + duration);
    if (type === 'complete') oscillator.frequency.exponentialRampToValueAtTime(880, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [enabled]);
}

function SignalMark({ signal }) {
  return (
    <div className="signal-mark" style={{ '--signal': signal.hex }}>
      <span className="signal-core">{signal.value}</span>
      <span className="signal-name">{signal.color}</span>
    </div>
  );
}

function StatusPill({ status, answered }) {
  const actual = answered === 'caught'
    ? 'flagged'
    : answered === 'missed'
      ? 'missed'
      : status === 'satisfied' ? 'satisfied' : 'possible';
  const labels = { possible: 'Unresolved', satisfied: 'Guaranteed', flagged: 'Caught', missed: 'Missed' };
  return <span className={`status-pill ${actual}`}><i />{labels[actual]}</span>;
}

function RuleCard({ rule, prefix, answered, showLtl, onFlag, index }) {
  const status = rule.evaluate(prefix);
  const resolved = Boolean(answered);
  const visibleStatus = status === 'satisfied' ? 'satisfied' : 'possible';
  return (
    <button
      className={`rule-card ${visibleStatus} ${answered || ''}`}
      onClick={() => onFlag(rule)}
      disabled={resolved}
      style={{ '--delay': `${index * 70}ms` }}
      aria-label={`${rule.title}. ${answered ? 'resolved' : visibleStatus}`}
    >
      <span className="rule-index">R{String(index + 1).padStart(2, '0')}</span>
      <span className="rule-copy">
        <strong>{rule.title}</strong>
        <small>{rule.detail}</small>
        {showLtl && <code>{rule.ltl}</code>}
      </span>
      <StatusPill status={status} answered={answered} />
    </button>
  );
}

function IntroPanel({ level, onStart }) {
  return (
    <div className="overlay">
      <section className="modal intro-modal">
        <span className="eyebrow">LEVEL {level.number} · {level.kicker}</span>
        <h1>{level.name}</h1>
        <p>{level.lesson}</p>
        <div className="lesson-box">
          <span className="lesson-icon">⌁</span>
          <div><b>Monitor briefing</b><span>{level.hint}</span></div>
        </div>
        <button className="primary-button" onClick={onStart}>Begin sequence <span>→</span></button>
      </section>
    </div>
  );
}

function ResultPanel({ phase, level, score, onAction }) {
  const failed = phase === 'gameover';
  const finished = phase === 'complete';
  return (
    <div className="overlay">
      <section className="modal result-modal">
        <div className={`result-glyph ${failed ? 'failed' : ''}`}>{failed ? '×' : '✓'}</div>
        <span className="eyebrow">{failed ? 'SIGNAL LOST' : finished ? 'CERTIFICATION COMPLETE' : 'SEQUENCE CLEARED'}</span>
        <h1>{failed ? 'Monitor offline' : finished ? 'All signals resolved' : level.name}</h1>
        <p>{failed ? 'Integrity reached zero. Recalibrate and watch for the first decisive counterexample.' : `Score ${score.toLocaleString()} · Temporal integrity confirmed.`}</p>
        <button className="primary-button" onClick={onAction}>
          {failed ? 'Retry level' : finished ? 'Run again' : 'Next sequence'} <span>→</span>
        </button>
      </section>
    </div>
  );
}

function App() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [prefix, setPrefix] = useState([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [answered, setAnswered] = useState({});
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLtl, setShowLtl] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Awaiting sequence');
  const level = levels[levelIndex];
  const playSound = useSound(!muted);
  const live = useRef({ prefix, answered, lives, nextIndex, phase });
  live.current = { prefix, answered, lives, nextIndex, phase };

  const duration = level.interval / SPEEDS[speedIndex];
  const progressKey = `${levelIndex}-${nextIndex}-${paused}-${phase}`;

  const resetLevel = useCallback((newPhase = 'intro') => {
    setPrefix([]);
    setNextIndex(0);
    setAnswered({});
    setLives(3);
    setStreak(0);
    setPaused(false);
    setMessage('Awaiting sequence');
    setPhase(newPhase);
  }, []);

  const startLevel = () => {
    setPrefix([level.sequence[0]]);
    setNextIndex(1);
    setPhase('running');
    setMessage('Signal received');
    playSound('tick');
  };

  useEffect(() => {
    if (phase !== 'running' || paused) return undefined;
    const timer = window.setTimeout(() => {
      const current = live.current;
      const missed = level.rules.filter((rule) =>
        rule.evaluate(current.prefix) === 'broken' && !current.answered[rule.id]);
      let remainingLives = current.lives;

      if (missed.length) {
        const additions = Object.fromEntries(missed.map((rule) => [rule.id, 'missed']));
        setAnswered((old) => ({ ...old, ...additions }));
        remainingLives = Math.max(0, current.lives - missed.length);
        setLives(remainingLives);
        setStreak(0);
        setMessage(`${missed.length} rule${missed.length > 1 ? 's' : ''} missed`);
        playSound('error');
      }

      if (remainingLives <= 0) {
        setPhase('gameover');
        return;
      }

      if (current.nextIndex < level.sequence.length) {
        setPrefix((old) => [...old, level.sequence[current.nextIndex]]);
        setNextIndex((old) => old + 1);
        if (!missed.length) setMessage('Signal received');
        playSound('tick');
      } else {
        setPhase(levelIndex === levels.length - 1 ? 'complete' : 'levelComplete');
        setMessage('Sequence clear');
        playSound('complete');
      }
    }, duration);
    return () => window.clearTimeout(timer);
  }, [phase, paused, nextIndex, duration, level, levelIndex, playSound]);

  const flagRule = (rule) => {
    if (phase !== 'running' || paused || answered[rule.id]) return;
    const status = rule.evaluate(prefix);
    if (status === 'broken') {
      const bonus = 100 + streak * 25;
      setAnswered((old) => ({ ...old, [rule.id]: 'caught' }));
      setScore((old) => old + bonus);
      setStreak((old) => old + 1);
      setMessage(`Counterexample caught  +${bonus}`);
      playSound('correct');
    } else {
      const remaining = lives - 1;
      setLives(remaining);
      setStreak(0);
      setMessage(status === 'satisfied' ? 'Rule is already guaranteed' : 'Rule can still be true');
      playSound('error');
      if (remaining <= 0) setPhase('gameover');
    }
  };

  const handleResult = () => {
    if (phase === 'gameover') {
      resetLevel('intro');
    } else if (phase === 'complete') {
      setLevelIndex(0);
      setScore(0);
      resetLevel('intro');
    } else {
      setLevelIndex((old) => old + 1);
      resetLevel('intro');
    }
  };

  const statuses = useMemo(() => level.rules.map((rule) => rule.evaluate(prefix)), [level, prefix]);
  const unresolvedCount = statuses.filter((status, index) =>
    status !== 'satisfied' && !answered[level.rules[index].id]).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">S∕S</span><div><b>SIGNAL</b><em>SEQUENCE</em></div></div>
        <div className="level-readout"><span>LEVEL {level.number}</span><b>{level.name}</b></div>
        <div className="scoreboard">
          <div><span>SCORE</span><b>{String(score).padStart(5, '0')}</b></div>
          <div><span>STREAK</span><b>×{streak}</b></div>
          <div className="integrity"><span>INTEGRITY</span><b>{[0, 1, 2].map((i) => <i key={i} className={i < lives ? 'live' : ''} />)}</b></div>
        </div>
      </header>

      <section className="workspace">
        <div className="stream-panel">
          <div className="section-heading">
            <div><span className="live-dot" />LIVE PREFIX <small>{prefix.length}/{level.sequence.length} SIGNALS</small></div>
            <div className="stream-message">{message}</div>
          </div>

          <div className="timeline-wrap">
            <div className="timeline" aria-label="Observed signal sequence">
              {prefix.map((signal, i) => (
                <React.Fragment key={`${i}-${signal.color}-${signal.value}`}>
                  {i > 0 && <span className="timeline-link" />}
                  <div className="signal-slot">
                    <span className="signal-order">t{i}</span>
                    <SignalMark signal={signal} />
                  </div>
                </React.Fragment>
              ))}
              {prefix.length === 0 && <div className="empty-stream">Sequence not started</div>}
              {phase === 'running' && nextIndex < level.sequence.length && <div className="incoming"><i /><i /><i /></div>}
            </div>
          </div>

          <div className="deadline-row">
            <span>NEXT SIGNAL</span>
            <div className="deadline-track">
              {phase === 'running' && !paused && <i key={progressKey} style={{ '--duration': `${duration}ms` }} />}
            </div>
            <b>{paused ? 'PAUSED' : phase === 'running' ? `${(duration / 1000).toFixed(1)}s` : '—'}</b>
          </div>
        </div>

        <aside className="rules-panel">
          <div className="section-heading rules-heading">
            <div>RULE MONITOR <small>{unresolvedCount} UNRESOLVED</small></div>
            <label className="ltl-toggle"><input type="checkbox" checked={showLtl} onChange={(e) => setShowLtl(e.target.checked)} /><span /> SHOW LTL</label>
          </div>
          <div className="rule-list">
            {level.rules.map((rule, index) => (
              <RuleCard key={rule.id} rule={rule} prefix={prefix} answered={answered[rule.id]} showLtl={showLtl} onFlag={flagRule} index={index} />
            ))}
          </div>
          <div className="monitor-tip"><span>!</span><p><b>See a counterexample?</b> Click the broken rule before the next signal arrives.</p></div>
        </aside>
      </section>

      <footer className="controlbar">
        <div className="legend"><span><i className="possible" />Unresolved</span><span><i className="satisfied" />Guaranteed</span><span><i className="broken" />Caught / missed</span></div>
        <div className="controls">
          <button onClick={() => setMuted((old) => !old)} title="Toggle sound">{muted ? 'SOUND OFF' : 'SOUND ON'}</button>
          <button onClick={() => setSpeedIndex((old) => (old + 1) % SPEEDS.length)} title="Change speed">{SPEEDS[speedIndex]}× SPEED</button>
          <button className="pause-button" onClick={() => phase === 'running' && setPaused((old) => !old)} disabled={phase !== 'running'}>{paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button>
        </div>
      </footer>

      {phase === 'intro' && <IntroPanel level={level} onStart={startLevel} />}
      {['levelComplete', 'gameover', 'complete'].includes(phase) && <ResultPanel phase={phase} level={level} score={score} onAction={handleResult} />}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
