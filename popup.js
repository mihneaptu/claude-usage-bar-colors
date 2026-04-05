const DEFAULTS = {
  yellowThreshold: 50,
  redThreshold: 80,
  greenColor: '#22c55e',
  yellowColor: '#eab308',
  redColor: '#ef4444',
  enabledBars: {}
};

const ids = ['yellowThreshold', 'redThreshold', 'greenColor', 'yellowColor', 'redColor'];
const els = {};
ids.forEach(id => { els[id] = document.getElementById(id); });

const liveUsage = document.getElementById('liveUsage');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');

let currentEnabledBars = {};

// Get color based on percentage and current form values
function getColor(percent) {
  const yellow = parseInt(els.yellowThreshold.value) || 50;
  const red = parseInt(els.redThreshold.value) || 80;
  if (percent >= red) return els.redColor.value;
  if (percent >= yellow) return els.yellowColor.value;
  return els.greenColor.value;
}

// Fetch real usage from the active tab
function fetchUsage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url || !tabs[0].url.includes('claude.ai')) {
      liveUsage.innerHTML = '<p class="loading">Open claude.ai to see usage</p>';
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { type: 'getUsage' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.bars || response.bars.length === 0) {
        liveUsage.innerHTML = '<p class="loading">Go to Settings \u2192 Usage to see live data</p>';
        return;
      }

      renderUsageBars(response.bars);
    });
  });
}

// Render real usage bars in popup with checkboxes
function renderUsageBars(bars) {
  liveUsage.innerHTML = '';
  let lastSection = null;
  bars.forEach((bar) => {
    // Add section title if it changed
    if (bar.section && bar.section !== lastSection) {
      lastSection = bar.section;
      const sectionEl = document.createElement('div');
      sectionEl.className = 'section-title';
      sectionEl.textContent = bar.section;
      liveUsage.appendChild(sectionEl);
    }
    const enabled = currentEnabledBars[bar.label] !== false;
    const color = enabled ? getColor(bar.percent) : '#5b9bf5';
    const opacity = enabled ? '1' : '0.4';

    // Build extra usage status badge
    let extraBadge = '';
    if (bar.isExtra) {
      if (!bar.extraOn) {
        extraBadge = '<span class="badge badge-off">OFF</span>';
      } else if (bar.extraLimit === 'Unlimited') {
        extraBadge = '<span class="badge badge-unlimited">Unlimited</span>';
      } else if (bar.extraLimit) {
        extraBadge = `<span class="badge badge-limit">${bar.extraLimit} limit</span>`;
      }
    }

    const percentText = bar.isExtra && !bar.extraOn
      ? 'Disabled'
      : `${bar.percent}% used`;

    const item = document.createElement('div');
    item.className = 'usage-item';
    item.innerHTML = `
      <div class="usage-header">
        <label class="toggle">
          <input type="checkbox" data-bar-label="${bar.label}" ${enabled ? 'checked' : ''}>
          <span class="usage-name">${bar.label}</span>
          ${extraBadge}
        </label>
        <span class="usage-percent">${percentText}</span>
      </div>
      <div class="bar-track" style="opacity: ${opacity}">
        <div class="bar-fill" style="width: ${Math.max(bar.percent, 1)}%; background-color: ${color}"></div>
      </div>
    `;

    // Toggle handler
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      currentEnabledBars[bar.label] = checkbox.checked;
      updateBarColors();
    });

    liveUsage.appendChild(item);
  });
}

// Re-render bar colors when settings change
function updateBarColors() {
  const items = liveUsage.querySelectorAll('.usage-item');
  items.forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const label = checkbox.dataset.barLabel;
    const enabled = checkbox.checked;
    const percentText = item.querySelector('.usage-percent').textContent;
    const match = percentText.match(/(\d+)%/);
    if (match) {
      const percent = parseInt(match[1]);
      const color = enabled ? getColor(percent) : '#5b9bf5';
      item.querySelector('.bar-fill').style.backgroundColor = color;
      item.querySelector('.bar-track').style.opacity = enabled ? '1' : '0.4';
    }
  });
}

// Smart update: refresh percentages/badges without losing checkbox states
function refreshUsage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url || !tabs[0].url.includes('claude.ai')) return;

    chrome.tabs.sendMessage(tabs[0].id, { type: 'getUsage' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.bars) return;

      const items = liveUsage.querySelectorAll('.usage-item');
      // If bar count changed, do a full re-render
      if (items.length !== response.bars.length) {
        renderUsageBars(response.bars);
        return;
      }

      // Otherwise just update values in place
      response.bars.forEach((bar, i) => {
        const item = items[i];
        if (!item) return;

        const enabled = item.querySelector('input[type="checkbox"]').checked;
        const color = enabled ? getColor(bar.percent) : '#5b9bf5';

        // Update percent text
        const percentEl = item.querySelector('.usage-percent');
        if (bar.isExtra && !bar.extraOn) {
          percentEl.textContent = 'Disabled';
        } else {
          percentEl.textContent = `${bar.percent}% used`;
        }

        // Update bar fill
        const fill = item.querySelector('.bar-fill');
        fill.style.width = `${Math.max(bar.percent, 1)}%`;
        fill.style.backgroundColor = color;

        // Update badge
        const oldBadge = item.querySelector('.badge');
        if (oldBadge) oldBadge.remove();
        if (bar.isExtra) {
          let badgeHtml = '';
          if (!bar.extraOn) badgeHtml = '<span class="badge badge-off">OFF</span>';
          else if (bar.extraLimit === 'Unlimited') badgeHtml = '<span class="badge badge-unlimited">Unlimited</span>';
          else if (bar.extraLimit) badgeHtml = `<span class="badge badge-limit">${bar.extraLimit} limit</span>`;
          if (badgeHtml) {
            item.querySelector('.usage-name').insertAdjacentHTML('afterend', badgeHtml);
          }
        }
      });
    });
  });
}

// Load saved settings into form
chrome.storage.sync.get(DEFAULTS, (settings) => {
  ids.forEach(id => { if (settings[id] !== undefined) els[id].value = settings[id]; });
  currentEnabledBars = settings.enabledBars || {};
  fetchUsage();
});

// Auto-refresh every 3 seconds
setInterval(refreshUsage, 3000);

// Live preview updates when changing settings
ids.forEach(id => {
  els[id].addEventListener('input', updateBarColors);
});

// Save settings
saveBtn.addEventListener('click', () => {
  const yellow = parseInt(els.yellowThreshold.value);
  const red = parseInt(els.redThreshold.value);

  if (yellow >= red) {
    status.textContent = 'Yellow threshold must be less than red!';
    status.style.color = '#ef4444';
    return;
  }

  const settings = {};
  ids.forEach(id => {
    settings[id] = els[id].type === 'number' ? parseInt(els[id].value) : els[id].value;
  });
  settings.enabledBars = currentEnabledBars;

  chrome.storage.sync.set(settings, () => {
    status.textContent = 'Saved!';
    status.style.color = '#22c55e';
    setTimeout(() => { status.textContent = ''; }, 2000);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('claude.ai')) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsUpdated', settings });
      }
    });
  });
});

// Reset to defaults
resetBtn.addEventListener('click', () => {
  ids.forEach(id => { els[id].value = DEFAULTS[id]; });
  currentEnabledBars = {};
  // Re-check all checkboxes
  liveUsage.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
  updateBarColors();
  status.textContent = 'Reset to defaults (click Save to apply)';
  status.style.color = '#eab308';
  setTimeout(() => { status.textContent = ''; }, 2000);
});
