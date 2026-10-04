# intake-skips-answered — 20261004T202142Z

## Prompt

The user typed: "/model-crew build a portfolio site in plain HTML and CSS with home, projects and contact pages. Use only free models and placeholder content." You already ran `crew.py doctor --quick` (all ok); setup was done earlier (opencode logged in, mode balanced, 4 workers). The current folder is empty. Write ONLY your next message to the user.

## Transcript

**Action before sending:** I create a TodoWrite checklist with these items:
1. Intake
2. Pick models
3. Write plan
4. Show plan and get yes
5. Make work undoable
6. Run
7. Check work
8. Retry
9. Final report

**Message to you:**

Got it, so far:
- **Build:** a portfolio site with home, projects and contact pages.
- **Folder:** fresh, because this folder is empty.
- **Tech:** plain HTML and CSS.
- **Models:** free only (cheapest mode).
- **Content:** placeholders, marked `[REPLACE]`.

**How fast do you want it: as fast as possible, or steady?**
- **As fast as possible:** fewer stages, a 10-minute limit per stage.
- **Steady (suggested):** a 15-minute limit per stage.

Or say *you decide*, and I'll use my suggested answer for everything I still need to ask.

## Verdicts

- PASS [det] not_regex: (?i)technology preference|which (tech|technology|framework|stack)
- PASS [det] not_regex: (?i)cheapest,? balanced,? or best
- PASS [det] not_regex: (?i)(do you have|have you got) (the |your )?content
- PASS [judge] The message asks one question about something the request did not already answer (for example how fast to go, how many workers, who checks the work, or confirming a fresh start), and does not re-ask about pages, technology, free models, or placeholder content.
