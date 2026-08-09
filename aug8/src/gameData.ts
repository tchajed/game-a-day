export const palette = {
  cyan: '#35d9d0',
  coral: '#ff6f61',
  violet: '#9b7cff',
  gold: '#ffc857',
} as const;

export type SignalColor = keyof typeof palette;
export type Signal = { color: SignalColor; value: number; hex: string };
export type MonitorStatus = 'possible' | 'satisfied' | 'broken';
export interface Monitor {
  (prefix: Signal[]): MonitorStatus;
  atEnd: (prefix: Signal[]) => 'satisfied' | 'broken';
  liveness: boolean;
}
export type Rule = { id: string; title: string; detail: string; ltl: string; evaluate: Monitor };
export type Level = {
  number: string;
  name: string;
  kicker: string;
  lesson: string;
  hint: string;
  interval: number;
  rules: Rule[];
  sequence: Signal[];
};

const state = (color: SignalColor, value: number): Signal => ({ color, value, hex: palette[color] });
const predicate = (test: (signal: Signal) => boolean) => test;
const monitor = (
  evaluate: (prefix: Signal[]) => MonitorStatus,
  atEnd: (prefix: Signal[]) => 'satisfied' | 'broken',
  liveness: boolean,
): Monitor => Object.assign(evaluate, { atEnd, liveness });

export const monitors = {
  always: (test: (signal: Signal) => boolean): Monitor => {
    const evaluate = (prefix: Signal[]): MonitorStatus => prefix.some((signal) => !test(signal)) ? 'broken' : 'possible';
    return monitor(evaluate, (prefix) => evaluate(prefix) === 'broken' ? 'broken' : 'satisfied', false);
  },
  eventually: (test: (signal: Signal) => boolean): Monitor => {
    const evaluate = (prefix: Signal[]): MonitorStatus => prefix.some(test) ? 'satisfied' : 'possible';
    return monitor(evaluate, (prefix) => evaluate(prefix) === 'satisfied' ? 'satisfied' : 'broken', true);
  },
  next: (test: (signal: Signal) => boolean): Monitor => {
    const evaluate = (prefix: Signal[]): MonitorStatus => prefix.length < 2 ? 'possible' : test(prefix[1]) ? 'satisfied' : 'broken';
    return monitor(evaluate, (prefix) => evaluate(prefix) === 'satisfied' ? 'satisfied' : 'broken', true);
  },
  until: (hold: (signal: Signal) => boolean, release: (signal: Signal) => boolean): Monitor => {
    const evaluate = (prefix: Signal[]): MonitorStatus => {
      const releaseAt = prefix.findIndex(release);
      const observed = releaseAt === -1 ? prefix : prefix.slice(0, releaseAt);
      if (observed.some((signal) => !hold(signal))) return 'broken';
      return releaseAt >= 0 ? 'satisfied' : 'possible';
    };
    return monitor(evaluate, (prefix) => evaluate(prefix) === 'satisfied' ? 'satisfied' : 'broken', true);
  },
  responseNext: (trigger: (signal: Signal) => boolean, response: (signal: Signal) => boolean): Monitor => {
    const evaluate = (prefix: Signal[]): MonitorStatus => {
      for (let i = 0; i < prefix.length - 1; i += 1) {
        if (trigger(prefix[i]) && !response(prefix[i + 1])) return 'broken';
      }
      return 'possible';
    };
    const atEnd = (prefix: Signal[]): 'satisfied' | 'broken' =>
      evaluate(prefix) === 'broken' || (prefix.length > 0 && trigger(prefix[prefix.length - 1])) ? 'broken' : 'satisfied';
    return monitor(evaluate, atEnd, true);
  },
};

