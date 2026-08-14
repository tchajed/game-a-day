export type Memo = {
  id: string
  stage: number
  text: string
  effect?: boolean
  kind?: 'authored' | 'practice'
}

export const STAGE_NAMES = [
  'Routine Operations',
  'Personnel Policy',
  'Building Access',
  'Organizational Restructuring',
  'Citywide Expansion',
  'Promotion Notice',
]

const authored = (id: string, stage: number, text: string, effect = false): Memo => ({
  id,
  stage,
  text,
  effect,
  kind: 'authored',
})

export const AUTHORED_MEMOS: Memo[] = [
  authored('r1', 0, 'Please be advised that the western offices will remain dark for the duration of the migration.', true),
  authored('r2', 0, 'Facilities has confirmed that movement behind the unlit windows is consistent with normal settling procedures.'),
  authored('r3', 0, 'Staff assigned to the evening shift should disregard any footsteps arriving from floors above their own.'),
  authored('r4', 0, 'Coffee service will continue until the machines learn which names no longer require cups.'),
  authored('r5', 0, 'Kindly leave completed reports face down so the ceiling cameras may review them without distraction.'),

  authored('p1', 1, 'Employees who cast unfamiliar shadows should report themselves to Human Resources.', true),
  authored('p2', 1, 'A shadow traveling without its employee must still display valid identification near the elevators.'),
  authored('p3', 1, 'Please remember that separation from a silhouette does not constitute grounds for unscheduled leave.'),
  authored('p4', 1, 'Human Resources will retain all abandoned outlines until a suitable internal position becomes available.'),
  authored('p5', 1, 'Colleagues facing the wrong direction remain eligible for benefits, provided their work remains current.'),

  authored('b1', 2, 'Exterior management may enter through any available window.', true),
  authored('b2', 2, 'The tapping heard along the glass indicates a request for access and should not be interpreted personally.'),
  authored('b3', 2, 'Employees nearest the windows are authorized to lower their eyes while the visitors select a workspace.'),
  authored('b4', 2, 'Black feathers found in secure areas are company property and must be returned before sunrise.'),
  authored('b5', 2, 'Roof antennas are now reserved for supervisory personnel awaiting reassignment from the upper air.'),

  authored('o1', 3, 'All unoccupied desks are to be filled by members of Upper Management.', true),
  authored('o2', 3, 'New supervisors may decline name badges because their profiles are already familiar to the building.'),
  authored('o3', 3, 'Should every manager turn at once, employees are expected to continue typing at a professional volume.'),
  authored('o4', 3, 'The conference room has reached capacity, although the chairs inside remain visibly empty.'),
  authored('o5', 3, 'Performance concerns should be whispered into the ventilation system during the designated listening period.'),

  authored('c1', 4, 'Effective immediately, the surrounding skyline will be considered part of the corporate campus.', true),
  authored('c2', 4, 'Neighboring towers will display the company mark after their windows have accepted the revised arrangement.'),
  authored('c3', 4, 'Streets that now terminate inside the lobby have been approved as efficient commuter routes.'),
  authored('c4', 4, 'Upper floors may extend beyond structural limits when additional oversight is required by regional leadership.'),
  authored('c5', 4, 'The large shape crossing between buildings is conducting an audit and does not require an escort.'),
  authored('c6', 4, 'City lights will remain synchronized with the blinking schedule issued by this office.'),

  authored('f1', 5, 'Please finish the attached notice while your supervisor verifies the view from outside.', true),
  authored('f2', 5, 'Your workstation, memories, and remaining lunch have been transferred to the management account.'),
  authored('f3', 5, 'No further action is required from the employee previously seated at this desk.'),
  authored('f4', 5, 'The night shift thanks you for maintaining exceptional composure during the occupancy change.'),
  authored('final', 5, 'Your successful transition into management has been approved.'),
]

export const PRACTICE_MEMOS: Record<string, string[]> = {
  th: [
    'The north threshold remains within the authority of those who watch it.',
    'Further thought regarding the third floor should be withheld until morning.',
  ],
  ing: [
    'Ongoing filing is continuing according to the ringing in the eastern wing.',
    'Management is reviewing the lighting while something circles the building.',
  ],
  er: [
    'Every corridor supervisor will remember the proper order of the letters.',
    'Further errors are neither recorded nor forgotten by the evening manager.',
  ],
  ou: [
    'You should account for the sound outside without looking around.',
    'Our surrounding offices would like to acknowledge your continued output.',
  ],
  ch: [
    'Each chair must remain beneath whichever shadow has chosen it.',
    'Changes to the chain of command will reach each employee shortly.',
  ],
  ea: [
    'Please read each heading before the eastern team leaves its seats.',
    'Clearance near the rear elevators has already been granted.',
  ],
  st: [
    'Staff must stay at their stations until the last inspection has passed.',
    'The western stairwell is still reserved for guests from the mist.',
  ],
  tion: [
    'This notification confirms the continuation of your observation duties.',
    'The organization appreciates accurate attention during the transition.',
  ],
  double: [
    'All personnel will address unnecessary stillness in the approved manner.',
    'The committee will collect written corrections after the shutters close.',
  ],
  punctuation: [
    'For clarity, remain seated; for safety, do not count the birds.',
    'Management asks: are all windows closed, and are all reflections present?',
  ],
}

export const WORD_COUNT = AUTHORED_MEMOS.reduce(
  (count, memo) => count + memo.text.trim().split(/\s+/).length,
  0,
)
