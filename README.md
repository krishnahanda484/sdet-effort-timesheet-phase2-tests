# Effort Log Timesheet — Phase 2

This is my test suite for the bugs I found in Phase 1 on app 14 (`sv-qa-14-effort-timesheet`). Each test locks in what the spec actually says should happen, and every one of them fails against the app exactly as it was downloaded — that failure is the proof for each bug.

## Tools I used

- Jest for running the tests and assertions.
- Supertest for the API tests — it runs the real Express app in memory and sends actual HTTP requests at it, so I'm not calling functions directly or faking anything.
- jest-environment-jsdom for the UI tests. I load the real `public/app.js` into a fake DOM built from `public/index.html`, mock `fetch`, and then fire real events at it (`dispatchEvent`, setting `.value`, etc). It's the same code the browser runs, I'm not rewriting the logic in the test.
- I found the bugs themselves by poking at the app with curl and the browser during Phase 1. Once I had the actual source for Phase 2 I went through `server.js` and `public/app.js` to confirm exactly why each one happens before writing the test.
- I also used Claude (Anthropic) quite a bit through both phases — for testing the API/UI systematically, narrowing down defect categories against the scoring taxonomy, writing the Jest/Supertest/jsdom setup, and for the bonus fix.

## How to run it

```bash
npm install
npm test
```

I had to make one small change to `server.js` for this to work — it now exports the Express `app` object instead of only calling `.listen()` on it (guarded so `npm start` still runs a normal server). That's just so Supertest can drive it in-process. None of the actual bug logic was touched for this.

## Which test covers which bug

| # | Endpoint | Defect type | Test file |
|---|---|---|---|
| 1 | `POST /api/logs` | missing-required-field | `tests/api/post-logs.test.js` |
| 2 | `POST /api/logs` | missing-reference-or-state-check | `tests/api/post-logs.test.js` |
| 3 | `POST /api/logs` | missing-boundary-check | `tests/api/post-logs.test.js` |
| 4 | `POST /api/logs` | wrong-status-code | `tests/api/post-logs.test.js` |
| 5 | `GET /api/logs` | wrong-date-time-handling | `tests/api/get-logs.test.js` |
| 6 | `GET /api/logs` | substring-vs-exact-match | `tests/api/get-logs.test.js` |
| 7 | `GET /api/logs` | stale-or-mismatched-aggregate | `tests/api/get-logs.test.js` |
| 8 | `GET /api/analytics` | wrong-arithmetic | `tests/api/analytics.test.js` |
| 9 | `GET /api/analytics` | stale-or-mismatched-aggregate | `tests/api/analytics.test.js` |
| 10 | `UI` | missing-ui-feedback-guard | `tests/ui/app-behavior.test.js` |
| 11 | `UI` | wrong-format-display | `tests/ui/app-behavior.test.js` |
| 12 | `UI` | wrong-arithmetic | `tests/ui/app-behavior.test.js` |
| 13 | `UI` | missing-required-field | `tests/ui/app-behavior.test.js` |
| 14 | `UI` | wrong-ui-copy-or-label | `tests/ui/labels.test.js` |
| 15 | `UI` | state-not-persisted | `tests/ui/app-behavior.test.js` |
| 16 | `POST /api/logs` | missing-sanitization | `tests/api/post-logs.test.js` |
| 17 | `GET /api/analytics` | substring-vs-exact-match | `tests/api/analytics.test.js` |

Bug 17 isn't in the `my-bug-report.md` I downloaded — I actually found and got it scored a bit later in Phase 1, after I'd already grabbed the report. It's a real one though, so I kept it in: `GET /api/analytics` matches agents with `l.agentId.includes(agent.id)`, and since `"AG11".includes("AG1")` is true, any log for agent AG11 was getting counted into AG1's totals too.

## Where things stand

I confirmed all 22 tests fail against the app as downloaded before changing anything — that was the whole point, each failure is what proves the bug is real (things like `Expected: 400, Received: 200` or `Expected: "0.8", Received: "1"`).

I also went ahead and did the bonus: fixed all 17 bugs in `server.js`, `public/app.js` and `public/index.html`. `npm test` now gives 5 suites / 22 tests, all passing, and I didn't touch a single test to get there — only the app code changed. The commit history shows the failing-tests commit and the fix commit separately if you want to see the before/after.
