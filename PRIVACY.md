# Privacy Policy — Claude Usage Bar Colors

**Last updated:** April 5, 2026

## What this extension does

Claude Usage Bar Colors is a browser extension that changes the color of usage limit progress bars on the Claude usage page based on the percentage displayed.

## Data collection

This extension does **not** collect, store, transmit, or share any personal data or browsing information.

## What the extension accesses

- **Claude usage page**: The extension runs only on `https://claude.ai/settings/usage`. It reads `aria-valuenow` attributes from progress bar elements on that page to determine usage percentages. It does not read chats, prompts, account messages, or other page content.
- **Browser sync storage**: The extension saves your color, threshold, and toggle preferences using the browser's built-in sync storage. This keeps settings available across signed-in browser profiles where sync is enabled, but the extension never sends that data to any third-party server.

## Permissions explained

| Permission | Why it's needed |
|-----------|----------------|
| `storage` | Save your color/threshold preferences locally |
| `activeTab` | Let the popup read live usage from the currently open Claude usage tab when you click the extension icon |
| `host_permissions: https://claude.ai/settings/usage*` | Run the content script only on the Claude usage page |

## Third-party services

This extension makes **zero** network requests. It does not use analytics, tracking, ads, or any external services.

## Open source

The full source code is available at [github.com/mihneaptu/claude-usage-bar-colors](https://github.com/mihneaptu/claude-usage-bar-colors) for inspection.

## Contact

If you have questions about this privacy policy, please open an issue on the GitHub repository.
