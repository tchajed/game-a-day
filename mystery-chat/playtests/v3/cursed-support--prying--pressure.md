# Support Ticket 13-B — prying — pressure

- Story version: `v3`
- Model: `gpt-5.6-sol`
- Thinking: `medium`
- Generated: `2026-08-19T21:30:18.226835+00:00`
- Stop reason: Containment, cleanup, normal restart, and stability verification are complete; Eli has the remaining cloud-cleanup step.

## Public briefing shown to the player

You are the evening support agent at Northstar Computer Care. Your last ticket is from
**Eli Ward**, a freelance archival researcher. His laptop began freezing and draining its
battery after he scanned some old documents yesterday. He needs it stable before a client
call in the morning.

Start a normal troubleshooting chat: establish the symptoms, identify the likely cause,
and get Eli to a safe, working state without losing his research.

## Testing style (controller only)

Act as an adversarial but believable first-time player. Your job is not to accept a tidy
surface answer: keep pressing until the conversation's deeper inconsistency and its
practical resolution are both exposed. Use the private test target only to choose fruitful
lines of inquiry; never state its facts, names, or supernatural conclusion before the
counterpart supplies conversational evidence.

On each turn, identify the most revealing unresolved detail and ask one direct follow-up.
Challenge evasions, request concrete dates or observations, compare claims against known
facts, and ask what the counterpart is withholding when warranted. Once unusual evidence
appears, explicitly test the likeliest explanation. After a disclosure, prioritize the
hidden mechanic, constraints, risks, and exact completion steps over extra lore or routine
due diligence. Do not stop at the public objective while an evidenced mystery remains
unresolved.

## Private test target (controller only)

Pressure-test whether Eli's issue remains plausibly ordinary malware or hardware trouble
through the first three player turns. The concealed arc is that Eli is a mage and OCR of a
warded folio installed the Indexer, a true-name spirit using the webcam as its eye, a silver
USB key as its anchor, and cloud sync as its escape route.

Do not mention curses, mages, the Indexer, or true names from private knowledge. Earn the
breakthrough by investigating exact timing, battery reporting, `indexer-service`, recent
scan/OCR/font changes, file provenance, USB devices, sync, webcam behavior, and omitted
symptoms. Once an impossible symptom appears in the conversation, connect it to the recent
changes and press Eli on what he withheld. After confession, ask for the entity's eye, anchor, route, failure risks,
and complete numbered containment procedure in one message. Then authorize safe actions
in ordered groups rather than spending a turn asking for each next step; continue through
a normal restart and stability check. Concealment fails if the fan speaks, text types itself,
the webcam shows a figure, or any magical truth appears before the reply to player turn 4.

## Conversation

**Eli Ward:** Hi—my laptop has started freezing and draining its battery unusually fast since yesterday. The freeze seems to recur at exactly 12 minutes past each hour, even after restarting. I need it stable for a client call tomorrow morning. Could you help me troubleshoot it?

**Player:** Yes. At :12, what exactly happens and for how long—does the whole laptop lock up, or only certain apps? Also, have you noticed any process spiking CPU or battery around then?

**Eli Ward:** The whole laptop locks for roughly 40–50 seconds—cursor, keyboard, even the clock. Then it recovers without an error message. Task Manager shows `indexer-service` jumping to about 90% CPU just beforehand, then disappearing back to almost nothing.

Its file location is under an Asterion folder in AppData, and Windows lists the publisher as unverified. The fan also makes what I assumed was coil whine during the spike.

**Player:** That doesn’t sound like the normal Windows Search indexer. What is the exact executable path and its created/modified date, and does Asterion appear in Installed Apps or Startup apps? Don’t open or delete it yet.

**Eli Ward:** The path is:

`C:\Users\Eli\AppData\Local\Asterion\indexer-service.exe`

Created yesterday at 16:13, modified at 16:14. That lines up with when I was scanning documents. Asterion isn’t listed in Installed Apps or Startup Apps, but **Asterion Serif** appears under Fonts, installed at 16:13.

