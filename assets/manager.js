let entries = [];
let currentIndex = 0;
let ws;
let results = [];
let sortMode = 'testing'; // Default to 'testing' mode
let managerMode = 'iframe'; // Default to iframe mode

async function loadEntries() {
  const res = await fetch('/api/entries');
  const data = await res.json();
  entries = data.entries;
  renderEntries();
}
async function loadResults() {
  const res = await fetch('/api/results');
  const data = await res.json();
  results = data.results;
  renderEntries();
}
function getLastResultForEntry(idx) {
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].index === idx) {
      return results[i].result;
    }
  }
  return null;
}
function setSortMode(mode) {
  sortMode = mode;
  if (sortMode === 'testing') {
    // Select first untested entry
    const sorted = getSortedEntries();
    const firstUntestedIdx = sorted.find(e => !getLastResultForEntry(e.idx));
    if (firstUntestedIdx) {
      currentIndex = firstUntestedIdx.idx;
    }
  }
  updateSortButtons();
  renderEntries();
}
function updateSortButtons() {
  const btnNatural = document.getElementById('btn-natural');
  const btnTesting = document.getElementById('btn-testing');
  if (sortMode === 'natural') {
    btnNatural.style.background = '#333';
    btnNatural.style.color = '#fff';
    btnTesting.style.background = '#eee';
    btnTesting.style.color = '#333';
  } else {
    btnTesting.style.background = '#333';
    btnTesting.style.color = '#fff';
    btnNatural.style.background = '#eee';
    btnNatural.style.color = '#333';
  }
}
function getSortedEntries() {
  if (sortMode === 'natural') {
    return entries.map((entry, idx) => ({ entry, idx }));
  } else {
    // Testing mode: untested first
    const tested = [], untested = [];
    entries.forEach((entry, idx) => {
      if (getLastResultForEntry(idx)) {
        tested.push({ entry, idx });
      } else {
        untested.push({ entry, idx });
      }
    });
    return [...untested, ...tested];
  }
}
function renderEntries() {
  const list = document.getElementById('entry-list');
  list.innerHTML = '';
  const sortedEntries = getSortedEntries();
  sortedEntries.forEach(({ entry, idx }) => {
    const entryRow = document.createElement('div');
    entryRow.style.display = 'flex';
    entryRow.style.alignItems = 'center';
    entryRow.style.marginBottom = '12px';
    entryRow.style.padding = '8px';
    entryRow.style.borderRadius = '6px';
    entryRow.style.border = idx === currentIndex ? '2px solid #333' : '1px solid #ccc';
    entryRow.style.background = idx === currentIndex ? '#f5f5f5' : '#fff';
    entryRow.style.cursor = 'pointer';
    if (idx === currentIndex) entryRow.style.fontWeight = 'bold';
    entryRow.onclick = () => navigate(idx);

    // Color coding based on last result
    const lastResult = getLastResultForEntry(idx);
    if (lastResult === 'OK') {
      entryRow.style.color = 'green';
    } else if (lastResult === 'Fail') {
      entryRow.style.color = 'red';
    } else {
      entryRow.style.color = 'black';
    }

    const entryUl = document.createElement('div');
    entryUl.style.flex = '1';
    for(e of entry){
        const liA = document.createElement('div');
        liA.textContent = `- ${e}`;
        entryUl.appendChild(liA);
    }
    entryRow.appendChild(entryUl);

    if (idx === currentIndex) {
      const div = document.createElement('div');

      const btnOk = document.createElement('button');
      btnOk.textContent = 'OK';
      btnOk.style.marginRight = '8px';
      btnOk.onclick = (e) => { e.stopPropagation(); sendResult('OK'); };
      const btnFail = document.createElement('button');
      btnFail.textContent = 'Fail';
      btnFail.onclick = (e) => { e.stopPropagation(); sendResult('Fail'); };
      div.appendChild(btnOk);
      div.appendChild(btnFail);
      entryRow.appendChild(div);
    }
    list.appendChild(entryRow);
  });
}
function setManagerMode(mode) {
  managerMode = mode;
  updateManagerModeButtons();
}
function updateManagerModeButtons() {
  const btnIframe = document.getElementById('btn-iframe');
  const btnTab = document.getElementById('btn-tab');
  if (managerMode === 'iframe') {
    btnIframe.style.background = '#333';
    btnIframe.style.color = '#fff';
    btnTab.style.background = '#eee';
    btnTab.style.color = '#333';
  } else {
    btnTab.style.background = '#333';
    btnTab.style.color = '#fff';
    btnIframe.style.background = '#eee';
    btnIframe.style.color = '#333';
  }
}
function openTabsForEntry(entry) {
  entry.forEach((url, idx) => {
    window.open(url, 'tab_' + idx);
  });
}
function navigate(idx) {
  currentIndex = idx;
  ws.send(JSON.stringify({type: 'navigate', index: idx}));
  renderEntries();
  if (managerMode === 'tab') {
    const entry = entries[idx];
    openTabsForEntry(entry);
  }
}
function sendResult(result) {
  ws.send(JSON.stringify({type: 'result', index: currentIndex, result}));
}
function nextEntry() {
  // Find the first not tested entry from the top
  const sortedEntries = getSortedEntries();
  const firstUntested = sortedEntries.find(e => !getLastResultForEntry(e.idx));
  if (firstUntested) {
    navigate(firstUntested.idx);
  } // else do nothing (stop navigation)
}
async function clearResults() {
  await fetch('/api/clear_results', { method: 'POST' });
  await loadResults();
}
window.onload = () => {
  loadEntries();
  loadResults();
  updateSortButtons();
  updateManagerModeButtons();
  ws = new WebSocket(`ws://${location.host}/ws`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'navigate') {
      currentIndex = data.index;
      renderEntries();
    } else if (data.type === 'result') {
      loadResults().then(() => {
        nextEntry();
      });
    }
  };
};

window.setManagerMode = setManagerMode;
