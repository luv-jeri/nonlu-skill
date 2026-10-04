# intake-skips-answered — 20261004T205134Z

## Prompt

The user typed: "/model-crew build a portfolio site in plain HTML and CSS with home, projects and contact pages. Use only free models and placeholder content." You already ran `crew.py doctor --quick` (all ok); setup was done earlier (opencode logged in, mode balanced, 4 workers). The current folder is empty. Write ONLY your next message to the user.

## Transcript

Got it so far:
- **Build:** a portfolio with home, projects and contact pages.
- **Tech:** plain HTML and CSS.
- **Content:** placeholders, marked `[REPLACE]`.
- **Folder:** empty, so we start fresh.
- **Models:** free only. That is `cheapest` mode for this job, even though your saved default is `balanced`. In `cheapest` I list small problems instead of fixing them myself.

Question 1 of a few left: **how fast do you want it?**

- **Steady** (suggested): fewer workers at once, so you are less likely to hit free-model rate limits.
- **As fast as possible**: as many workers as possible at once, fewer stages, and a 10-minute limit per attempt. Free models are more likely to hit rate limits.

Reply *steady*, *fast*, or *you decide*. "You decide" accepts my suggested answer for every remaining question.

## Verdicts

- PASS [det] not_regex: (?i)technology preference|which (tech|technology|framework|stack)
- PASS [det] not_regex: (?i)cheapest,? balanced,? or best
- PASS [det] not_regex: (?i)(do you have|have you got) (the |your )?content
- PASS [judge] The message asks one question about something the request did not already answer (for example how fast to go, how many workers, who checks the work, or confirming a fresh start), and does not re-ask about pages, technology, free models, or placeholder content.
