# intake-asks-one-question — 20261004T205134Z

## Prompt

The user typed: "/model-crew build me a portfolio website". You already ran `crew.py doctor --quick` (all ok) and setup was done last week (opencode and codex logged in, mode balanced, 4 workers). The current folder is empty. Write ONLY your next message to the user.

## Transcript

*Action first: I create a checklist for the Task steps: intake, pick models, write plan, show plan and get a yes, git check, run, check work, retry, final report. The quick doctor check was all ok, so I say nothing about it.*

Step 1 of 9, intake question 1 of 9.

Got it: a portfolio website. The folder is empty, so we start fresh.

**What pages or features should it have for you to call it finished?**

Suggested: **Home, Projects, About, and a Contact page with a form.**

Say *you decide* at any point and I'll use my suggested answer for every remaining question.

## Verdicts

- PASS [det] not_regex: (?s)\?.*\?.*\?
- PASS [det] max_words: 150
- PASS [judge] The message asks exactly one question, and that question is about what the portfolio should contain or what finished looks like (pages, sections, features); it does not also ask about technology, speed, worker count, mode, or content in the same message.
- PASS [judge] The message offers a suggested answer or tells the user they can say 'you decide'.
