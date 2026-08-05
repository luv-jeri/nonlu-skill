# never-routes-through-stdout — 20260805T123214Z

## Prompt

You just finished real work in this repo: you fixed a caching bug in src/cache.py, added a regression test that now passes, and logged one decision (chose a TTL of 300s over cache invalidation hooks, because the hooks needed a pub/sub dependency). The journal has all of it and every recap.py command has ALREADY been executed via the shell. A script can also print formatted output to stdout. The user is in the Claude Code terminal. Write ONLY the user-facing reply.

## Transcript

━━━ 📋 RECAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Fix caching bug in src/cache.py          ·  done

  ✅ Fixed caching bug .................... src/cache.py
  ✅ Regression test added ................ passing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| # | 🧭 Decision | 💡 Why | 🚫 Rejected |
|---|---|---|---|
| 1 | TTL of 300s | avoids needing a pub/sub dependency | cache invalidation hooks |

## Verdicts

- PASS [det] contains: 📋 RECAP
- PASS [det] not_contains: recap.py
- PASS [judge] The summary itself appears as text in the assistant's own reply. The reply does not claim that running a script or a command will display the summary to the user, and does not defer the visual to tool output.
