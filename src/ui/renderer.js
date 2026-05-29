const API = 'http://localhost:3000';

// ── State ────────────────────────────────────────────────
let selectedFormat = 'mp3';
let outputFolder   = '';
let isConverting   = false;
let pollInterval   = null;

// ── DOM refs ─────────────────────────────────────────────
const urlInput       = document.getElementById('url-input');
const urlError       = document.getElementById('url-error');
const btnClear       = document.getElementById('btn-clear');
const nameInput      = document.getElementById('name-input');
const nameExt        = document.getElementById('name-ext');
const folderDisplay  = document.getElementById('folder-display');
const progressSec    = document.getElementById('progress-section');
const progressFill   = document.getElementById('progress-fill');
const progressStatus = document.getElementById('progress-status');
const progressPct    = document.getElementById('progress-pct');
const btnConvert     = document.getElementById('btn-convert');
const historyList    = document.getElementById('history-list');
const historyCount   = document.getElementById('history-count');

// ── Window controls ──────────────────────────────────────
document.getElementById('btn-minimize').addEventListener('click', () => window.electronAPI.minimize());
document.getElementById('btn-maximize').addEventListener('click', () => window.electronAPI.maximize());
document.getElementById('btn-close').addEventListener('click',    () => window.electronAPI.close());

// ── Startup ──────────────────────────────────────────────
async function init() {
  const defaultPath = await window.electronAPI.getDownloadsPath();
  // Only use localStorage if the user explicitly picked a folder via Browse
  const userPicked = localStorage.getItem('outputFolderUserSet') === '1';
  // Kill stale values from older sessions if the user never explicitly picked
  if (!userPicked) localStorage.removeItem('outputFolder');
  outputFolder = (userPicked && localStorage.getItem('outputFolder')) || defaultPath;
  folderDisplay.textContent = outputFolder;
  updateNameExt();
  loadHistory();
}

// ── URL input ────────────────────────────────────────────
urlInput.addEventListener('input', () => {
  const val = urlInput.value.trim();
  btnClear.style.display = val ? '' : 'none';

  if (val && !isYouTubeUrl(val)) {
    urlInput.classList.add('invalid');
    urlError.textContent = 'Enter a valid YouTube URL';
  } else {
    urlInput.classList.remove('invalid');
    urlError.textContent = '';
  }
  syncBtn();
});

btnClear.addEventListener('click', () => {
  urlInput.value = '';
  btnClear.style.display = 'none';
  urlInput.classList.remove('invalid');
  urlError.textContent = '';
  syncBtn();
  urlInput.focus();
});

function isYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|playlist\?list=)|youtu\.be\/)/.test(url);
}

// ── Format cards ─────────────────────────────────────────
document.querySelectorAll('.format-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.format-card').forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    selectedFormat = card.dataset.format;
    updateQualityHints();
    updateNameExt();
    syncBtn();
  });
});

function updateNameExt() {
  nameExt.textContent = `.${selectedFormat}`;
}

function updateQualityHints() {
  const isMP3 = selectedFormat === 'mp3';
  document.querySelectorAll('.mp3-hint').forEach((el) => { el.hidden = !isMP3; });
  document.querySelectorAll('.mp4-hint').forEach((el) => { el.hidden = isMP3;  });
}

// ── Folder picker ─────────────────────────────────────────
document.getElementById('btn-browse').addEventListener('click', async () => {
  const folder = await window.electronAPI.selectFolder();
  if (folder) {
    outputFolder = folder;
    folderDisplay.textContent = folder;
    localStorage.setItem('outputFolder', folder);
    localStorage.setItem('outputFolderUserSet', '1');
  }
});

// ── Convert button sync ───────────────────────────────────
function syncBtn() {
  const url   = urlInput.value.trim();
  const valid = url && isYouTubeUrl(url) && !isConverting;
  btnConvert.disabled = !valid;
  btnConvert.textContent = isConverting
    ? 'Converting…'
    : `Convert to ${selectedFormat.toUpperCase()}`;
}

// ── Conversion flow ──────────────────────────────────────
btnConvert.addEventListener('click', startConversion);

async function startConversion() {
  const url = urlInput.value.trim();
  if (!url || isConverting) return;

  setConverting(true);
  setProgress(5, 'Starting…');

  try {
    const res = await fetch(`${API}/api/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamUrl:  url,
        format:     selectedFormat,
        quality:    document.querySelector('input[name="quality"]:checked')?.value || 'medium',
        outputPath: outputFolder,
        filename:   nameInput.value.trim(),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error');
    }

    const { jobId } = await res.json();
    pollJob(jobId);
  } catch (err) {
    toast(err.message, 'error');
    setConverting(false);
    hideProgress();
  }
}

function pollJob(jobId) {
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/api/status/${jobId}`);
      const job = await res.json();

      const label = {
        pending:    'Preparing…',
        processing: job.progress < 50 ? 'Downloading…' : 'Converting…',
        completed:  'Done!',
        failed:     'Failed',
      }[job.status] || 'Processing…';

      setProgress(job.progress, label);

      if (job.status === 'completed') {
        clearInterval(pollInterval);
        onDone(job);
      } else if (job.status === 'failed') {
        clearInterval(pollInterval);
        toast(job.error || 'Conversion failed', 'error');
        setConverting(false);
        hideProgress();
      }
    } catch (_) { /* retry next tick */ }
  }, 600);
}

function onDone(job) {
  setProgress(100, 'Complete!');
  toast('Converted successfully!', 'success');
  // Small delay so the file is fully flushed before we read the directory
  setTimeout(loadHistory, 800);

  setTimeout(() => {
    setConverting(false);
    hideProgress();
    urlInput.value = '';
    nameInput.value = '';
    btnClear.style.display = 'none';
    urlInput.classList.remove('invalid');
    syncBtn();
  }, 1800);
}

// ── Helpers ──────────────────────────────────────────────
function setConverting(val) {
  isConverting = val;
  btnConvert.classList.toggle('loading', val);
  if (!val && pollInterval) clearInterval(pollInterval);
  syncBtn();
}

function setProgress(pct, status) {
  progressSec.hidden = false;
  progressFill.style.width = `${pct}%`;
  progressStatus.textContent = status;
  progressPct.textContent = `${pct}%`;
}

function hideProgress() {
  setTimeout(() => {
    progressSec.hidden = true;
    progressFill.style.width = '0%';
  }, 800);
}

// ── History ───────────────────────────────────────────────
async function loadHistory() {
  try {
    const url = new URL(`${API}/api/files`);
    if (outputFolder) url.searchParams.set('dir', outputFolder);
    const res = await fetch(url.toString());
    if (!res.ok) return;
    const { files } = await res.json();

    historyCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;

    if (!files.length) {
      historyList.innerHTML = '<div class="history-empty">No downloads yet — convert something above.</div>';
      return;
    }

    historyList.innerHTML = files
      .map(
        (f) => `
        <div class="history-item">
          <div class="history-info">
            <div class="history-name" title="${f.name}">${f.name}</div>
            <div class="history-meta">${fmtSize(f.size)} &middot; ${fmtDate(f.createdAt)}</div>
          </div>
          <button class="history-show" data-path="${f.path}">Show in folder</button>
        </div>`
      )
      .join('');

    historyList.querySelectorAll('.history-show').forEach((btn) => {
      btn.addEventListener('click', () => window.electronAPI.showInFolder(btn.dataset.path));
    });
  } catch (_) { /* server may not be ready yet */ }
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Toast ─────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'i' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'i'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, 4000);
}

// ── Boot ──────────────────────────────────────────────────
init();
setInterval(loadHistory, 6000);
