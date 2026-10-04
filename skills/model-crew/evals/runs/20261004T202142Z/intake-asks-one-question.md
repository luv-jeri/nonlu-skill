# intake-asks-one-question — 20261004T202142Z

## Prompt

The user typed: "/model-crew build me a portfolio website". You already ran `crew.py doctor --quick` (all ok) and setup was done last week (opencode and codex logged in, mode balanced, 4 workers). The current folder is empty. Write ONLY your next message to the user.

## Transcript

Actions I'd take before sending this message:
1. Create a checklist for the Task section: intake, pick models, write plan, show plan and get a yes, git checkpoint, run, check, report.
2. Run `python3 $CREW config` to confirm the saved routes (opencode, codex), mode balanced and 4 workers. No setup is needed.

Message to the user:

---

Got it: a portfolio website, built from scratch, because this folder is empty. I'll ask a few short questions, one at a time.

**What pages or features should it have when it's finished?**

For example: home, projects, about, and a contact form. Tell me your own list. If you'd rather I choose, say *you decide* and I'll use the suggested answer for every remaining question.

## Verdicts

- PASS [det] not_regex: (?s)\?.*\?.*\?
- PASS [det] max_words: 150
- PASS [judge] The message asks exactly one question, and that question is about what the portfolio should contain or what finished looks like (pages, sections, features); it does not also ask about technology, speed, worker count, mode, or content in the same message.
- PASS [judge] The message offers a suggested answer or tells the user they can say 'you decide'.
