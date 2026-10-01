# Checks

Plain Node scripts, no test framework and no dependencies. Each one prints a
line per check and exits non-zero if any fail.

```bash
node checks/calendar.mjs
```

They live here rather than in a temporary folder because a check that
disappears between sessions is a check that stops being run.
