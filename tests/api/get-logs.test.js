const request = require('supertest');
const app = require('../../server');

// Seed data (data.js) always has, before any test mutates it:
//   id1 AG1/C1 2026-07-20 45min   id2 AG1/C2 2026-07-21 90min
//   id3 AG2/C1 2026-07-20 30min   id4 AG2/C3 2026-07-22 120min
//   id5 AG3/C4 2026-07-21 60min

describe('GET /api/logs — Bug 5: wrong-date-time-handling (date filter off by one day)', () => {
  it('returns the two entries actually dated 2026-07-20 when filtering by that exact date', async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/logs').query({ date: '2026-07-20' });

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((l) => l.date === '2026-07-20')).toBe(true);
  });

  it('does NOT return 2026-07-20 entries when filtering by 2026-07-21', async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/logs').query({ date: '2026-07-21' });

    expect(res.body.data.every((l) => l.date === '2026-07-21')).toBe(true);
  });
});

describe('GET /api/logs — Bug 6: substring-vs-exact-match (agentId filter)', () => {
  it('does not match every agent when filtering by a partial id like "AG"', async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/logs').query({ agentId: 'AG' });

    expect(res.body.data).toHaveLength(0);
  });

  it('filtering by AG1 does not also return AG11 entries', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/logs')
      .send({ agentId: 'AG11', candidateId: 'C1', date: '2026-07-20', minutes: 99 });

    const res = await agent.get('/api/logs').query({ agentId: 'AG1' });

    expect(res.body.data.every((l) => l.agentId === 'AG1')).toBe(true);
  });
});

describe('GET /api/logs — Bug 7: stale-or-mismatched-aggregate (totalMinutes ignores filter)', () => {
  it('totalMinutes reflects only the filtered data set, not the whole table', async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/logs').query({ agentId: 'AG1' });

    const sumOfReturned = res.body.data.reduce((s, l) => s + l.minutes, 0);
    expect(res.body.totalMinutes).toBe(sumOfReturned);
    expect(res.body.totalMinutes).toBe(135); // AG1's own 45 + 90
  });
});
