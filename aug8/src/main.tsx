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
  started: boolean;
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
      clickSignal: (index: number) => boolean;
      pause: (value?: boolean) => void;
      setSpeed: (multiplier: number) => void;
      advance: () => void;
      loadLevel: (index: number) => void;
      restart: () => void;
      start: () => void;
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

function SignalMark({ signal, onClick, resolution }: { signal: Signal; onClick: () => void; resolution?: Answer }) {
  return (
    <button className={`signal-mark ${resolution ?? ''}`} style={{ '--signal': signal.hex } as CSSVars} onClick={onClick} aria-label={`${signal.color} ${signal.value}${resolution ? `, ${resolution}` : ''}`}>
      <span className="signal-core">{resolution === 'caught' ? '✓' : resolution === 'missed' ? '×' : signal.value}</span>
      <span className="signal-name">{signal.color}{resolution ? ` · ${resolution}` : ''}</span>
    </button>
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
  index: number;
}

function RuleCard({ rule, prefix, answered, showLtl, index }: RuleCardProps) {
  const status = rule.evaluate(prefix);
  const visibleStatus = status === 'satisfied' ? 'satisfied' : 'possible';
  return (
    <div
      className={`rule-card ${visibleStatus} ${answered ?? ''}`}
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
    </div>
  );
}

function TutorialPanel({ onStart }: { onStart: () => void }) {
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [practiceFlags, setPracticeFlags] = useState<string[]>([]);
  const practiceRules = levels[0].rules;
  const practiceComplete = practiceFlags.length === practiceRules.length;

  const flagPracticeRule = (id: string) => {
    setPracticeFlags((old) => old.includes(id) ? old : [...old, id]);
  };

  return (
    <div className="overlay tutorial-overlay">
      <section className="modal tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <span className="eyebrow">OPERATOR BRIEFING · {practiceStarted ? '02' : '01'}</span>
        <h1 id="tutorial-title">{practiceStarted ? <>Catch both<br />counterexamples.</> : <>Rules come<br />before signals.</>}</h1>
        <p>{practiceStarted
          ? 'Practice is untimed. Each signal below breaks one rule—click the offending signals.'
          : 'Read every rule before opening the live feed. Once signals arrive, compare each one against this monitor.'}</p>

        {!practiceStarted ? (
          <div className="tutorial-rule-preview">
            {practiceRules.map((rule, index) => (
              <div className="preview-rule" key={rule.id}>
                <span>R{String(index + 1).padStart(2, '0')}</span>
                <div><b>{rule.title}</b><small>{rule.detail}</small></div>
                <i>UNRESOLVED</i>
              </div>
            ))}
          </div>
        ) : (
          <div className="practice-board">
            <div className="practice-signals" aria-label="Practice signals">
              <span>CLICK THE OFFENDING SIGNALS</span>
              {practiceRules.map((rule, index) => {
                const caught = practiceFlags.includes(rule.id);
                const color = index === 0 ? 'cyan' : 'violet';
                return (
                  <React.Fragment key={rule.id}>
                    {index > 0 && <i>+</i>}
                    <button className={`practice-signal ${color} ${caught ? 'caught' : ''}`} onClick={() => flagPracticeRule(rule.id)} disabled={caught}>
                      <b>{caught ? '✓' : index === 0 ? '9' : '5'}</b><small>{color.toUpperCase()}{caught ? ' · CAUGHT' : ''}</small>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="practice-rule-reminder">
              {practiceRules.map((rule, index) => <span key={rule.id}><i>R{String(index + 1).padStart(2, '0')}</i> {rule.title}</span>)}
            </div>
          </div>
        )}

        <div className="tutorial-warning"><span>{practiceComplete ? '✓' : '!'}</span><p>{practiceStarted ? practiceComplete ? <><b>Training clear.</b> The live sequence will be timed.</> : <>No timer yet—inspect the rules, then <b>click both offending signals.</b></> : <>You have <b>3 integrity points.</b> Wrong calls and missed counterexamples cost one.</>}</p></div>
        {!practiceStarted ? (
          <button className="primary-button tutorial-start" onClick={() => setPracticeStarted(true)} autoFocus>
            Begin practice <span>→</span>
          </button>
        ) : (
          <button className="primary-button tutorial-start" onClick={onStart} disabled={!practiceComplete}>
            {practiceComplete ? 'Start live sequence' : `Catch ${practiceRules.length - practiceFlags.length} more`} <span>→</span>
          </button>
        )}
      </section>
    </div>
  );
}

function ResultPanel({ phase, level, score, lives, onAction }: { phase: Phase; level: Level; score: number; lives: number; onAction: () => void }) {
  const failed = phase === 'gameover';
  const finished = phase === 'complete';
  const missedRule = failed && lives > 0;
  return (
    <div className="overlay">
      <section className="modal result-modal">
        <div className={`result-glyph ${failed ? 'failed' : ''}`}>{failed ? '×' : '✓'}</div>
        <span className="eyebrow">{failed ? 'SIGNAL LOST' : finished ? 'CERTIFICATION COMPLETE' : 'SEQUENCE CLEARED'}</span>
        <h1>{failed ? missedRule ? 'Counterexample missed' : 'Monitor offline' : finished ? 'All signals resolved' : level.name}</h1>
        <p>{failed ? missedRule ? 'The sequence ended with an unflagged broken rule. Every counterexample must be caught to proceed.' : 'Integrity reached zero. Recalibrate and watch for the first decisive counterexample.' : `Score ${score.toLocaleString()} · Temporal integrity confirmed.`}</p>
        <button className="primary-button" onClick={onAction}>
          {failed ? 'Retry level' : finished ? 'Run again' : 'Next sequence'} <span>→</span>
        </button>
      </section>
    </div>
  );
}

function App() {
  const [started, setStarted] = useState(false);
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
  const [message, setMessage] = useState('Signal received — click the signal that breaks a rule');
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
    setMessage('Signal received — click the signal that breaks a rule');
    setPhase('running');
    if (resetScore) setScore(0);
  }, []);

  const advanceSequence = useCallback(() => {
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
      const sequenceHasMiss = missed.length > 0 || Object.values(current.answered).includes('missed');
      if (sequenceHasMiss) {
        setPhase('gameover');
        setMessage('Sequence failed — counterexample missed');
        if (!missed.length) playSound('error');
      } else {
        setPhase(levelIndex === levels.length - 1 ? 'complete' : 'levelComplete');
        setMessage('Sequence clear');
        playSound('complete');
      }
    }
  }, [level, levelIndex, playSound]);

  useEffect(() => {
    if (!started || phase !== 'running' || paused) return undefined;
    const timer = window.setTimeout(advanceSequence, duration);
    return () => window.clearTimeout(timer);
  }, [started, phase, paused, nextIndex, duration, advanceSequence]);

  const flagSignal = useCallback((signalIndex: number) => {
    if (!started || phase !== 'running' || signalIndex < 0 || signalIndex >= prefix.length) return false;
    const throughSignal = prefix.slice(0, signalIndex + 1);
    const beforeSignal = prefix.slice(0, signalIndex);
    const brokenHere = level.rules.filter((rule) =>
      !answered[rule.id]
      && rule.evaluate(throughSignal) === 'broken'
      && rule.evaluate(beforeSignal) !== 'broken');

    if (brokenHere.length) {
      const bonus = brokenHere.reduce((total, _, index) => total + 100 + (streak + index) * 25, 0);
      setAnswered((old) => ({ ...old, ...Object.fromEntries(brokenHere.map((rule) => [rule.id, 'caught' as const])) }));
      setScore((old) => old + bonus);
      setStreak((old) => old + brokenHere.length);
      setMessage(`${brokenHere.length > 1 ? `${brokenHere.length} counterexamples` : 'Counterexample'} caught  +${bonus}`);
      playSound('correct');
      return true;
    }
    const remaining = lives - 1;
    setLives(remaining);
    setStreak(0);
    setMessage('That signal breaks no new rule');
    playSound('error');
    if (remaining <= 0) setPhase('gameover');
    return false;
  }, [answered, level.rules, lives, phase, playSound, prefix, started, streak]);

  const handleResult = () => {
    if (phase === 'gameover') loadLevel(levelIndex);
    else if (phase === 'complete') loadLevel(0, true);
    else loadLevel(levelIndex + 1);
  };

  useEffect(() => {
    const api = window.__SIGNAL_SEQUENCE__ ?? {} as NonNullable<Window['__SIGNAL_SEQUENCE__']>;
    Object.assign(api, {
      getState: () => ({
        level: levelIndex,
        phase,
        started,
        prefix: prefix.map(({ color, value }) => ({ color, value })),
        rules: level.rules.map((rule) => ({ id: rule.id, status: rule.evaluate(prefix), answered: answered[rule.id] })),
        lives,
        score,
        streak,
        paused: paused || !started,
      }),
      flag: (ruleId: string) => {
        const rule = level.rules.find(({ id }) => id === ruleId);
        if (!rule) return false;
        const breakingIndex = prefix.findIndex((_, index) => rule.evaluate(prefix.slice(0, index + 1)) === 'broken');
        return breakingIndex >= 0 ? flagSignal(breakingIndex) : false;
      },
      clickSignal: flagSignal,
      pause: (value?: boolean) => setPaused((old) => value ?? !old),
      setSpeed: (multiplier: number) => {
        const closest = SPEEDS.reduce((best, speed, index) =>
          Math.abs(speed - multiplier) < Math.abs(SPEEDS[best] - multiplier) ? index : best, 0);
        setSpeedIndex(closest);
      },
      advance: advanceSequence,
      loadLevel: (index: number) => {
        if (Number.isInteger(index) && index >= 0 && index < levels.length) loadLevel(index);
      },
      restart: () => loadLevel(levelIndex),
      start: () => setStarted(true),
    });
    window.__SIGNAL_SEQUENCE__ = api;
  }, [advanceSequence, answered, flagSignal, level, levelIndex, lives, loadLevel, paused, phase, prefix, score, started, streak]);

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
                    <SignalMark
                      signal={signal}
                      onClick={() => flagSignal(i)}
                      resolution={level.rules.some((rule) => {
                        const breaksHere = rule.evaluate(prefix.slice(0, i + 1)) === 'broken' && rule.evaluate(prefix.slice(0, i)) !== 'broken';
                        return breaksHere && answered[rule.id] === 'caught';
                      }) ? 'caught' : level.rules.some((rule) => {
                        const breaksHere = rule.evaluate(prefix.slice(0, i + 1)) === 'broken' && rule.evaluate(prefix.slice(0, i)) !== 'broken';
                        return breaksHere && answered[rule.id] === 'missed';
                      }) ? 'missed' : undefined}
                    />
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
              <RuleCard key={rule.id} rule={rule} prefix={prefix} answered={answered[rule.id]} showLtl={showLtl} index={index} />
            ))}
          </div>
          <div className="monitor-tip"><span>!</span><p><b>See a counterexample?</b> Click the offending signal before the next one arrives.</p></div>
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

      {!started && <TutorialPanel onStart={() => setStarted(true)} />}
      {['levelComplete', 'gameover', 'complete'].includes(phase) && <ResultPanel phase={phase} level={level} score={score} lives={lives} onAction={handleResult} />}
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(<App />);
