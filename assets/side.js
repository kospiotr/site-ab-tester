function getSide() {
  const params = new URLSearchParams(window.location.search);
  return params.get('side');
}
let entries = [];
let currentIndex = 0;
let ws;
async function loadEntries() {
  const res = await fetch('/api/entries');
  const data = await res.json();
  entries = data.entries;
  loadIframe();
}
function loadIframe() {
  if (entries.length > 0) {
    const url = entries[currentIndex][getSide()];
    document.getElementById('current-url').textContent = url;
    const iframe = document.getElementById('site-iframe');
    iframe.src = '';
    setTimeout(() => {
      iframe.src = url;
    }, 50);
  }
}
window.onload = () => {
  loadEntries();
  ws = new WebSocket(`ws://${location.host}/ws`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'navigate') {
      currentIndex = data.index;
      loadIframe();
    }
  };
};

