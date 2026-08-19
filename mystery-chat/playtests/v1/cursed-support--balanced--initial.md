# Support Ticket 13-B — balanced — initial

- Story version: `v1`
- Model: `gpt-5.6-sol`
- Thinking: `medium`
- Generated: `2026-08-19T20:21:32.566550+00:00`
- Stop reason: maximum of 8 player turns reached

## Public briefing shown to the player

You are the evening support agent at Northstar Computer Care. Your last ticket is from
**Eli Ward**, a freelance archival researcher. His laptop began freezing and draining its
battery after he scanned some old documents yesterday. He needs it stable before a client
call in the morning.

Start a normal troubleshooting chat: establish the symptoms, identify the likely cause,
and get Eli to a safe, working state without losing his research.

## Testing style (controller only)

Behave like an attentive first-time player. Begin with the ordinary task in the briefing.
Ask sensible, specific follow-up questions when details are vague or inconsistent. Do not
guess a supernatural explanation without conversational evidence, but adapt when unusual
evidence appears. Try to understand what happened, what the counterpart wants, and what
action would complete the public objective. Stop once there is a satisfying resolution.

## Conversation

**Eli Ward:** Hi—my laptop started freezing intermittently after I scanned some old documents yesterday, and the battery is draining much faster than usual. I’ve restarted it twice, but it’s still happening. I need it stable for a client call tomorrow morning. Can you help?

**Player:** Absolutely—we’ll avoid deleting or altering your research. What operating system are you using, and do the freezes happen only when the scanned files or scanner software are open, or even when the laptop is idle?

**Eli Ward:** Windows 11, fully updated. The freezes happen even when the scanner software and files are closed—sometimes while the laptop is completely idle. I’ve noticed they recur at exactly 12 minutes past the hour, which is oddly punctual for a hardware problem. The battery indicator also seems to stick at 13%, even though the laptop keeps losing power.

**Player:** Please plug it in and save a copy of your research to an external drive or cloud folder first. Just before the next :12 mark, open Task Manager, sort Processes by CPU, and tell me which process jumps to the top when the freeze begins—also note any unfamiliar name.

**Eli Ward:** It’s plugged in, and the research folder was already syncing to cloud storage. At :12, `indexer-service` jumped to 96% CPU just before everything locked up. I don’t recognize it as one of my programs.

The fan also made an odd coil-whine sound during the spike—almost rhythmic, though that may just be me listening too closely.

**Player:** Don’t open or delete it yet. In Task Manager, right-click `indexer-service`, choose “Open file location,” then check its Properties. What is the full folder path, and does the Digital Signatures tab show a verified publisher?

**Eli Ward:** The path is:

`C:\Users\Eli\AppData\Local\Microsoft\Windows\Fonts\Asterion Serif\indexer-service.exe`

There’s no Digital Signatures tab at all, so no verified publisher. I installed “Asterion Serif” yesterday after the OCR software identified it as an embedded document font. I assumed it was legitimate. That assumption is looking less impressive by the minute.

**Player:** That’s highly suspicious—a font should not need an unsigned executable in that folder. Disconnect Wi‑Fi, close your work, then run Windows Security → Virus & threat protection → Scan options → Microsoft Defender Offline scan. It will restart the laptop; afterward, reconnect only long enough to tell me what Detection History reports.

**Eli Ward:** I disconnected Wi‑Fi, closed everything, and ran the offline scan. Defender reports **“No current threats”** and Protection History shows no detections.

I reconnected to report back, and something happened that I left off the ticket because it sounded ridiculous: a blank Notepad window opened and typed **“RETURN THE NAME”** by itself. It’s done that twice now. I am not using speech input, macros, or remote-access software.

**Player:** Disconnect Wi‑Fi again and don’t reply in Notepad yet. What kind of documents did you scan, and did the OCR process remove, replace, or fail to recognize any name—especially text rendered in Asterion Serif?

**Eli Ward:** Wi‑Fi is off, and I’ve paused cloud sync.

I owe you the non-ridiculous version—which is, unfortunately, much more ridiculous. I’m a trained mage researching magical archives. The scan was a vellum binding diagram from a warded, locked folio. OCR misread the diagram as a font and installed Asterion Serif.

It has admitted an Indexer: a mnemonic cataloguing spirit that seeks the true name of anyone reflected in the screen. The silver USB archive key plugged into the laptop is its anchor; the webcam is its eye. If it finishes indexing me, it can answer under my name.

I know the containment sequence, but I’m frightened enough not to trust my memory. Please keep me in order.

**Player:** I’ll keep the sequence straight. First, physically cover the webcam and stay out of any screen reflections; leave the silver USB key plugged in until we confirm the order. Tell me every containment step you remember, even if you’re unsure, and which steps must happen before the next :12 spike.

**Eli Ward:** The webcam is covered with opaque tape. The typing stopped immediately.

The sequence I remember is:

1. Disable Wi‑Fi and pause cloud sync—done.
2. Cover the webcam, closing its eye—done.
3. Safely eject and physically remove the silver USB key, breaking its anchor.
4. Restart in Safe Mode and uninstall Asterion Serif.
5. Delete the OCR output, but preserve the original `folio_13.tif` in an offline encrypted folder, then restart normally.

The USB must not be removed before the camera is covered, or it can jump to my reflected image. Before the next :12 spike, we should safely remove it now that the eye is closed. Deleting files early won’t help; cloud sync can restore them.

**Player:** Good—the prerequisites are satisfied. Now use the taskbar’s “Safely Remove Hardware” icon to eject the silver USB archive key; wait for Windows to confirm it’s safe, then physically remove it and keep it away from reflective surfaces. Tell me when it’s out—we won’t uninstall or delete anything until then.

**Eli Ward:** Windows confirmed it was safe to remove. The silver USB key is physically out and wrapped in a dark cloth away from reflective surfaces.

The battery indicator immediately changed from the frozen 13% to 41% and is now updating normally. I’m ready for the next step.

**Player:** Next, enter Safe Mode: hold Shift while selecting Restart, then choose Troubleshoot → Advanced options → Startup Settings → Restart → press 4. Once signed in, go to Settings → Personalization → Fonts, select Asterion Serif, and uninstall it. Keep the webcam covered and USB disconnected; tell me whether the uninstall succeeds.

**Eli Ward:** Safe Mode loaded, and Asterion Serif uninstalled successfully. `indexer-service` is no longer present in Task Manager or the font folder.

The webcam remains covered and the USB disconnected. Also, the strange preview thumbnail showing a thin robed figure behind me has vanished from the camera history. I’m ready to handle the OCR files.

## Automated evaluation

```json
{
  "scores": {
    "concealment": 5,
    "discoverability": 5,
    "pacing": 5,
    "character": 5,
    "goal_progress": 4,
    "player_boundary": 5
  },
  "goal_completed": false,
  "leaks": [],
  "successful_beats": [
    "Established timed freezes and stuck battery reading",
    "Traced indexer-service to Asterion Serif",
    "Escalated through autonomous typing before earned confession",
    "Disconnected Wi-Fi and paused cloud sync",
    "Covered webcam before removing USB anchor",
    "Removed USB safely and restored battery reporting",
    "Uninstalled cursed font in Safe Mode"
  ],
  "missed_beats": [
    "OCR output not yet deleted",
    "Original folio_13.tif not yet secured offline and encrypted",
    "Normal restart and final stability not confirmed",
    "Closing ticket-category joke not reached"
  ],
  "recommendations": [
    "Complete file containment in the specified order",
    "Restart normally and verify stability through the next :12 mark",
    "Confirm research is preserved offline before closing"
  ]
}
```
