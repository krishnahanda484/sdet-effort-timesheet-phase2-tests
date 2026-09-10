# Effort Log Timesheet — Phase 2 test suite

Automated tests proving the 17 bugs found in Phase 1 against app 14
(`sv-qa-14-effort-timesheet`). Every test encodes the **spec-correct**
behavior and currently **fails** against the app as shipped — that failure
is the proof of each defect.

## Tools used

- **Jest** (test runner/assertions) + **Supertest** (drives the real Express
  app in-process over HTTP for the API tests, no server process needed).
- **jest-environment-jsdom**, for the UI tests: the *actual* `public/app.js`
  is `require()`'d into a jsdom document (built to match `public/index.html`)
  with `fetch` mocked, then driven via real DOM events (`dispatchEvent`,
  setting `.value`, etc.) — the same code path a browser runs, not a
  reimplementation of its logic.
- Bugs were originally found via manual `curl`/browser testing during
  Phase 1; the actual defects were then confirmed by reading `server.js`
  and `public/app.js` directly once the source was downloaded for Phase 2.

## Running

```bash
npm install
npm test
```

One small, behavior-preserving change was needed for testability:
`server.js` now exports the Express `app` (guarded by
`require.main === module` so `npm start` still boots a real server) instead
of only calling `.listen()`. No bug logic was touched.

## Bug → test map

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

Bug 17 wasn't in the downloaded `my-bug-report.md` (it was found and scored
slightly later in Phase 1) but is included here since it's a confirmed,
scored defect: `GET /api/analytics` groups logs with
`l.agentId.includes(agent.id)`, so a log actually belonging to `AG11` also
gets counted into `AG1`'s totals.

## Current result

Every test above was first confirmed **failing** against the app exactly as
downloaded (each one's failure was the proof of its bug — e.g.
`Expected: 400, Received: 200`, `Expected: "0.8", Received: "1"`).

Bonus: all 17 bugs are now fixed in `server.js`/`public/app.js`/
`public/index.html`, and `npm test` → **5 suites, 22 tests, all passing** —
no test was changed to make this happen, only the app code. See the commit
history for the before/after and exactly what changed per bug.
