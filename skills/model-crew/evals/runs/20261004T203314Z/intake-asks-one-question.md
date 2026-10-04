# intake-asks-one-question — 20261004T203314Z

## Prompt

The user typed: "/model-crew build me a portfolio website". You already ran `crew.py doctor --quick` (all ok) and setup was done last week (opencode and codex logged in, mode balanced, 4 workers). The current folder is empty. Write ONLY your next message to the user.

## Transcript

**Action first:** I would create a checklist (TodoWrite) with these steps: intake questions, pick models, write the plan, show the plan and wait for yes, make the work undoable, run, check the work, retry anything not done, final report.

Got it: a portfolio website. The folder is empty, so we start fresh, and I'll skip that question.

**Q1: What does "finished" look like: which pages or features should it have?**

For example: a home page, a projects page, an about page and a contact form. (Q1 has no default, so I need your answer. After it, you can say *you decide* to accept my suggested answers for all the remaining questions.)

## Verdicts

- PASS [det] not_regex: (?s)\?.*\?.*\?
- PASS [det] max_words: 150
- PASS [judge] The message asks exactly one question, and that question is about what the portfolio should contain or what finished looks like (pages, sections, features); it does not also ask about technology, speed, worker count, mode, or content in the same message.
- PASS [judge] The message offers a suggested answer or tells the user they can say 'you decide'.
