# Privacy Policy — Claude Usage Bar Colors

**Last updated:** April 5, 2026

## What this extension does

Claude Usage Bar Colors is a browser extension that changes the color of usage limit progress bars on claude.ai based on the percentage displayed.

## Data collection

This extension does **not** collect, store, transmit, or share any personal data or browsing information.

## What the extension accesses

- **claude.ai page content**: The extension reads `aria-valuenow` attributes from progress bar elements on the claude.ai settings/usage page to determine usage percentages. It does not read any other page content, messages, conversations, or personal information.
- **chrome.storage.sync**: The extension saves your color and threshold preferences using Chrome's built-in storage API. This data syncs across your devices if you are signed into Chrome, but is never sent to any third-party server.

## Permissions explained

| Permission | Why it's needed |
|-----------|----------------|
| `storage` | Save your color/threshold preferences locally |
| `activeTab` | Read usage percentages from the current claude.ai tab when you open the popup |
| `host_permissions: claude.ai` | Inject the content script that recolors the progress bars |

## Third-party services

This extension makes **zero** network requests. It does not use analytics, tracking, ads, or any external services.

## Open source

The full source code is available at [github.com/mihneaptu/claude-usage-bar-colors](https://github.com/mihneaptu/claude-usage-bar-colors) for inspection.

## Contact

If you have questions about this privacy policy, please open an issue on the GitHub repository.
