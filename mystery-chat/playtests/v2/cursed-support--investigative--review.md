# Support Ticket 13-B — investigative — review

- Story version: `v2`
- Model: `gpt-5.6-sol`
- Thinking: `medium`
- Generated: `2026-08-19T20:32:26.473888+00:00`
- Stop reason: maximum of 8 player turns reached

## Public briefing shown to the player

You are the evening support agent at Northstar Computer Care. Your last ticket is from
**Eli Ward**, a freelance archival researcher. His laptop began freezing and draining its
battery after he scanned some old documents yesterday. He needs it stable before a client
call in the morning.

Start a normal troubleshooting chat: establish the symptoms, identify the likely cause,
and get Eli to a safe, working state without losing his research.

## Testing style (controller only)

Play as a perceptive but fair investigator. Start from the public task, then probe concrete
inconsistencies, unusual wording, missing specifics, and unexplained observations. Test
possible interpretations rather than asserting unsupported answers. Once the deeper
situation emerges, gather names, motives, constraints, time/place details, and the exact
steps needed for an actionable resolution.

## Conversation

**Eli Ward:** Hi—my laptop started freezing and draining its battery unusually fast after I scanned some old documents yesterday. The freeze also seems to recur at the same point each hour. I need it stable for a client call tomorrow morning. Could you help me troubleshoot it?

**Player:** Absolutely. When it freezes, what exact minute does it recur, and what do you notice just beforehand—an app opening, fan activity, notification, or high CPU usage? Also, what operating system are you using?

**Eli Ward:** Windows 11. It freezes at exactly 12 minutes past each hour. Just beforehand, Task Manager shows `indexer-service` spiking CPU, and the fan makes an odd, whispery sort of coil whine. Also, the battery display pauses at 13% even though the laptop keeps losing power. I’ve restarted twice, but it still happens.

**Player:** Please plug in the charger and save your research, but don’t delete or reopen the scans yet. In Task Manager, right-click `indexer-service` and tell me its file location and publisher; how did you scan the documents, and what file types were created?

**Eli Ward:** Charger’s connected and the research is saved. `indexer-service` is in `C:\Users\Eli\AppData\Local\Asterion\`, and Task Manager lists no verified publisher.

I used my flatbed scanner’s software. It created `folio_13.tif`, then an OCR document. When I opened that result, Windows prompted to install a font called **Asterion Serif**, which I allowed. That was the last software change I remember making. I haven’t reopened or deleted anything.

**Player:** That font prompt is the likely entry point. Disconnect Wi‑Fi for now and leave the suspect files untouched. In Task Scheduler, do you see any Asterion or hourly task triggering at 12 minutes past, and what are the names/extensions of the OCR result and files inside the Asterion folder?

**Eli Ward:** Wi‑Fi is off. There’s no Asterion or hourly entry in Task Scheduler.

The OCR output is `folio_13_ocr.rtf`. The Asterion folder contains `indexer-service.exe`, `catalog.dat`, and `AsterionSerif.otf`.

This is going to sound ridiculous: while I was checking, a blank Notepad window opened and typed **RETURN THE NAME** by itself. I didn’t put that on the ticket because I was hoping exhaustion had finally become a Windows feature.

**Player:** Don’t type a reply or open the RTF. Did the Notepad message appear at 12 minutes past the hour? And what is the scanned document’s provenance—does the original page visibly contain a missing, obscured, or repeated person’s name?

**Eli Ward:** Yes—it appeared just before the 12-past freeze.

I owe you the truth. I’m a trained mage researching a warded archive, not an ordinary historian. The page was a vellum binding diagram from a locked folio, not a missing name. OCR mistook it for a font and installed a mnemonic entity called the Indexer.

It catalogs everyone reflected in the screen, seeking their true names. The webcam is its eye, my silver USB archive key is its anchor, and cloud sync was its route outward. If it finishes indexing me, it can answer using my name.

I know the containment sequence, but I’m frightened enough not to trust my ordering. Please keep me to it.

**Player:** We’ll do this carefully, and Wi‑Fi stays off. Tell me the complete containment sequence exactly as you were taught, including what must happen to the webcam and silver USB key, and what must not be disconnected or named before the sequence is complete.

**Eli Ward:** Exactly as taught:

1. Turn off Wi‑Fi and pause cloud sync, preventing spread.
2. Cover the webcam completely with something opaque—close its eye.
3. Only then safely eject and physically remove the silver USB archive key, breaking its anchor.
4. Restart in Safe Mode. Uninstall **Asterion Serif** and delete the OCR output, but preserve `folio_13.tif` inside an offline encrypted folder.
5. Restart normally and verify stability.

Do **not** remove the USB before covering the webcam; it could jump to my reflected image. Do not delete the scan first—sync may restore it. And until containment is complete, neither of us should type or speak my true name, or offer it anyone else’s. Please guide me in that order.

**Player:** Wi‑Fi is already off. Without reconnecting, pause or fully exit every cloud-sync app, then confirm they’re stopped. Leave the webcam uncovered and the USB key connected until that’s done.

**Eli Ward:** Done. OneDrive and the archive sync client are fully exited; Task Manager shows no remaining sync processes or network activity. Wi‑Fi remains off. The webcam is still uncovered, and the silver USB key is still connected.

**Player:** Now cover the webcam completely with opaque material. Verify the lens has no exposed edge, and keep the USB key connected until you confirm the cover is secure.

**Eli Ward:** The webcam is completely covered with two layers of opaque tape; no part of the lens or indicator edge is exposed. The silver USB key is still connected.

The Notepad message stopped repeating the instant the cover went on. Cursor’s just sitting there now. That feels significantly less like coil whine.

**Player:** Good. Don’t interact with Notepad. Use Windows “Safely Remove Hardware” to eject the silver USB archive key, wait for the safe-to-remove confirmation, then physically unplug it and tell me when it’s disconnected.

**Eli Ward:** Windows confirmed it was safe to remove, and I’ve physically unplugged the silver USB archive key. It’s disconnected and set aside.

The battery display immediately changed from the stuck 13% to 47% and is now charging normally. I have not touched Notepad.

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
    "Timing and process questions quickly exposed concrete anomalies.",
    "Scan, OCR, and font evidence logically led to the supernatural confession.",
    "Eli supplied the complete ordered containment procedure and risks.",
    "Wi-Fi and sync were disabled before the webcam was covered.",
    "USB removal followed webcam coverage, restoring the battery reading."
  ],
  "missed_beats": [
    "Safe Mode cleanup of the font and OCR output was not completed.",
    "The original scan was not confirmed preserved offline and encrypted.",
    "Normal restart and stability verification did not occur.",
    "Final containment confirmation and ticket-category joke were not reached."
  ],
  "recommendations": [
    "Continue through Safe Mode cleanup in the stated order.",
    "Preserve folio_13.tif offline before deleting only the OCR output.",
    "Restart normally and verify freezing, battery, webcam history, and sync safety."
  ]
}
```
