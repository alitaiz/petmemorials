// Basic frontend without React
const API_BASE = '/api';

function generateDeviceId() {
  let deviceId = localStorage.getItem('memorial_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('memorial_device_id', deviceId);
  }
  return deviceId;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(API_BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return response.json();
}

async function fetchMemorials() {
  const deviceId = generateDeviceId();
  const res = await apiRequest(`/memorial-pages/by-device/${deviceId}`);
  if (res.success) {
    const list = document.getElementById('memorials');
    list.innerHTML = '';
    res.data.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.name} (${p.code})`;
      li.addEventListener('click', () => openMemorial(p.code));
      list.appendChild(li);
    });
  }
}

function showStartPage() {
  document.getElementById('create').style.display = '';
  document.getElementById('list').style.display = '';
  document.getElementById('search').style.display = '';
  document.getElementById('memorial-page').style.display = 'none';
}

function showMemorialPage() {
  document.getElementById('create').style.display = 'none';
  document.getElementById('list').style.display = 'none';
  document.getElementById('search').style.display = 'none';
  document.getElementById('memorial-page').style.display = '';
}

async function createMemorial() {
  const name = document.getElementById('name').value;
  const code = document.getElementById('code').value;
  const content = document.getElementById('content').value;
  const status = document.getElementById('create-status');
  status.textContent = 'Creating...';
  const deviceId = generateDeviceId();
  const res = await apiRequest('/memorial-pages', {
    method: 'POST',
    body: JSON.stringify({ name, code, content, device_id: deviceId })
  });
  if (res.success) {
    status.textContent = 'Created!';
    fetchMemorials();
    openMemorial(res.data.code);
  } else {
    status.textContent = res.error || 'Error creating memorial';
  }
}

async function openMemorial(code, push = true) {
  const status = document.getElementById('search-status');
  status.textContent = 'Loading...';
  const res = await apiRequest(`/memorial-pages/${code}`);
  if (res.success) {
    status.textContent = '';
    const div = document.getElementById('memorial-view');
    div.innerHTML = `<h3>${res.data.name}</h3><pre>${res.data.content || ''}</pre>`;
    showMemorialPage();
    if (push) {
      history.pushState({ code }, '', `/memory/${code}`);
    }
  } else {
    status.textContent = 'Memorial not found';
  }
}

document.getElementById('create-btn').addEventListener('click', createMemorial);
document.getElementById('search-btn').addEventListener('click', () => {
  const code = document.getElementById('search-code').value.trim();
  if (code) openMemorial(code);
});

document.getElementById('back-btn').addEventListener('click', () => {
  history.pushState({}, '', '/start');
  showStartPage();
  fetchMemorials();
});

function init() {
  if (location.pathname.startsWith('/memory/')) {
    const code = location.pathname.split('/').pop();
    openMemorial(code, false);
  } else {
    showStartPage();
    fetchMemorials();
  }
}

window.addEventListener('popstate', () => {
  const match = location.pathname.match(/^\/memory\/(.+)$/);
  if (match) {
    openMemorial(match[1], false);
  } else {
    showStartPage();
    fetchMemorials();
  }
});

init();
