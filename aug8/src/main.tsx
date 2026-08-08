import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { levels, type Level, type MonitorStatus, type Rule, type Signal } from './gameData';
import './styles.css';

type Phase = 'running' | 'levelComplete' | 'gameover' | 'complete';
type Answer = 'caught' | 'missed';
type Answers = Record<string, Answer>;
type Sound = 'tick' | 'correct' | 'error' | 'complete';
type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

const SPEEDS = [0.75, 1, 1.35] as const;

interface PlaytestState {
  level: number;
  phase: Phase;
  prefix: Array<{ color: string; value: number }>;
  rules: Array<{ id: string; status: MonitorStatus; answered?: Answer }>;
  lives: number;
  score: number;
  streak: number;
  paused: boolean;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    __SIGNAL_SEQUENCE__?: {
      getState: () => PlaytestState;
      flag: (ruleId: string) => boolean;
      pause: (value?: boolean) => void;
      setSpeed: (multiplier: number) => void;
      restart: () => void;
    };
  }
}

function useSound(enabled: boolean) {
  const context = useRef<AudioContext | null>(null);

  return useCallback((type: Sound) => {
    if (!enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    context.current ||= new AudioContextClass();
    const ctx = context.current;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const notes: Record<Sound, [number, number, OscillatorType, number]> = {
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

function SignalMark({ signal }: { signal: Signal }) {
  return (
    <div className="signal-mark" style={{ '--signal': signal.hex } as CSSVars}>
      <span className="signal-core">{signal.value}</span>
      <span className="signal-name">{signal.color}</span>
    </div>
  );
}

function StatusPill({ status, answered }: { status: MonitorStatus; answered?: Answer }) {
  const actual = answered === 'caught'
    ? 'flagged'
    : answered === 'missed'
      ? 'missed'
      : status === 'satisfied' ? 'satisfied' : 'possible';
  const labels = { possible: 'Unresolved', satisfied: 'Guaranteed', flagged: 'Caught', missed: 'Missed' };
  return <span className={`status-pill ${actual}`}><i />{labels[actual]}</span>;
}

interface RuleCardProps {
  rule: Rule;
  prefix: Signal[];
  answered?: Answer;
  showLtl: boolean;
  onFlag: (rule: Rule) => void;
  index: number;
}

function RuleCard({ rule, prefix, answered, showLtl, onFlag, index }: RuleCardProps) {
  const status = rule.evaluate(prefix);
  const visibleStatus = status === 'satisfied' ? 'satisfied' : 'possible';
  return (
    <button
      className={`rule-card ${visibleStatus} ${answered ?? ''}`}
      onClick={() => onFlag(rule)}
      disabled={Boolean(answered)}
      style={{ '--delay': `${index * 70}ms` } as CSSVars}
      aria-label={`${rule.title}. ${answered ? 'resolved' : visibleStatus}`}
      data-rule-id={rule.id}
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

function ResultPanel({ phase, level, score, onAction }: { phase: Phase; level: Level; score: number; onAction: () => void }) {
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
  const [phase, setPhase] = useState<Phase>('running');
  const [prefix, setPrefix] = useState<Signal[]>([levels[0].sequence[0]]);
  const [nextIndex, setNextIndex] = useState(1);
  const [answered, setAnswered] = useState<Answers>({});
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLtl, setShowLtl] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Signal received — click a rule when it becomes impossible');
  const level = levels[levelIndex];
  const playSound = useSound(!muted);
  const live = useRef({ prefix, answered, lives, nextIndex });
  live.current = { prefix, answered, lives, nextIndex };

  const duration = level.interval / SPEEDS[speedIndex];
  const progressKey = `${levelIndex}-${nextIndex}-${paused}-${phase}`;

  const loadLevel = useCallback((index: number, resetScore = false) => {
    const target = levels[index];
    setLevelIndex(index);
    setPrefix([target.sequence[0]]);
    setNextIndex(1);
    setAnswered({});
    setLives(3);
    setStreak(0);
    setPaused(false);
    setMessage('Signal received — click a rule when it becomes impossible');
    setPhase('running');
    if (resetScore) setScore(0);
  }, []);

  useEffect(() => {
    if (phase !== 'running' || paused) return undefined;
    const timer = window.setTimeout(() => {
      const current = live.current;
      const missed = level.rules.filter((rule) =>
        rule.evaluate(current.prefix) === 'broken' && !current.answered[rule.id]);
      let remainingLives = current.lives;

      if (missed.length) {
        const additions = Object.fromEntries(missed.map((rule) => [rule.id, 'missed' as const]));
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

  const flagRule = useCallback((rule: Rule) => {
    if (phase !== 'running' || paused || answered[rule.id]) return false;
    const status = rule.evaluate(prefix);
    if (status === 'broken') {
      const bonus = 100 + streak * 25;
      setAnswered((old) => ({ ...old, [rule.id]: 'caught' }));
      setScore((old) => old + bonus);
      setStreak((old) => old + 1);
      setMessage(`Counterexample caught  +${bonus}`);
      playSound('correct');
      return true;
    }
    const remaining = lives - 1;
    setLives(remaining);
    setStreak(0);
    setMessage(status === 'satisfied' ? 'Rule is already guaranteed' : 'Rule can still be true');
    playSound('error');
    if (remaining <= 0) setPhase('gameover');
    return false;
  }, [answered, lives, paused, phase, playSound, prefix, streak]);

  const handleResult = () => {
    if (phase === 'gameover') loadLevel(levelIndex);
    else if (phase === 'complete') loadLevel(0, true);
    else loadLevel(levelIndex + 1);
  };

  useEffect(() => {
    window.__SIGNAL_SEQUENCE__ = {
      getState: () => ({
        level: levelIndex,
        phase,
        prefix: prefix.map(({ color, value }) => ({ color, value })),
        rules: level.rules.map((rule) => ({ id: rule.id, status: rule.evaluate(prefix), answered: answered[rule.id] })),
        lives,
        score,
        streak,
        paused,
      }),
      flag: (ruleId) => {
        const rule = level.rules.find(({ id }) => id === ruleId);
        return rule ? flagRule(rule) : false;
      },
      pause: (value) => setPaused((old) => value ?? !old),
      setSpeed: (multiplier) => {
        const closest = SPEEDS.reduce((best, speed, index) =>
          Math.abs(speed - multiplier) < Math.abs(SPEEDS[best] - multiplier) ? index : best, 0);
        setSpeedIndex(closest);
      },
      restart: () => loadLevel(levelIndex),
    };
    return () => { delete window.__SIGNAL_SEQUENCE__; };
  }, [answered, flagRule, level, levelIndex, lives, loadLevel, paused, phase, prefix, score, streak]);

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
          <div className="micro-brief"><b>{level.kicker}</b><span>{level.hint}</span></div>

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
              {phase === 'running' && nextIndex < level.sequence.length && <div className="incoming"><i /><i /><i /></div>}
            </div>
          </div>

          <div className="deadline-row">
            <span>NEXT SIGNAL</span>
            <div className="deadline-track">
              {phase === 'running' && !paused && <i key={progressKey} style={{ '--duration': `${duration}ms` } as CSSVars} />}
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
          <div className="monitor-tip"><span>!</span><p><b>See a counterexample?</b> Click the impossible rule before the next signal arrives.</p></div>
        </aside>
      </section>

      <footer className="controlbar">
        <div className="legend"><span><i className="possible" />Unresolved</span><span><i className="satisfied" />Guaranteed</span><span><i className="broken" />Caught / missed</span></div>
        <div className="controls">
          <button onClick={() => setMuted((old) => !old)}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button>
          <button onClick={() => setSpeedIndex((old) => (old + 1) % SPEEDS.length)}>{SPEEDS[speedIndex]}× SPEED</button>
          <button className="pause-button" onClick={() => phase === 'running' && setPaused((old) => !old)} disabled={phase !== 'running'}>{paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button>
        </div>
      </footer>

      {['levelComplete', 'gameover', 'complete'].includes(phase) && <ResultPanel phase={phase} level={level} score={score} onAction={handleResult} />}
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(<App />);