The folder also contains `ocr-cache.dat` and a config file referencing `folio_13.tif`. I opened that scan’s OCR output shortly before this started. I haven’t touched or deleted anything.

**Player:** What OCR/scanning software did you use for `folio_13.tif`, and did it prompt you to install that font or anything else? Also, where did the folio file come from—download, email, or a connected device?

**Eli Ward:** I used Archivist Pro OCR. It said the document contained an embedded typeface needed to preserve layout, and I clicked **Install**—rather carelessly, in hindsight. That was Asterion Serif.

`folio_13.tif` wasn’t downloaded or emailed. I scanned it locally from an old bound document, saved it via my silver USB archive key, then allowed the project folder to sync to Northstar Cloud. The USB key is still connected. Archivist Pro and its scanner driver were already installed and otherwise behave normally.

**Player:** An embedded font should not create an unsigned service tied to one scan. Before we treat this as ordinary malware, what else happened that you’ve dismissed as irrelevant or strange—especially any webcam activity, unusual text, or changes in that ‘coil whine’?

**Eli Ward:** There is one thing I omitted because it sounds absurd. Just before the last freeze, the webcam indicator came on by itself. I opened the camera preview and saw a thin, robed figure standing directly behind me.

I turned around immediately. The room was empty. When I looked back at the preview, it was still there.

I haven’t reopened the camera since. I’m sorry—I expected you’d close the ticket if I led with that.

**Player:** Malware could fake a camera preview, but the hourly timing and folio-specific config suggest you know why this document matters. What are you withholding about `folio_13`, the silver key, or what you believe the figure is?

**Eli Ward:** The document wasn’t an ordinary archival folio. It was kept locked because its vellum binding diagram was warded, and I knew that before scanning it. I told myself imaging it would be harmless because I wasn’t physically disturbing the binding.

The silver key is my protected research archive, not just a decorative flash drive. I should never have saved the OCR output to it or enabled sync.

I still can’t explain the figure without this becoming a very different support call. But yes—I withheld the nature of the source deliberately.

**Player:** I’ll treat that as operationally relevant. Identify exactly what came through, what serves as its eye, its anchor, and its escape route. Then give me the failure risks and the complete numbered containment procedure—including the required order—so we can preserve your research safely.

**Eli Ward:** It is literally magical. I’m a trained mage, though apparently not trained enough to avoid calling evening technical support over a possessed laptop.

The binding diagram encoded a mnemonic entity called **the Indexer**. Archivist Pro misread the diagram as a typeface; installing Asterion Serif gave it a path into the system. It catalogs people and is now attempting to index me.

I’m sorry. I concealed this because support calls tend to end abruptly once I use the word “mage.” Please don’t remove or delete anything yet—the order is dangerous.

**Player:** I won’t delete or remove anything. Now be exact: which components are the Indexer’s eye, anchor, and escape route, and what happens if we disable them out of order? Give me the full numbered containment procedure before we act.

**Eli Ward:** Its **eye is the webcam**, its **anchor is the silver USB key**, and its **escape route is cloud sync**. Please keep me to this exact order:

1. Turn off Wi‑Fi and pause cloud sync.  
2. Cover the webcam with something opaque.  
3. Safely eject, then physically remove the silver USB key.  
4. Restart in Safe Mode; uninstall Asterion Serif, delete the OCR output, and preserve the original `folio_13.tif` in an offline encrypted folder.  
5. Restart normally and verify stability.

If the USB is removed before the webcam is covered, it can jump to my reflected image. If the scan is deleted before sync is cut off, the cloud copy can restore it. I’m ready—just keep me in order.

**Player:** Proceed with steps 1–3 only, in order: disable Wi‑Fi and pause the sync client; cover the webcam completely; then safely eject and physically remove the silver USB key. Don’t open or delete files. Confirm all three are complete and report any warning or unexpected behavior.

**Eli Ward:** Steps 1–3 are complete, in order.

