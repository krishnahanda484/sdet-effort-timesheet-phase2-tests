/**
 * @jest-environment jsdom
 *
 * These tests load the real public/app.js into a jsdom document (with fetch
 * mocked) and drive it the same way a browser would: filling fields and
 * dispatching real DOM events. Nothing here reimplements app.js's logic —
 * it exercises the actual shipped client code.
 */

const AGENTS = [{ id: 'AG1', name: 'Priya Sharma' }];
const CANDIDATES = [{ id: 'C1', name: 'Aarav Gupta' }];

function buildDom() {
  document.body.innerHTML = `
    <div id="toast" class="toast hidden"></div>
    <form id="logForm">
      <select id="agentId"></select>
      <select id="candidateId"></select>
      <input type="date" id="date" value="2026-07-24">
      <input type="number" id="minutes" placeholder="1-480">
      <button type="submit">Add Log</button>
    </form>
    <select id="filterAgentId"><option value="">All</option></select>
    <input type="date" id="filterDate">
    <button id="clearFilter">Clear</button>
    <table>
      <thead><tr><th>Agent</th><th>Candidate</th><th>Date</th><th>Minutes</th><th>Hours</th></tr></thead>
      <tbody id="logRows"></tbody>
    </table>
    <table>
      <thead><tr><th>Agent</th><th>Entries</th><th>Total Minutes</th><th>Total Hours</th><th>Avg Minutes/Entry</th></tr></thead>
      <tbody id="analyticsRows"></tbody>
    </table>
    <button id="resetBtn">Reset</button>
  `;
}

function mockFetch({ logs = { data: [], totalMinutes: 0 }, analytics = [], post } = {}) {
  global.fetch = jest.fn((url, opts) => {
    if (opts && opts.method === 'POST' && url === '/api/logs') {
      const response = post || { ok: true, status: 200, body: {} };
      return Promise.resolve({
        ok: response.ok,
        status: response.status,
        json: () => Promise.resolve(response.body),
      });
    }
    if (url.startsWith('/api/agents')) return Promise.resolve({ ok: true, json: () => Promise.resolve(AGENTS) });
    if (url.startsWith('/api/candidates')) return Promise.resolve({ ok: true, json: () => Promise.resolve(CANDIDATES) });
    if (url.startsWith('/api/logs')) return Promise.resolve({ ok: true, json: () => Promise.resolve(logs) });
    if (url.startsWith('/api/analytics')) return Promise.resolve({ ok: true, json: () => Promise.resolve(analytics) });
    return Promise.reject(new Error('unexpected fetch url: ' + url));
  });
}

async function flush() {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

function loadApp() {
  jest.resetModules();
  require('../../public/app.js');
}

beforeEach(() => {
  buildDom();
});

describe('UI — Bug 10: missing-ui-feedback-guard', () => {
  it('does not show a success toast when the server rejects the request', async () => {
    mockFetch({ post: { ok: false, status: 400, body: { error: 'minutes must be between 1 and 480' } } });
    loadApp();
    await flush();

    document.getElementById('minutes').value = '481';
    document.getElementById('logForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flush();

    expect(document.getElementById('toast').textContent).not.toBe('Log added!');
  });
});

describe('UI — Bug 11: wrong-format-display (date shown as DD-MM-YYYY)', () => {
  it('renders the log date as DD-MM-YYYY, not raw ISO', async () => {
    mockFetch({
      logs: { data: [{ id: 1, agentId: 'AG1', candidateId: 'C1', date: '2026-07-20', minutes: 45 }], totalMinutes: 45 },
    });
    loadApp();
    await flush();

    const dateCell = document.querySelectorAll('#logRows tr')[0].children[2];
    expect(dateCell.textContent).toBe('20-07-2026');
  });
});

describe('UI — Bug 12: wrong-arithmetic (Hours shown to one decimal place)', () => {
  it('shows Hours as minutes/60 to one decimal, not rounded to a whole number', async () => {
    mockFetch({
      logs: { data: [{ id: 1, agentId: 'AG1', candidateId: 'C1', date: '2026-07-20', minutes: 45 }], totalMinutes: 45 },
    });
    loadApp();
    await flush();

    const hoursCell = document.querySelectorAll('#logRows tr')[0].children[4];
    expect(hoursCell.textContent).toBe('0.8');
  });
});

describe('UI — Bug 13: missing-required-field (Minutes not enforced client-side)', () => {
  it('does not submit a log when Minutes is left blank', async () => {
    mockFetch();
    loadApp();
    await flush();

    document.getElementById('minutes').value = '';
    document.getElementById('logForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flush();

    const postedToLogs = global.fetch.mock.calls.some(
      ([url, opts]) => url === '/api/logs' && opts && opts.method === 'POST'
    );
    expect(postedToLogs).toBe(false);
  });
});

describe('UI — Bug 15: state-not-persisted (form not reset after add)', () => {
  it('clears the Minutes field after a successful submission', async () => {
    mockFetch({ post: { ok: true, status: 201, body: { id: 6, agentId: 'AG1', candidateId: 'C1', date: '2026-07-24', minutes: 55 } } });
    loadApp();
    await flush();

    document.getElementById('minutes').value = '55';
    document.getElementById('logForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flush();

    expect(document.getElementById('minutes').value).toBe('');
  });
});
