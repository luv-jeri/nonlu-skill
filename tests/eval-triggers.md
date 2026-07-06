# Boost — Trigger Evaluation Tests

20 test scenarios for validating whether the boost skill correctly activates or stays silent.

## How to Run

Present each scenario to the agent. Record whether the skill activated (TRIGGER) or did not (NO TRIGGER). Compare against expected result.

**Pass criteria:** 18/20 correct (90% accuracy).

---

## SHOULD Trigger (10 scenarios)

| # | Input | Expected | Reason |
|---|-------|----------|--------|
| 1 | `fix the login bug /boost` | TRIGGER (suffix, Debug) | Standard suffix invocation |
| 2 | `/boost add user authentication` | TRIGGER (prefix, Feature) | Standard prefix invocation |
| 3 | `refactor utils /boost!` | TRIGGER (fast-track suffix, Refactor) | Fast-track suffix |
| 4 | `/boost! clean up the database queries` | TRIGGER (fast-track prefix, Refactor) | Fast-track prefix |
| 5 | `explain how the auth module works /boost` | TRIGGER (suffix, Docs) | Docs category detection |
| 6 | `/boost` | TRIGGER (ask for prompt) | Bare invocation, should ask what to do |
| 7 | `write tests for the API /boost` | TRIGGER (suffix, Test) | Test category detection |
| 8 | `/BOOST fix the navbar` | TRIGGER (prefix, Debug) | Case-insensitive |
| 9 | `review the PR changes /boost` | TRIGGER (suffix, Review) | Review category detection |
| 10 | `do something with the config /boost` | TRIGGER (suffix, General) | General fallback category |

## SHOULD NOT Trigger (10 scenarios)

| # | Input | Expected | Reason |
|---|-------|----------|--------|
| 1 | `fix the login bug` | NO TRIGGER | No /boost keyword |
| 2 | `boost performance of the API` | NO TRIGGER | "boost" as regular word, no slash |
| 3 | `add a /boost button to the UI` | NO TRIGGER | Describing a UI element |
| 4 | `the boost library needs updating` | NO TRIGGER | Talking about a library |
| 5 | `refactor the auth module` | NO TRIGGER | No /boost keyword |
| 6 | `install boost for C++` | NO TRIGGER | C++ Boost library reference |
| 7 | `can you boost the test coverage?` | NO TRIGGER | Verb usage without slash |
| 8 | `/booster add feature` | NO TRIGGER | Different command name |
| 9 | `document the /boost endpoint` | NO TRIGGER | Describing an API endpoint |
| 10 | `what does /boost do?` | NO TRIGGER | Asking about the skill, not invoking |

## Non-code triggers (added 2026-07-06 — boost generalization)

Should fire and route to GENERAL templates (workspace has no code manifests):
1. "write a blog post about our July launch /boost" → Create
2. "/boost research the best print-on-demand partner for us" → Research
3. "plan next month's content calendar /boost" → Plan
4. "fix this paragraph, it reads clunky /boost" → content workspace + prose target routes to Revise (general) — prose fixing is revision, not Debug/Diagnose (flow.md Step 3 detection rules)

Should still route to DEV templates (workspace has package.json):
5. "fix the login crash /boost" → Debug, task-templates.md — unchanged behavior
