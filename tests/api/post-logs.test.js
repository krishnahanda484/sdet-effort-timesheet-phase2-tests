const request = require('supertest');
const app = require('../../server');

// Each test uses its own supertest agent: isolation.js hands out a fresh seeded
// in-memory store per session cookie, and request.agent() keeps that cookie
// across calls within a single test — the same pattern used against the live
// app throughout Phase 1.

describe('POST /api/logs — Bug 1: missing-required-field (candidateId)', () => {
  it('rejects a log with no candidateId, same as it rejects missing agentId/date/minutes', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/api/logs')
      .send({ agentId: 'AG1', date: '2026-07-20', minutes: 30 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/logs — Bug 2: missing-reference-or-state-check', () => {
  it('rejects an agentId that does not belong to any seeded agent', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/api/logs')
      .send({ agentId: 'AG999', candidateId: 'C1', date: '2026-07-20', minutes: 30 });

    expect(res.status).toBe(400);
  });

  it('rejects a candidateId that does not belong to any seeded candidate', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/api/logs')
      .send({ agentId: 'AG1', candidateId: 'C999', date: '2026-07-20', minutes: 30 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/logs — Bug 3: missing-boundary-check (minutes lower bound)', () => {
  it('rejects minutes: 0', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/api/logs')
      .send({ agentId: 'AG1', candidateId: 'C1', date: '2026-07-20', minutes: 0 });

    expect(res.status).toBe(400);
  });

  it('rejects a negative minutes value', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/api/logs')
      .send({ agentId: 'AG1', candidateId: 'C1', date: '2026-07-20', minutes: -10 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/logs — Bug 4: wrong-status-code', () => {
  it('returns 201 Created on a successful create, per the documented spec', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/api/logs')
      .send({ agentId: 'AG1', candidateId: 'C1', date: '2026-07-20', minutes: 30 });

    expect(res.status).toBe(201);
  });
});

describe('POST /api/logs — Bug 16: missing-sanitization (date format)', () => {
  it('rejects a date string that is not YYYY-MM-DD', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/api/logs')
      .send({ agentId: 'AG1', candidateId: 'C1', date: '20-07-2026', minutes: 30 });

    expect(res.status).toBe(400);
  });
});