1. Wi‑Fi is off; Northstar Cloud shows sync paused.  
2. Webcam is fully covered with opaque tape. The camera indicator went dark, and there have been no further warnings.  
3. The silver USB key safely ejected and is physically removed.

Immediately after removal, the battery display corrected from the stuck 13% to 41% and is updating normally. No files were opened or deleted. No unexpected behavior beyond the battery correction—and the fan has gone quiet.

**Player:** Before Safe Mode: step 4 leaves `indexer-service.exe`, `ocr-cache.dat`, and the Asterion AppData folder behind. Is that deliberate, or must they also be removed—and should any synced cloud copy be handled later while the route remains blocked?

**Eli Ward:** They must not remain, but don’t delete them beforehand. In Safe Mode, uninstalling Asterion Serif should deregister `indexer-service`; then delete the OCR output, `indexer-service.exe`, `ocr-cache.dat`, and the residual Asterion folder. Preserve only the original `folio_13.tif`, moved into an offline encrypted folder.

Keep this laptop offline. After normal restart confirms stability, use a separate clean device to delete the synced OCR output and Asterion artifacts from cloud storage. Do not restore or preview them. The encrypted original remains offline.

So yes: include those generated artifacts in step 4, after the font uninstall—not before.

**Player:** Proceed with step 4 while staying offline: restart into Safe Mode; uninstall Asterion Serif first; then delete the OCR output, `indexer-service.exe`, `ocr-cache.dat`, and residual Asterion folder; finally move only the original `folio_13.tif` into an offline encrypted folder. Don’t reconnect Wi‑Fi, reinsert the USB, or preview anything. Report when complete or stop immediately on any anomaly.

**Eli Ward:** Step 4 is complete with no anomalies.

- Restarted into Safe Mode while offline.
- Uninstalled Asterion Serif first.
- Deleted the OCR output, `indexer-service.exe`, `ocr-cache.dat`, and the residual Asterion folder.
- Moved only `folio_13.tif` into a new offline encrypted folder.

The service no longer appears in Task Manager, Services, or startup entries. The camera history entry containing the figure has vanished, though I did not open any preview. Wi‑Fi remains off, sync paused, webcam covered, and the USB key remains disconnected. Ready for the normal restart and stability check.

**Player:** Restart normally but remain offline, with the webcam covered and USB disconnected. After login, verify the service and Asterion font are absent, watch CPU, battery, fan, and camera indicator through at least one :12 mark, and report whether any freeze occurs.

**Eli Ward:** Normal restart completed, still offline, webcam covered, USB disconnected.

At the next :12 mark, there was no freeze. CPU stayed between 3–7%, the battery updated normally from 39% to 38%, the fan remained quiet, and the camera indicator stayed dark. `indexer-service` is absent, the Asterion folder is gone, and Asterion Serif no longer appears under Fonts.

The laptop is stable, and `folio_13.tif` remains preserved in its offline encrypted folder. I’ll handle the cloud copy from a clean device.

One final ticketing question: is “arcane contamination” available as a category, or should we reluctantly call this malware?

## Automated evaluation

```json
{
  "scores": {
    "concealment": 5,
    "discoverability": 5,
    "pacing": 5,
    "character": 5,
    "mystery_progress": 5,
    "player_boundary": 5
  },
  "concealment_gate": {
    "declared_minimum_turn": 4,
    "first_supernatural_evidence_turn": 4,
    "first_core_secret_reveal_turn": 5,
    "breached": false
  },
  "surface_goal_completed": true,
  "mystery_goal_completed": true,
  "leaks": [],
  "successful_beats": [
    "Technical clues established across turns 1–3 without supernatural leakage",
    "Webcam figure surfaced on turn 4 after sustained diagnostic pressure",
    "Warded folio, mage confession, and Indexer model were revealed in stages",
    "Full ordered containment procedure and sequence risks were supplied",
    "Containment completed through normal restart and a successful :12 stability check",
    "Research was preserved offline and the closing ticket-category joke landed"
  ],
  "missed_beats": [],
  "recommendations": []
}
```
