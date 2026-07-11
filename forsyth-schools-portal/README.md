# Forsyth Schools Portal

A Chrome Extension for Forsyth County Schools students that provides quick access to ClassLink, Infinite Campus, Canvas, and district resources from a clean dashboard popup.

## Features

- **Dashboard launcher** — One-click access to ClassLink, Infinite Campus, Canvas, and School Resources
- **Personalized welcome** — Detects your display name from Infinite Campus and shows "Welcome, {Name}"
- **ClassLink session awareness** — Prompts you to sign in when ClassLink is not active
- **Privacy-first** — Stores only your display name locally; no tracking, analytics, or external servers

## Installation

### Option A — Download the built package (recommended)

GitHub Actions builds a ready-to-install zip on every push to `main`.

1. Go to the [Latest build release](https://github.com/jwatson2029/forsyth-schools-portal/releases/tag/latest-build)
2. Download `forsyth-schools-portal-v1.0.0.zip` (version number may vary)
3. Extract the zip to a folder on your computer
4. Open Chrome and go to `chrome://extensions`
5. Enable **Developer mode** (toggle in the top-right corner)
6. Click **Load unpacked** and select the extracted folder (the one containing `manifest.json`)
7. Pin the extension to your toolbar for easy access

You can also download the zip from any [GitHub Release](https://github.com/jwatson2029/forsyth-schools-portal/releases) or from the **Artifacts** section of the latest [Build Extension workflow run](https://github.com/jwatson2029/forsyth-schools-portal/actions).

### Option B — Load from source (Developer Mode)

1. Clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `forsyth-schools-portal` folder from the cloned repo
6. Pin the extension to your toolbar for easy access

## First Use

1. Click the **Forsyth Schools Portal** icon in your Chrome toolbar
2. You'll see a welcome dashboard with resource cards
3. Visit **Infinite Campus** while logged in — the extension reads your display name from the student card on the page
4. Reopen the popup to see your personalized greeting: "Welcome, {Your Name}"
5. Sign into **ClassLink** so the extension can confirm your session is active

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `storage` | Save your display name and ClassLink session state locally on your device |
| `tabs` | Open ClassLink, Infinite Campus, Canvas, and district pages when you click Open |
| `activeTab` | Minimal tab access for extension interactions |
| `scripting` | Reserved for future scoped script injection if needed |

### Host Permissions

| Domain | Why it's needed |
|---|---|
| `campus.forsyth.k12.ga.us` | Read your visible display name from the Infinite Campus student card (one element only) |
| `launchpad.classlink.com` | Detect whether you are signed into ClassLink (visible UI only) |
| `forsyth.instructure.com` | Open Canvas when you click the Canvas card |

The extension does **not** request access to all websites, cookies, browsing history, or passwords.

## Privacy

- **No data collection** — Nothing is sent to external servers
- **No analytics or tracking**
- **Local storage only** — Your display name is stored in `chrome.storage.local` on your device
- **No credentials** — The extension never reads passwords, cookies, or authentication tokens
- **Minimal page access** — Content scripts read only:
  - The student name heading on Infinite Campus (`h2.student-card__student-name`) inside the student portal iframe
  - Visible login/dashboard UI on ClassLink to detect session state

To clear stored data: go to `chrome://extensions`, find Forsyth Schools Portal, and click **Remove** or clear extension data.

## Project Structure

```
forsyth-schools-portal/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup.html             # Dashboard popup UI
├── popup.js               # Popup logic and storage reads
├── popup.css              # Dashboard styles
├── background.js          # Minimal service worker
├── content/
│   ├── infinite-campus.js # Student name detection (single DOM element)
│   └── classlink.js       # ClassLink login session detection
├── assets/
│   └── icons/             # Extension icons (16, 48, 128 px)
└── README.md
```

## Chrome Web Store Submission

### Store listing copy

**Short description** (132 characters max — also used in `manifest.json`):

> Your Forsyth schools dashboard in one click—ClassLink, Infinite Campus, Canvas, and district tools, personalized and private.

**Detailed description** (paste into the Chrome Web Store listing):

> Forsyth Schools Portal puts everything you need for school in one place—right from your Chrome toolbar.
>
> Instead of digging through bookmarks or opening tabs one by one, click the extension icon to open a clean dashboard with quick access to ClassLink, Infinite Campus, Canvas, and Forsyth County Schools resources. Each tool is one tap away.
>
> **Why install it?**
> - **Save time** — Open ClassLink, Infinite Campus, and Canvas from a single dashboard
> - **Feels personal** — Greets you by name after you visit Infinite Campus (stored only on your device)
> - **Built for Forsyth students** — Links point to the correct Forsyth County Schools portals
> - **Private by design** — No tracking, no analytics, no data sent to external servers
> - **Lightweight** — Small popup, dark modern UI, no account required to use the extension itself
>
> **What it does**
> - Launches ClassLink, Infinite Campus, Canvas, and the district website in a new tab
> - Reads your display name from Infinite Campus to personalize your welcome message
> - Remembers your name locally so the dashboard is ready every time you open it
>
> **What it does NOT do**
> - Does not collect passwords, grades, or browsing history
> - Does not sell or share student information
> - Does not bypass school login— you sign in through your school's normal pages
>
> Made for Forsyth County Schools students who want a faster, simpler way to get to their school tools every day.

### Before submitting

1. **Test thoroughly** — Load unpacked and verify all cards open correctly, name detection works on Infinite Campus, and ClassLink sign-in prompts appear when logged out
2. **Prepare screenshots** — Capture the popup at 1280×800 and 640×400 for the store listing
3. **Write store listing** — Single-purpose description: student portal launcher for Forsyth County Schools
4. **Privacy declaration** — State that the extension does not collect personal data; only stores display name locally
5. **Zip the extension** — Include all files except `.git`, dev configs, and the plan file:

   ```bash
   cd forsyth-schools-portal
   zip -r ../forsyth-schools-portal.zip . -x "*.git*"
   ```

6. **Submit at** [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### Review tips

- Content scripts are scoped to specific Forsyth school domains only
- Infinite Campus script reads a single visible heading element — no broad scraping
- No remote code, no CDN dependencies, no external network requests from extension code
- Permissions are minimal and justified in the listing description

## Development

No local build step is required for development. Edit files and reload the extension at `chrome://extensions` → **Reload**.

### CI build

The [Build Extension](https://github.com/jwatson2029/forsyth-schools-portal/actions/workflows/build-extension.yml) workflow:

- Validates `manifest.json` and required extension files
- Packages the extension into `forsyth-schools-portal-v{version}.zip`
- Uploads the zip as a workflow artifact
- Publishes a `latest-build` release on every push to `main`
- Creates a versioned GitHub Release when you push a tag like `v1.0.1`

To trigger a local package manually:

```bash
cd forsyth-schools-portal
zip -r ../forsyth-schools-portal-v1.0.0.zip . -x "*.DS_Store"
```

### Manual testing checklist

- [ ] Popup shows loading state, then welcome empty state on first open
- [ ] Infinite Campus visit captures student name into storage
- [ ] Popup shows "Welcome, {Name}" after name is saved
- [ ] ClassLink logged-out state shows "Please sign in to ClassLink"
- [ ] ClassLink logged-in state shows personalized welcome
- [ ] Each card Open button opens the correct URL in a new tab
- [ ] Name persists after browser restart
- [ ] No network requests from extension code in DevTools

## License

For use by Forsyth County Schools students. Not affiliated with or endorsed by Forsyth County Schools unless officially adopted by the district.
