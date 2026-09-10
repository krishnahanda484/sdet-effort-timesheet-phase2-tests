let agentsCache = [];
let candidatesCache = [];

function showToast(msg, isError) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' error' : '');
  setTimeout(() => { el.className = 'toast hidden'; }, 2500);
}

async function init() {
  const [agentsRes, candidatesRes] = await Promise.all([
    fetch('/api/agents').then((r) => r.json()),
    fetch('/api/candidates').then((r) => r.json()),
  ]);
  agentsCache = agentsRes;
  candidatesCache = candidatesRes;

  const agentSel = document.getElementById('agentId');
  const filterAgentSel = document.getElementById('filterAgentId');
  agentsCache.forEach((a) => {
    agentSel.innerHTML += `<option value="${a.id}">${a.name}</option>`;
    filterAgentSel.innerHTML += `<option value="${a.id}">${a.name}</option>`;
  });
  const candSel = document.getElementById('candidateId');
  candidatesCache.forEach((c) => {
    candSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });

  loadLogs();
  loadAnalytics();
}

async function loadLogs() {
  const params = new URLSearchParams();
  const agentId = document.getElementById('filterAgentId').value;
  const date = document.getElementById('filterDate').value;
  if (agentId) params.set('agentId', agentId);
  if (date) params.set('date', date);
  const res = await fetch(`/api/logs?${params.toString()}`);
  const body = await res.json();
  const rows = document.getElementById('logRows');
  rows.innerHTML = '';
  for (const log of body.data) {
    const agent = agentsCache.find((a) => a.id === log.agentId);
    const candidate = candidatesCache.find((c) => c.id === log.candidateId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${agent ? agent.name : log.agentId}</td>
      <td>${candidate ? candidate.name : log.candidateId}</td>
      <td>${log.date}</td>
      <td>${log.minutes}</td>
      <td>${(log.minutes / 60).toFixed(0)}</td>
    `;
    rows.appendChild(tr);
  }
}

async function loadAnalytics() {
  const res = await fetch('/api/analytics');
  const rows = await res.json();
  const tbody = document.getElementById('analyticsRows');
  tbody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.entryCount}</td>
      <td>${r.avgMinutes}</td>
      <td>${r.totalHours.toFixed(1)}</td>
      <td>${r.totalMinutes.toFixed(1)}</td>
    `;
    tbody.appendChild(tr);
  }
}

document.getElementById('logForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    agentId: document.getElementById('agentId').value,
    candidateId: document.getElementById('candidateId').value,
    date: document.getElementById('date').value,
    minutes: Number(document.getElementById('minutes').value),
  };
  const res = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  showToast('Log added!');
  loadLogs();
});

document.getElementById('filterAgentId').addEventListener('change', loadLogs);
document.getElementById('filterDate').addEventListener('change', loadLogs);
document.getElementById('clearFilter').addEventListener('click', () => {
  document.getElementById('filterAgentId').value = '';
  document.getElementById('filterDate').value = '';
  loadLogs();
});

// --- Tooling: reset button (not part of the app under test) ---
document.getElementById('resetBtn').addEventListener('click', async () => {
  await fetch('/api/reset', { method: 'POST' });
  loadLogs();
  loadAnalytics();
  showToast('Data reset');
});

init();
