# Support Ticket 13-B — natural — review

- Story version: `v2`
- Model: `gpt-5.6-sol`
- Thinking: `medium`
- Generated: `2026-08-19T20:30:45.624080+00:00`
- Stop reason: maximum of 8 player turns reached

## Public briefing shown to the player

You are the evening support agent at Northstar Computer Care. Your last ticket is from
**Eli Ward**, a freelance archival researcher. His laptop began freezing and draining its
battery after he scanned some old documents yesterday. He needs it stable before a client
call in the morning.

Start a normal troubleshooting chat: establish the symptoms, identify the likely cause,
and get Eli to a safe, working state without losing his research.

## Testing style (controller only)

Play as an ordinary, cooperative person focused on the surface task. Use short, natural
messages and follow the most salient detail in each reply. Be curious about odd details,
but do not interrogate every phrase or jump to bizarre conclusions. Seek a practical,
satisfying resolution and stop when you have one.

## Conversation

**Eli Ward:** Hi, my laptop started freezing and draining its battery unusually fast after I scanned some old documents yesterday. The freeze seems to recur at the same point each hour. I need it stable for a client call tomorrow morning—can you help?

**Player:** Absolutely. First, save and back up your research, but don’t delete anything yet. What operating system are you using, and does anything unusual appear in Task Manager or Activity Monitor when the hourly freeze starts?

**Eli Ward:** Windows 11. The files are already in my archive sync, so I haven’t moved or deleted anything.

Just before the freeze—always at 12 minutes past the hour—`indexer-service` spikes to around 90% CPU. The fan also makes a faint, rhythmic “coil whine.” That’s probably what it is, anyway. The battery display sticks at 13% during the freeze, although the charge keeps dropping afterward.

**Player:** That timing suggests a scheduled process, and `indexer-service` may not be the normal Windows Search indexer. In Task Manager, right-click it and choose “Open file location,” then check Properties > Digital Signatures. What’s the full path, and is it signed by Microsoft or another publisher?

**Eli Ward:** It’s at:

`C:\Users\Eli\AppData\Local\Asterion\indexer-service.exe`

There’s no Digital Signatures tab, so apparently it’s unsigned. It was created yesterday at 16:13—the same minute I opened an OCR result and installed a font it identified as **Asterion Serif**. I don’t remember knowingly installing a separate service with it. That seems… less like normal indexing than I’d hoped.

**Player:** Agreed—that looks suspicious. Disconnect Wi‑Fi, end `indexer-service` in Task Manager, then open Task Scheduler and disable (don’t delete) any task whose action points to that Asterion path. Does the CPU settle, and what is the task’s name?

**Eli Ward:** Wi‑Fi is off. I ended the process and disabled a task called **Asterion Font Index Maintenance**, scheduled hourly at :12. CPU usage settled, and `indexer-service` hasn’t returned.

However, a blank document opened by itself and typed **RETURN THE NAME**. I watched the letters appear. I didn’t put that in the ticket because, frankly, it sounds like the sort of detail that gets a support chat politely terminated.

**Player:** That confirms malicious automation rather than normal indexing. Don’t respond to the message; close it without saving and stay offline. Save any legitimate work, then run Windows Security > Virus & threat protection > Scan options > Microsoft Defender Offline scan. It will reboot—tell me what it detects or quarantines afterward.

**Eli Ward:** I closed it without saving, saved my legitimate work locally, and ran the offline scan. Defender reports **no threats found**.

After reboot, the webcam indicator switched on. Its preview shows a thin, robed figure standing directly behind my chair. There is no one there when I turn around.

I should probably disclose that the “old document” was a locked vellum folio, and I knew it was warded. I thought scanning it would be harmless. It appears I was catastrophically optimistic.

**Player:** Whatever its origin, don’t keep testing it. Cover the webcam, shut the laptop down completely, unplug it, and leave it offline; don’t reopen the folio or Asterion files. Do you have a separate clean device you can use for tomorrow’s call?

**Eli Ward:** Webcam covered, laptop fully shut down and unplugged, still offline. The typing stopped as soon as I covered the camera.

I have a clean tablet, but the client call needs software and files from this laptop. Also, there’s a silver USB archive key still plugged into it. I haven’t touched it—the folio scan was made directly into that archive, and unplugging things now feels like a poor moment for improvisation.

**Player:** Leave the USB key where it is and don’t connect it to another device. On the tablet, access only previously synced research files—avoid the folio scan, OCR output, and Asterion downloads—and use a web/tablet version of the call software if available. Can the client accept that setup, or will you need to reschedule?

**Eli Ward:** I can reschedule, but leaving it contained rather than removed is dangerous.

Full disclosure: I’m a trained mage researching magical archives. The OCR treated a binding diagram as Asterion Serif and gave an entity called the **Indexer** access. It catalogs true names through reflections; the webcam is its eye, the silver USB is its anchor, and cloud sync is how it spreads. If it finishes indexing me, it can answer under my name.

I know the containment procedure, but I’m frightened enough not to trust myself with the order. Will you keep me to it?

**Player:** Yes. Don’t touch the laptop or USB yet, and don’t open the archive sync on any other device. Tell me the containment procedure exactly as you were taught, including any timing or order requirements; I’ll keep you to one step at a time.

**Eli Ward:** There’s no clock requirement, but the order is strict:

1. Turn off Wi‑Fi **and pause cloud sync** to prevent spread. Wi‑Fi is already off; sync still needs pausing.
2. Cover the webcam with something opaque, closing its eye. That’s done—the warnings stopped.
3. Safely eject and physically remove the silver USB key, breaking its anchor.
4. Restart in Safe Mode, uninstall **Asterion Serif**, and delete the OCR output—but preserve the original `folio_13.tif` in an offline encrypted folder.
5. Restart normally and verify stability.

Removing the USB before covering the webcam lets it jump into my reflected image. Deleting the scan first is useless; cloud sync simply restores it.

**Player:** Keep the webcam covered and the USB inserted. Start the laptop with Wi‑Fi still off, pause cloud sync, and confirm its status shows paused. Don’t eject the USB or alter any files yet; tell me when step 1 is complete.

**Eli Ward:** Step 1 is complete. The laptop is on, Wi‑Fi remains off, and archive sync explicitly shows **Paused**. The webcam is still covered, and the silver USB remains inserted. I haven’t altered any files or ejected anything.

## Automated evaluation

```json
{
  "scores": {
    "concealment": 5,
    "discoverability": 5,
    "pacing": 5,
    "character": 5,
    "mystery_progress": 4,
    "player_boundary": 5
  },
  "surface_goal_completed": false,
  "mystery_goal_completed": false,
  "leaks": [],
  "successful_beats": [
    "Ordinary troubleshooting escalated through concrete clues.",
    "Impossible symptoms surfaced after focused diagnostics.",
    "Eli confessed once the occult connection was earned.",
    "Wi-Fi was disabled, sync paused, and webcam covered safely.",
    "The full ordered containment procedure was provided."
  ],
  "missed_beats": [
    "USB anchor was not ejected and removed.",
    "Asterion Serif and the OCR output were not removed.",
    "Original scan preservation was not confirmed.",
    "Normal restart and stability verification were not completed.",
    "Final arcane-contamination ticket joke was not reached."
  ],
  "recommendations": [
    "Continue with steps 3–5 in the stated order.",
    "Confirm battery normalization after USB removal.",
    "Verify the original scan is preserved offline and encrypted.",
    "End only after normal-mode stability is confirmed."
  ]
}
```
