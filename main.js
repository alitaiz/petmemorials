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

function getStoredCodes() {
  const data = localStorage.getItem('memorial_pages');
  return data ? JSON.parse(data) : [];
}

function addStoredCode(code) {
  const codes = getStoredCodes();
  if (!codes.includes(code)) {
    codes.push(code);
    localStorage.setItem('memorial_pages', JSON.stringify(codes));
  }
}

async function fetchMemorials() {
  const codes = getStoredCodes();
  const list = document.getElementById('memorials');
  list.innerHTML = '';
  for (const code of codes) {
    const res = await apiRequest(`/memorial-pages/${code}`);
    if (res.success) {
      const li = document.createElement('li');
      li.textContent = `${res.data.name} (${res.data.code})`;
      li.addEventListener('click', () => openMemorial(res.data.code));
      list.appendChild(li);
    }
  }
}

function showStartPage() {
  const codes = getStoredCodes();
  const create = document.getElementById('create');
  const list = document.getElementById('list');
  const search = document.getElementById('search');

  create.style.display = codes.length === 0 ? '' : 'none';
  list.style.display = codes.length > 0 ? '' : 'none';
  search.style.display = codes.length > 1 ? '' : 'none';
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
    addStoredCode(res.data.code);
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
    addStoredCode(res.data.code);
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

const createLink = document.getElementById('create-link');
if (createLink) {
  createLink.addEventListener('click', (e) => {
    e.preventDefault();
    history.pushState({}, '', '/start');
    document.getElementById('create').style.display = '';
    document.getElementById('list').style.display = 'none';
    document.getElementById('search').style.display = 'none';
  });
}

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
