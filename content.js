// Default settings
const DEFAULTS = {
  yellowThreshold: 50,
  redThreshold: 80,
  greenColor: '#22c55e',
  yellowColor: '#eab308',
  redColor: '#ef4444',
  enabledBars: {} // label -> true/false, empty = all enabled
};

let settings = { ...DEFAULTS };

// Inject CSS immediately to hide the blue flash
const hideStyle = document.createElement('style');
hideStyle.textContent = `
  div[role="progressbar"] > div {
    transition: none !important;
    background-color: transparent !important;
  }
  div[role="progressbar"].usage-colored > div {
    background-color: var(--usage-bar-color) !important;
    transition: background-color 0.2s !important;
  }
`;
document.documentElement.appendChild(hideStyle);

// Load settings from storage
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, (result) => {
      settings = result;
      resolve();
    });
  });
}

// Get color based on percentage
function getColor(percent) {
  if (percent >= settings.redThreshold) return settings.redColor;
  if (percent >= settings.yellowThreshold) return settings.yellowColor;
  return settings.greenColor;
}

// Get the label for a progress bar
function getBarLabel(bar) {
  // Structure: the bar's row container has two main children:
  // 1. A div with the label (p.text-text-100) and reset time
  // 2. A div with the progressbar and "XX% used"
  // Walk up to the row container (has flex-row or gap-x-8)
  let parent = bar.parentElement;
  for (let i = 0; i < 5; i++) {
    if (!parent) break;
    // The row container is the one with the label p.text-text-100
    const labelEl = parent.querySelector('p.text-text-100, [class*="text-text-100"]');
    if (labelEl) {
      return labelEl.textContent.trim();
    }
    parent = parent.parentElement;
  }
  return 'Usage';
}

// Get the section title for a progress bar (e.g. "Plan usage limits", "Weekly limits", "Extra usage")
function getBarSection(bar) {
  let parent = bar.parentElement;
  for (let i = 0; i < 10; i++) {
    if (!parent) break;
    // Look for h2.font-large-bold heading within or before this container
    const heading = parent.querySelector('h2.font-large-bold, h2[class*="font-large-bold"]');
    if (heading) {
      return heading.textContent.trim();
    }
    // Also check previous siblings for the heading
    let sibling = parent.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'H2' && sibling.classList.contains('font-large-bold')) {
        return sibling.textContent.trim();
      }
      const nested = sibling.querySelector('h2.font-large-bold, h2[class*="font-large-bold"]');
      if (nested) return nested.textContent.trim();
      sibling = sibling.previousElementSibling;
    }
    parent = parent.parentElement;
  }
  return null;
}

// Check if a bar is enabled
function isBarEnabled(label) {
  // If enabledBars is empty or doesn't have the key, default to enabled
  if (!settings.enabledBars || Object.keys(settings.enabledBars).length === 0) return true;
  return settings.enabledBars[label] !== false;
}

// Find and recolor all usage bars on the page
function recolorBars() {
  const bars = document.querySelectorAll('div[role="progressbar"][aria-valuenow]');

  bars.forEach((bar) => {
    const percent = parseFloat(bar.getAttribute('aria-valuenow'));
    if (isNaN(percent)) return;

    const label = getBarLabel(bar);
    const fill = bar.querySelector('div');
    if (!fill) return;

    if (isBarEnabled(label)) {
      const color = getColor(percent);
      bar.classList.add('usage-colored');
      bar.style.setProperty('--usage-bar-color', color);
    } else {
      // Restore original: remove our overrides
      bar.classList.remove('usage-colored');
      bar.style.removeProperty('--usage-bar-color');
    }
  });
}

// Debounce helper
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedRecolor = debounce(recolorBars, 300);

const observer = new MutationObserver(debouncedRecolor);

// Remove the hide-flash CSS once we've done our first paint
function revealBars() {
  hideStyle.textContent = `
    div[role="progressbar"]:not(.usage-colored) > div {
      /* not colored by extension — keep site default */
    }
    div[role="progressbar"].usage-colored > div {
      background-color: var(--usage-bar-color) !important;
    }
  `;
}

async function init() {
  await loadSettings();
  recolorBars();
  revealBars();

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsUpdated') {
    settings = { ...DEFAULTS, ...message.settings };
    recolorBars();
  }

  if (message.type === 'getUsage') {
    const bars = [];

    // Detect extra usage state
    let extraUsageOn = false;
    let extraUsageLimit = null;
    const extraHeading = [...document.querySelectorAll('h2, h3, h4, p, span')]
      .find(el => el.textContent.trim() === 'Extra usage');
    if (extraHeading) {
      // Walk up to find the section container
      let section = extraHeading.parentElement;
      for (let i = 0; i < 5; i++) {
        if (!section) break;
        // Find the toggle checkbox
        const toggle = section.querySelector('input[type="checkbox"], input[role="switch"]');
        if (toggle) {
          extraUsageOn = toggle.checked;
          break;
        }
        section = section.parentElement;
      }
      // Find "Unlimited" or a limit amount
      let limitSection = extraHeading.parentElement;
      for (let i = 0; i < 8; i++) {
        if (!limitSection) break;
        const text = limitSection.textContent;
        if (text.includes('Unlimited')) {
          extraUsageLimit = 'Unlimited';
          break;
        }
        if (text.includes('Monthly spend limit')) {
          // The limit value is near "Monthly spend limit" text
          const allText = limitSection.textContent;
          const limitMatch = allText.match(/(€[\d.]+|[\$£][\d.]+)\s*(?:\(i\))?\s*Monthly spend limit/);
          if (limitMatch) {
            extraUsageLimit = limitMatch[1];
          }
          break;
        }
        limitSection = limitSection.parentElement;
      }
    }

    document.querySelectorAll('div[role="progressbar"][aria-valuenow]').forEach((bar) => {
      const percent = parseFloat(bar.getAttribute('aria-valuenow'));
      if (isNaN(percent)) return;
      const label = getBarLabel(bar);
      const enabled = isBarEnabled(label);

      const section = getBarSection(bar);
      const barData = { percent, label, enabled, section };

      // Detect extra usage bar by its label (contains currency + "spent")
      if (label.includes('spent')) {
        barData.isExtra = true;
        barData.extraOn = extraUsageOn;
        barData.extraLimit = extraUsageLimit;
      }

      bars.push(barData);
    });
    sendResponse({ bars });
    return true;
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  for (const key of Object.keys(changes)) {
    settings[key] = changes[key].newValue;
  }
  recolorBars();
});

init();
