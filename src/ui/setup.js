'use strict';
/* global setupAPI */

const LABELS = {
  pending:     'Waiting…',
  resolving:   'Resolving…',
  downloading: (pct) => `Downloading… ${pct}%`,
  extracting:  'Extracting…',
  done:        '✓ Ready',
};

function setDep(id, phase, pct) {
  const fill   = document.getElementById(`fill-${id}`);
  const status = document.getElementById(`status-${id}`);

  if (phase === 'error') {
    fill.classList.add('error');
    fill.style.width = '100%';
    status.textContent = '✗ Failed';
    status.className = 'dep-status error';
    return;
  }

  fill.classList.remove('error');
  status.className = 'dep-status' + (phase === 'done' ? ' done' : '');

  const label = typeof LABELS[phase] === 'function'
    ? LABELS[phase](pct ?? 0)
    : (LABELS[phase] ?? phase);
  status.textContent = label;

  const width = phase === 'done'     ? 100
              : phase === 'extracting' ? 98
              : phase === 'resolving'  ? 4
              : (pct ?? 0);
  fill.style.width = `${width}%`;
}

// ── Listen for updates from main ──────────────────────────────────────────

setupAPI.onUpdate((data) => {
  const { dep, phase, pct } = data;
  // dep is 'ytdlp' or 'ffmpeg'
  setDep(dep, phase, pct);
  if (phase === 'downloading') {
    document.getElementById('size-note').textContent =
      dep === 'ytdlp'
        ? `Downloading yt-dlp…  ${pct}%`
        : `Downloading FFmpeg…  ${pct}%`;
  }
});

setupAPI.onError((data) => {
  // Mark whichever dep is currently in-flight as failed
  const ytStatus = document.getElementById('status-ytdlp').textContent;
  const ffStatus = document.getElementById('status-ffmpeg').textContent;

  if (!ytStatus.includes('✓')) setDep('ytdlp', 'error');
  if (!ffStatus.includes('✓')) setDep('ffmpeg', 'error');

  document.getElementById('size-note').textContent = data.message || 'An error occurred.';
  document.getElementById('actions-error').hidden = false;
});

setupAPI.onDone(() => {
  document.getElementById('size-note').textContent = 'All set! Starting Converto…';
});

// ── Button actions ────────────────────────────────────────────────────────

document.getElementById('btn-retry').addEventListener('click', () => {
  document.getElementById('actions-error').hidden = true;
  // Reset both rows to pending
  setDep('ytdlp',  'pending');
  setDep('ffmpeg', 'pending');
  document.getElementById('size-note').textContent = 'Requires an internet connection.';
  setupAPI.retry();
});

document.getElementById('btn-skip').addEventListener('click', () => {
  setupAPI.skip();
});
