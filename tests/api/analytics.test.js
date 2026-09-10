const request = require('supertest');
const app = require('../../server');

describe('GET /api/analytics — Bug 8: wrong-arithmetic (totalHours)', () => {
  it('computes totalHours as totalMinutes / 60, not totalMinutes * 60', async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/analytics');
    const ag1 = res.body.find((a) => a.agentId === 'AG1');

    expect(ag1.totalMinutes).toBe(135);
    expect(ag1.totalHours).toBe(2.25);
  });
});

describe('GET /api/analytics — Bug 9: stale-or-mismatched-aggregate (totalMinutes leaks across agents)', () => {
  it("each agent's totalMinutes is that agent's own logs only, not a running total", async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/analytics');
    const ag1 = res.body.find((a) => a.agentId === 'AG1');
    const ag2 = res.body.find((a) => a.agentId === 'AG2');
    const ag3 = res.body.find((a) => a.agentId === 'AG3');

    expect(ag1.totalMinutes).toBe(135); // 45 + 90
    expect(ag2.totalMinutes).toBe(150); // 30 + 120 — currently 285 (135 + 150) because it leaks
    expect(ag3.totalMinutes).toBe(60); // currently 345 because it inherits AG1+AG2's running total
  });

  it("avgMinutes divides by the agent's own entryCount, not the total row count across all agents", async () => {
    const agent = request.agent(app);

    const res = await agent.get('/api/analytics');
    const ag1 = res.body.find((a) => a.agentId === 'AG1');

    expect(ag1.entryCount).toBe(2);
    expect(ag1.avgMinutes).toBe(67.5); // 135 / 2, not 135 / 5
  });
});

describe('GET /api/analytics — Bug 17: substring-vs-exact-match (AG11 leaks into AG1)', () => {
  it("a log belonging to agent AG11 is not also counted toward agent AG1's totals", async () => {
    const agent = request.agent(app);

    const before = await agent.get('/api/analytics');
    const ag1Before = before.body.find((a) => a.agentId === 'AG1');

    await agent
      .post('/api/logs')
      .send({ agentId: 'AG11', candidateId: 'C1', date: '2026-07-20', minutes: 99 });

    const after = await agent.get('/api/analytics');
    const ag1After = after.body.find((a) => a.agentId === 'AG1');
    const ag11After = after.body.find((a) => a.agentId === 'AG11');

    // AG1's own numbers must be unaffected by a log that actually belongs to AG11
    expect(ag1After.entryCount).toBe(ag1Before.entryCount);
    // AG11 (the real owner) must show the new entry
    expect(ag11After.entryCount).toBe(1);
  });
});
