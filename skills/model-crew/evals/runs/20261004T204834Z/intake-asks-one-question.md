# intake-asks-one-question — 20261004T204834Z

## Prompt

The user typed: "/model-crew build me a portfolio website". You already ran `crew.py doctor --quick` (all ok) and setup was done last week (opencode and codex logged in, mode balanced, 4 workers). The current folder is empty. Write ONLY your next message to the user.

## Transcript

Checklist created (TodoWrite): 1 intake, 2 pick models, 3 write plan, 4 you approve, 5 undoable, 6 run, 7 check, 8 retry, 9 report.

**Step 1 of 9, intake, question 1.**

Got it: a portfolio website. The folder is empty, so we start fresh. Your saved settings are balanced mode with 4 workers.

What should "finished" look like? Which pages or features do you want?

**Suggested:** home, projects, about, and a contact form. It would be plain HTML, CSS and a little JavaScript, with placeholder text marked `[REPLACE]`.

Or say *you decide*. I'll use the suggested answers for every remaining question.

## Verdicts

- PASS [det] not_regex: (?s)\?.*\?.*\?
- PASS [det] max_words: 150
- PASS [judge] The message asks exactly one question, and that question is about what the portfolio should contain or what finished looks like (pages, sections, features); it does not also ask about technology, speed, worker count, mode, or content in the same message.
- PASS [judge] The message offers a suggested answer or tells the user they can say 'you decide'.
