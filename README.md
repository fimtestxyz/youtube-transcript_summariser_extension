# YouTube Transcript Extension (MV3)

A Chrome Extension (Manifest V3) that detects YouTube caption requests to `/api/timedtext?v=...`, confirms a JSON transcript response (`Content-Type: application/json; charset=UTF-8`), shows a small on-page signal, renders a transcript panel on the YouTube page with search and copy functionality, extracts video titles for naming downloads, and provides a popup to configure keyboard shortcuts for downloading JSON transcripts and joined text files.

## Why This Approach
- YouTube watch pages are single-page apps and issue network requests dynamically.
- The most reliable way to detect actual transcript payloads is to observe `fetch`/`XMLHttpRequest` in the page context and match `*/api/timedtext` URLs that include `v=<videoId>`.
- A lightweight signal avoids heavy UI and clearly indicates when a transcript is available.

## Requirements
- Node.js 18+ and pnpm or npm.
- Chrome 115+ with Manifest V3 support.
- Basic knowledge of MV3 components: service worker (background), content scripts, and scripting API.

## Architecture
- Content Script: Injects a small overlay badge and the transcript panel UI, handles SPA navigation resets, listens for a configurable shortcut, and triggers JSON download.
- Page-World Hook: Wraps `window.fetch` and `XMLHttpRequest` to detect `/api/timedtext?v=` responses and check JSON `content-type`; fetches the latest timedtext JSON on demand.
- Popup: Allows configuring the shortcut (modifiers + key) and saves it to `chrome.storage.sync`.
- Background (Service Worker): Optional; can coordinate messaging or downloads if needed.

## Detection Strategy
- Intercept `fetch` and `XMLHttpRequest` in the page world so the extension can see the actual network calls YouTube makes.
- Check URL contains `/api/timedtext` and a `v=` parameter.
- After response, verify `status` is OK and `content-type` contains `application/json`.
- Signal once per current `videoId`; reset on navigation.

## Handling YouTube Navigation
- Listen for `yt-navigate-finish` to detect when the video changes and reset the signal.
- Fallback: Use a `MutationObserver` watching `ytd-watch-flexy` for changes (e.g., `video-id`).

## Keyboard Shortcut Considerations
- `Cmd+L` is reserved by Chrome for the address bar. It cannot be overridden reliably.
- The extension uses configurable shortcuts detected in the content script:
  - `Cmd+I` (default): Opens transcript panel, shows full transcript, allows search/filtering and copying results
  - `Cmd+B` (default): Downloads joined transcript text as `<video_title_slug>.txt`
- The popup updates stored shortcuts and changes apply immediately.

## Build Tool Choice
- Vite with `@crxjs/vite-plugin` (recommended): Fast, friendly MV3 dev workflow.
- Webpack (viable alternative): Heavier config; useful if your project standardizes on Webpack.

## Step-by-Step (Vite + CRX)
1. Initialize project
   - `pnpm create vite youtube-transcript-extension --template vanilla`
   - `pnpm add -D @crxjs/vite-plugin`

2. Add Manifest V3
   - Create `manifest.json` with:
     - `manifest_version: 3`
     - `name`, `version`, `description`
     - `host_permissions: ["*://*.youtube.com/*"]`
     - `permissions: ["scripting", "activeTab"]` (and `"downloads"` if you will save files)
     - `content_scripts` targeting `https://www.youtube.com/*`
     - `web_accessible_resources` if you inject a page-world script via `<script>` tag
     - `commands` for the chosen shortcut (not `Cmd+L`)

3. Configure Vite
   - In `vite.config.ts`, apply `crx` plugin and point it to `manifest.json`.
   - Output files for content script and service worker as needed.

4. Content Script
   - Inject a minimal badge element (hidden by default).
   - Insert page-world script to wrap `fetch`/`XHR` and post messages back upon detection.
   - Show the badge when a JSON timedtext response is detected.
   - Render a transcript panel when JSON is fetched; parse `json3` into lines with timestamps; clicking a line seeks the player; provide search and current-line highlight.
   - On navigation (`yt-navigate-finish`), hide the badge, reset the panel, and rebind hooks.

5. Page-World Hook
   - Wrap `window.fetch` and `XMLHttpRequest` to detect `/api/timedtext`.
   - On demand, fetch the last timedtext URL and return the raw JSON text back to the content script.

6. Shortcut & Download
   - A configurable shortcut (default `Cmd+I`) triggers a fetch of the latest timedtext JSON and downloads it as `transcript-<videoId>.json`.
   - The popup updates the shortcut modifiers and key; changes apply immediately.

7. Dev & Load in Chrome
   - `npm run dev` to build and watch.
   - Open Chrome → `chrome://extensions` → enable Developer Mode → Load Unpacked → select `dist`.
   - Navigate to a video and verify the badge appears when the timedtext JSON request completes; open the transcript panel; test the shortcut and popup configuration.

8. Testing & Validation
   - Confirm badge appears only after an actual JSON response to `/api/timedtext`.
   - Navigate between videos; ensure the badge resets appropriately.
   - Check that no errors appear in the console and YouTube functionality remains intact.

## Step-by-Step (Webpack) [Optional]
1. Initialize with `webpack` and `ts-loader` or plain JS.
2. Create `manifest.json` as above.
3. Bundle content script and service worker entries.
4. Inject page-world code via `web_accessible_resources` + DOM `<script>` tag.
5. Implement detection and badge as in Vite steps.

## Privacy & Compliance
- Keep processing client-side. Do not send payloads to external servers.
- Avoid storing cookies or authentication tokens.
- Respect YouTube’s Terms; only capture for user’s current session and video.

## Troubleshooting
- No badge: Captions may be unavailable, response may not be JSON (`fmt` not `json3`), or the endpoint path differs.
- Navigation resets: Ensure `yt-navigate-finish` or MutationObserver triggers rebind.
- Shortcut conflicts: Change the shortcut in the popup; avoid reserved combos.

## Next Steps
- Add a small settings panel to toggle auto-download or badge style.
- Support non-JSON formats (e.g., `srv3`, `vtt`) by adjusting detection and conversion.
- Cache last transcript per `videoId` in `chrome.storage.session` for reuse during navigation.

### Example Video
- Try on: `https://www.youtube.com/watch?v=bXKG_7q9p7c`. This video typically exposes English auto-generated captions; when the page fetches `/api/timedtext` with `fmt=json3`, the badge should light up.