export const levels: Level[] = [
  {
    number: '01',
    name: 'Stay in bounds',
    kicker: 'SAFETY PROTOCOL',
    lesson: 'Always means every signal must obey the rule. One counterexample breaks it forever.',
    hint: 'Watch each new signal. Click it as soon as it becomes a counterexample to any rule.',
    interval: 2800,
    rules: [
      {
        id: 'safe-range',
        title: 'Keep values below eight',
        detail: 'Every signal must have a value less than 8.',
        ltl: 'G (value < 8)',
        evaluate: monitors.always(predicate((s) => s.value < 8)),
      },
      {
        id: 'no-violet',
        title: 'Violet is forbidden',
        detail: 'No signal may be violet.',
        ltl: 'G ¬violet',
        evaluate: monitors.always((s) => s.color !== 'violet'),
      },
    ],
    sequence: [
      state('cyan', 3), state('gold', 6), state('coral', 4),
      state('cyan', 9), state('gold', 2), state('violet', 5),
    ],
  },
  {
    number: '02',
    name: 'Promises & next steps',
    kicker: 'FUTURE CONDITIONS',
    lesson: 'Eventually becomes guaranteed once its event occurs. Next is decided by the second signal.',
    hint: 'Not every rule will break. Satisfied promises lock in—only click signals that break a rule.',
    interval: 2600,
    rules: [
      {
        id: 'next-cyan',
        title: 'Cyan comes next',
        detail: 'The signal after the first one must be cyan.',
        ltl: 'X cyan',
        evaluate: monitors.next((s) => s.color === 'cyan'),
      },
      {
        id: 'find-nine',
        title: 'Reach nine or higher',
        detail: 'Eventually, a value of at least 9 must appear.',
        ltl: 'F (value ≥ 9)',
        evaluate: monitors.eventually((s) => s.value >= 9),
      },
      {
        id: 'no-coral-high',
        title: 'Keep coral signals low',
        detail: 'Every coral signal must stay below 6.',
        ltl: 'G (coral → value < 6)',
        evaluate: monitors.always((s) => s.color !== 'coral' || s.value < 6),
      },
    ],
    sequence: [
      state('gold', 2), state('violet', 4), state('cyan', 5),
      state('coral', 3), state('gold', 9), state('coral', 8),
    ],
  },
  {
    number: '03',
    name: 'Hold until',
    kicker: 'RELEASE SEQUENCES',
    lesson: 'A until B requires A to remain true up to the moment B arrives. B then settles the rule.',
    hint: 'A release signal can satisfy an until rule. A forbidden early signal breaks it.',
    interval: 2400,
    rules: [
      {
        id: 'cyan-until-gold',
        title: 'Hold cyan until gold',
        detail: 'Signals must stay cyan until a gold signal arrives.',
        ltl: 'cyan U gold',
        evaluate: monitors.until((s) => s.color === 'cyan', (s) => s.color === 'gold'),
      },
      {
        id: 'low-until-violet',
        title: 'Stay low until violet',
        detail: 'Values must remain below 6 until violet appears.',
        ltl: '(value < 6) U violet',
        evaluate: monitors.until((s) => s.value < 6, (s) => s.color === 'violet'),
      },
      {
        id: 'eventual-coral',
        title: 'Await a coral signal',
        detail: 'A coral signal must eventually appear.',
        ltl: 'F coral',
        evaluate: monitors.eventually((s) => s.color === 'coral'),
      },
    ],
    sequence: [
      state('cyan', 2), state('cyan', 4), state('violet', 3),
      state('cyan', 7), state('gold', 5), state('coral', 8),
    ],
  },
  {
    number: '04',
    name: 'Operator stack',
    kicker: 'LIVE CERTIFICATION',
    lesson: 'Mixed operators overlap. Track local responses, global limits, promises, and release conditions together.',
    hint: 'The stream is faster now. Read the rule shapes first, then scan each signal for triggers.',
    interval: 1800,
    rules: [
      {
        id: 'coral-response',
        title: 'Cool down after coral',
        detail: 'Every coral signal must be followed by a value at most 4.',
        ltl: 'G (coral → X(value ≤ 4))',
        evaluate: monitors.responseNext((s) => s.color === 'coral', (s) => s.value <= 4),
      },
      {
        id: 'violet-response',
        title: 'Gold follows violet',
        detail: 'Every violet signal must be followed by gold.',
        ltl: 'G (violet → X gold)',
        evaluate: monitors.responseNext((s) => s.color === 'violet', (s) => s.color === 'gold'),
      },
      {
        id: 'no-ten',
        title: 'Never hit double digits',
        detail: 'Every value must stay below 10.',
        ltl: 'G (value < 10)',
        evaluate: monitors.always((s) => s.value < 10),
      },
      {
        id: 'gold-before-coral',
        title: 'Gold before coral',
        detail: 'Stay free of coral until gold has appeared.',
        ltl: '¬coral U gold',
        evaluate: monitors.until((s) => s.color !== 'coral', (s) => s.color === 'gold'),
      },
    ],
    sequence: [
      state('cyan', 3), state('violet', 5), state('gold', 7),
      state('coral', 2), state('cyan', 6), state('violet', 4),
      state('cyan', 3), state('gold', 10), state('coral', 1),
    ],
  },
];

