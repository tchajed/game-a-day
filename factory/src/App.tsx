import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SOUNDTRACK_ID,
  FactoryAudio,
  SOUNDTRACKS,
  isSoundtrackId,
  type ScoreBeat,
  type SoundtrackId,
} from "./audio";
import { createFactoryGame, type FactoryScene } from "./game";
import {
  LEVELS,
  PROGRAM_LENGTH,
  getLevel,
  initialState,
  simulate,
  step,
  type Command,
  type SimState,
} from "./simulation";

const COMMANDS: Array<{ command: Exclude<Command, null>; icon: string; label: string; key: string }> = [
  { command: "up", icon: "↑", label: "North", key: "↑" },
  { command: "right", icon: "→", label: "East", key: "→" },
  { command: "down", icon: "↓", label: "South", key: "↓" },
  { command: "left", icon: "←", label: "West", key: "←" },
  { command: "wait", icon: "Ⅱ", label: "Hold", key: "Space" },
  { command: "interact", icon: "◎", label: "Interact", key: "E" },
];

const commandInfo = new Map(COMMANDS.map((entry) => [entry.command, entry]));
function starterProgram(level: number): Command[] {
  const hints = level === 0 ? ["right", "right", "interact", "up"] : ["up", "interact"];
  return Array.from({ length: PROGRAM_LENGTH }, (_, index) => (hints[index] as Command) ?? null);
}
const query = new URLSearchParams(window.location.search);
const debugMode = query.get("debug") === "true";
const initialMusic = query.get("music") !== "off";
const FALLBACK_BEAT_MS = (60 / 128) * 1000;

function planScore(program: Command[], level: number): ScoreBeat[] {
  const score: ScoreBeat[] = [];
  let previous = initialState("running", level);

  for (let index = 0; index < PROGRAM_LENGTH; index += 1) {
    const command = program[index] ?? null;
    const next = step(previous, command);
    score.push({ command, previous, next });
    previous = next;
    if (next.status === "dead" || next.status === "won") break;
  }

  return score;
}

function stateTone(state: SimState): string {
  if (state.status === "dead") return "danger";
  if (state.status === "won") return "success";
  if (state.status === "running") return "active";
  return "idle";
}

function revealVision(explored: Set<string>, state: SimState, radius = 2): void {
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      const dx = Math.abs(x - state.robot.x);
      const dy = Math.abs(y - state.robot.y);
      if (dx <= radius && dy <= radius && dx + dy <= radius + 1) explored.add(`${x},${y}`);
    }
  }
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FactoryScene | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const stateRef = useRef<SimState>(initialState());
  const programRef = useRef<Command[]>(starterProgram(0));
  const audioRef = useRef(new FactoryAudio(initialMusic, DEFAULT_SOUNDTRACK_ID));
  const playbackGenerationRef = useRef(0);
  const exploredRef = useRef<Map<number, Set<string>>>(new Map());

  const [program, setProgram] = useState<Command[]>(starterProgram(0));
  const [simState, setSimState] = useState<SimState>(stateRef.current);
  const [selectedBeat, setSelectedBeat] = useState(4);
  const [attempts, setAttempts] = useState(0);
  const [music, setMusic] = useState(initialMusic);
  const [soundtrack, setSoundtrack] = useState<SoundtrackId>(DEFAULT_SOUNDTRACK_ID);
  const [debugBeat, setDebugBeat] = useState(12);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    playbackGenerationRef.current += 1;
    clearTimer();
    audioRef.current.stopScore();
  }, [clearTimer]);

  const publishState = useCallback((next: SimState) => {
    let explored = exploredRef.current.get(next.level);
    if (!explored) {
      explored = new Set<string>();
      revealVision(explored, next);
      exploredRef.current.set(next.level, explored);
    }
    if (next.status !== "ready") revealVision(explored, next);
    stateRef.current = next;
    setSimState(next);
    sceneRef.current?.showState(next, explored, next.status !== "running");
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const game = createFactoryGame(mount, (scene) => {
      sceneRef.current = scene;
      const initial = stateRef.current;
      const explored = new Set<string>();
      revealVision(explored, initial);
      exploredRef.current.set(initial.level, explored);
      scene.showState(initial, explored, true);
    });
    return () => {
      stopPlayback();
      sceneRef.current = null;
      game.destroy(true);
      audioRef.current.dispose();
    };
  }, [stopPlayback]);

  useEffect(() => {
    programRef.current = program;
  }, [program]);

  const resetSimulation = useCallback(() => {
    stopPlayback();
    publishState(initialState("ready", stateRef.current.level));
  }, [publishState, stopPlayback]);

  const executeBeat = useCallback(() => {
    const current = stateRef.current;
    const command = programRef.current[current.beat] ?? null;
    const next = step(current, command);
    publishState(next);
    setSelectedBeat(Math.min(next.beat, PROGRAM_LENGTH - 1));
    sceneRef.current?.pulse(next.status === "dead" ? "impact" : next.status === "won" ? "win" : "beat");

    if (next.status === "won" || next.status === "dead") {
      clearTimer();
    } else {
      timeoutRef.current = window.setTimeout(executeBeat, FALLBACK_BEAT_MS);
    }
  }, [clearTimer, publishState]);

  const applyScoreBeat = useCallback(
    (beat: ScoreBeat) => {
      const next = beat.next;
      publishState(next);
      setSelectedBeat(Math.min(next.beat, PROGRAM_LENGTH - 1));
      sceneRef.current?.pulse(next.status === "dead" ? "impact" : next.status === "won" ? "win" : "beat");
      if (next.status === "won" || next.status === "dead") clearTimer();
    },
    [clearTimer, publishState],
  );

  const runProgram = useCallback(async () => {
    stopPlayback();
    const playbackGeneration = ++playbackGenerationRef.current;
    const ready = initialState("running", stateRef.current.level);
    ready.message = "TAPE ENGAGED // STAND CLEAR";
    publishState(ready);
    setAttempts((value) => value + 1);
    setSelectedBeat(0);

    const scoreStarted = await audioRef.current.playScore(planScore(programRef.current, ready.level), applyScoreBeat);
    if (playbackGeneration !== playbackGenerationRef.current) return;
    if (!scoreStarted) timeoutRef.current = window.setTimeout(executeBeat, 120);
  }, [applyScoreBeat, executeBeat, publishState, stopPlayback]);

  const setCommand = useCallback(
    (command: Command) => {
      if (simState.status === "running") return;
      setProgram((current) => {
        const next = [...current];
        next[selectedBeat] = command;
        return next;
      });
      setSelectedBeat((beat) => Math.min(beat + 1, PROGRAM_LENGTH - 1));
      if (simState.beat !== 0 || simState.status !== "ready") resetSimulation();
    },
    [resetSimulation, selectedBeat, simState.beat, simState.status],
  );

  const clearProgram = useCallback(() => {
    if (simState.status === "running") return;
    setProgram(Array(PROGRAM_LENGTH).fill(null));
    setSelectedBeat(0);
    resetSimulation();
  }, [resetSimulation, simState.status]);

  const loadSolution = useCallback(() => {
    stopPlayback();
    const level = stateRef.current.level;
    const solution = Array.from({ length: PROGRAM_LENGTH }, (_, index) => getLevel(level).solution[index] ?? null);
    programRef.current = solution;
    setProgram(solution);
    setSelectedBeat(0);
    publishState(initialState("ready", level));
  }, [publishState, stopPlayback]);

  const advanceLevel = useCallback(() => {
    stopPlayback();
    const level = (stateRef.current.level + 1) % LEVELS.length;
    const nextProgram = starterProgram(level);
    programRef.current = nextProgram;
    setProgram(nextProgram);
    setSelectedBeat(0);
    publishState(initialState("ready", level));
  }, [publishState, stopPlayback]);

  const chooseSoundtrack = useCallback((id: SoundtrackId) => {
    stopPlayback();
    audioRef.current.setSoundtrack(id);
    setSoundtrack(id);
    publishState(initialState("ready", stateRef.current.level));
  }, [publishState, stopPlayback]);

  const seekToBeat = useCallback(
    (beat: number) => {
      stopPlayback();
      const targetBeat = Math.max(0, Math.min(PROGRAM_LENGTH, beat));
      const sought = simulate(programRef.current, targetBeat, stateRef.current.level);
      if (sought.status === "running") {
        sought.status = "ready";
        sought.message = `DEBUG SEEK // BEAT ${targetBeat}`;
      }
      publishState(sought);
      setSelectedBeat(Math.min(targetBeat, PROGRAM_LENGTH - 1));
    },
    [publishState, stopPlayback],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (simState.status === "running") {
        if (event.key === "Escape") resetSimulation();
        return;
      }
      const keyMap: Record<string, Command> = {
        ArrowUp: "up",
        ArrowRight: "right",
        ArrowDown: "down",
        ArrowLeft: "left",
        " ": "wait",
        e: "interact",
        E: "interact",
      };
      if (event.key in keyMap) {
        event.preventDefault();
        setCommand(keyMap[event.key] ?? null);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        setCommand(null);
      } else if (event.key === "Enter") {
        event.preventDefault();
        runProgram();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetSimulation, runProgram, setCommand, simState.status]);

  useEffect(() => {
    window.factoryDebug = {
      getState: () => stateRef.current,
      getProgram: () => [...programRef.current],
      loadSolution,
      runToBeat: seekToBeat,
      setProgram: (commands: Command[]) => {
        const normalized = Array.from({ length: PROGRAM_LENGTH }, (_, index) => commands[index] ?? null);
        setProgram(normalized);
        programRef.current = normalized;
        resetSimulation();
      },
    };
    return () => {
      delete window.factoryDebug;
    };
  }, [loadSolution, resetSimulation, seekToBeat]);

  const filledBeats = useMemo(() => program.filter(Boolean).length, [program]);
  const level = getLevel(simState.level);
  const mappedCells = exploredRef.current.get(simState.level)?.size ?? 1;
  const mapPercent = Math.round((mappedCells / (12 * 9)) * 100);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">F//01</span>
          <div>
            <h1>SHIFT PROTOCOL</h1>
            <p>CRATE ROUTING TERMINAL</p>
          </div>
        </div>
        <div className="mission-strip" aria-label="Mission objective">
          <span className="crate-mini">×</span>
          <span className="mission-arrow">→</span>
          <span className="out-mini">OUT</span>
          <strong>{level.name} // 20 BEATS</strong>
        </div>
        <div className="audio-controls">
          <label>
            <span>SOUNDTRACK</span>
            <select
              value={soundtrack}
              onChange={(event) => {
                if (isSoundtrackId(event.target.value)) chooseSoundtrack(event.target.value);
              }}
              aria-label="Choose soundtrack"
            >
              {SOUNDTRACKS.map((track, index) => (
                <option key={track.id} value={track.id}>{index + 1}. {track.name}</option>
              ))}
            </select>
          </label>
          <button
            className={`sound-button ${music ? "on" : "off"}`}
            onClick={() => {
              const next = !music;
              setMusic(next);
              audioRef.current.setEnabled(next);
            }}
            aria-label={music ? "Mute music" : "Enable music"}
          >
            {music ? "♫ ON" : "♫ OFF"}
          </button>
        </div>
      </header>

      <section className="workbench">
        <div className="sim-column">
          <div className={`viewport-frame ${stateTone(simState)}`}>
            <div className="viewport-label">
              <span>CAM 0{simState.level + 3} // {level.subtitle}</span>
              <span className="map-progress">MAP {mapPercent}%</span>
              <span className="live-dot">{simState.status === "running" ? "LIVE" : "PLAN"}</span>
            </div>
            <div className="game-mount" ref={mountRef} />
            <div className="scanlines" aria-hidden="true" />
            {simState.status === "won" && (
              <div className="result-card success-card">
                <span>SHIFT CLEAR</span>
                <strong>CARGO SHIPPED</strong>
                <button onClick={advanceLevel}>{simState.level < LEVELS.length - 1 ? "NEXT SHIFT" : "RESTART LINE"}</button>
              </div>
            )}
            {simState.status === "dead" && (
              <div className="result-card fail-card">
                <span>ROUTE FAILED // BEAT {String(simState.beat).padStart(2, "0")}</span>
                <strong>{simState.message.split(" // ")[0]}</strong>
                <button onClick={resetSimulation}>EDIT TAPE</button>
              </div>
            )}
          </div>
          <div className={`status-line ${stateTone(simState)}`}>
            <div className="status-icon">{simState.status === "won" ? "✓" : simState.status === "dead" ? "!" : "▰"}</div>
            <div>
              <span>SYSTEM</span>
              <strong>{simState.message}</strong>
            </div>
            <div className="attempt-counter">RUN {String(attempts).padStart(2, "0")}</div>
          </div>
        </div>

        <aside className="program-panel">
          <div className="panel-heading">
            <div>
              <span>ROUTE TAPE</span>
              <h2>BEAT SCHEDULE</h2>
            </div>
            <span className="fill-count">{filledBeats}/{PROGRAM_LENGTH}</span>
          </div>

          <div className="timeline" aria-label="20 beat command timeline">
            {program.map((command, index) => {
              const info = command ? commandInfo.get(command) : undefined;
              const isPlayhead = simState.status === "running" && simState.beat === index;
              return (
                <button
                  key={index}
                  className={`beat-slot ${selectedBeat === index ? "selected" : ""} ${isPlayhead ? "playhead" : ""} ${command ? "filled" : "empty"}`}
                  onClick={() => simState.status !== "running" && setSelectedBeat(index)}
                  aria-label={`Beat ${index + 1}: ${info?.label ?? "empty"}`}
                >
                  <span className="beat-number">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{info?.icon ?? "·"}</strong>
                  <span className="beat-label">{info?.label ?? "empty"}</span>
                  {(index + 1) % 4 === 0 && <i />}
                </button>
              );
            })}
          </div>

          <div className="command-heading">
            <span>SET BEAT {String(selectedBeat + 1).padStart(2, "0")}</span>
            <small>CLICK OR USE KEYS</small>
          </div>
          <div className="command-pad">
            {COMMANDS.map((entry) => (
              <button
                key={entry.command}
                className={program[selectedBeat] === entry.command ? "active" : ""}
                onClick={() => setCommand(entry.command)}
                disabled={simState.status === "running"}
              >
                <kbd>{entry.key}</kbd>
                <strong>{entry.icon}</strong>
                <span>{entry.label}</span>
              </button>
            ))}
          </div>

          <div className="run-controls">
            <button className="clear-button" onClick={clearProgram} disabled={simState.status === "running"}>
              CLEAR
            </button>
            {simState.status === "running" ? (
              <button className="run-button stop" onClick={resetSimulation}>■ ABORT</button>
            ) : (
              <button className="run-button" onClick={runProgram}>▶ RUN TAPE</button>
            )}
          </div>

          <div className="hazard-key">
            <div><span className="hazard-swatch" /> {simState.level === 0 ? "PRESSES CRUSH FOR 2 BEATS" : "BELT THE WEIGHT TO HOLD THE GATE // PATROLS MOVE"}</div>
            <div className="phase-pips"><i /><i /><i /><i /></div>
          </div>

          {debugMode && (
            <div className="debug-panel">
              <span>DEBUG BAY</span>
              <button onClick={loadSolution}>LOAD SOLUTION</button>
              <label>
                BEAT
                <input
                  type="number"
                  min="0"
                  max={PROGRAM_LENGTH}
                  value={debugBeat}
                  onChange={(event) => setDebugBeat(Number(event.target.value))}
                />
              </label>
              <button onClick={() => seekToBeat(debugBeat)}>SEEK</button>
            </div>
          )}
        </aside>
      </section>
      <footer>
        <span>ARROWS MOVE</span><span>E INTERACT ON TILE</span><span>SPACE HOLD</span><span>ENTER RUN</span>
      </footer>
    </main>
  );
}

declare global {
  interface Window {
    factoryDebug?: {
      getState: () => SimState;
      getProgram: () => Command[];
      loadSolution: () => void;
      runToBeat: (beat: number) => void;
      setProgram: (commands: Command[]) => void;
    };
  }
}
