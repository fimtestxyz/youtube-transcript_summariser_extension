# YouTube Transcript Extension (MV3) — v0.2.0

A Chrome Extension (Manifest V3) that captures YouTube transcripts (including Chinese/Unicode characters), renders them in an in-page panel and a sidepanel, downloads them as JSON or TXT, and summarizes them with local AI (Ollama) or any OpenAI-compatible API.

## Why This Approach
- YouTube watch pages are single-page apps and issue network requests dynamically.
- The most reliable way to detect actual transcript payloads is to observe `fetch`/`XMLHttpRequest` in the page context and match `*/api/timedtext` URLs that include `v=<videoId>`.
- A lightweight signal avoids heavy UI and clearly indicates when a transcript is available.

## ✨ Features

### Transcript Capture
- ✅ Automatic detection of YouTube captions
- ✅ Supports json3 format transcripts
- ✅ Works with auto-generated and manual captions
- ✅ Handles Chinese, Japanese, Korean, and all Unicode characters
- ✅ Smart filename generation from video titles

### Transcript Display
- ✅ In-page panel with search, filtering, and click-to-seek
- ✅ Dedicated sidepanel for better workflow
- ✅ Copy transcript text
- ✅ Download as TXT or JSON

### AI Summarization
- ✅ Local AI via Ollama
- ✅ Remote OpenAI-compatible APIs
- ✅ Configurable prompts
- ✅ Downloadable summaries
- ✅ Error handling and loading states

## Requirements
- Node.js 18+ and pnpm or npm
- Chrome 115+ with Manifest V3 support
- Ollama for local AI summarization — see [Ollama Setup](#-ollama-setup)

## 🚀 Quick Start

### Installation
```bash
npm install
npm run build
```
Then load the `dist` folder as an unpacked extension: open `chrome://extensions` → enable Developer Mode → Load Unpacked → select `dist`.

### Usage

#### Method 1: Keyboard Shortcuts (On YouTube)
- **Cmd/Ctrl + I**: Capture transcript and download as JSON
- **Cmd/Ctrl + B**: Download transcript as plain TXT file
- Both shortcuts are configurable from the popup. `Cmd+L` is reserved by Chrome and cannot be overridden.

#### Method 2: Sidepanel
1. Click the extension icon in the Chrome toolbar
2. Click "Open Sidepanel"
3. Navigate to a YouTube video
4. Use Cmd+I to capture the transcript
5. View the transcript in the sidepanel
6. Click "Summarize" to generate an AI summary

## 🔧 Configuration

### AI Summary Settings
Open the settings in the sidepanel by clicking the ⚙️ Settings icon:

**Server Type:**
- **Ollama**: For local AI models (default: `http://localhost:11434`)
- **OpenAI Compatible**: For remote API endpoints

**Configuration Options:**
- **Server URL**: API endpoint URL
- **API Key**: Optional authentication key (for OpenAI-compatible servers)
- **Model Name**: Model to use (e.g., `gemma4:26b-mlx`, `llama2`, `gpt-4`)
- **Summary Prompt**: Customize how transcripts are summarized

### Default Prompt Template
```
Please provide a concise summary of the following YouTube video transcript.
Include the main topics discussed and key takeaways:

{transcript}
```

The `{transcript}` placeholder is replaced with the actual transcript text.

## 🔌 Ollama Setup

> **Important:** Ollama must be started with `OLLAMA_ORIGINS="*"` or the extension's "Summarize" button will fail with **HTTP 403 Forbidden**. Use the provided launcher.

### Start Ollama with the launcher
```bash
./start_ollama.sh
```

The script runs:

```bash
OLLAMA_HOST="0.0.0.0" OLLAMA_ORIGINS="*" ollama serve
```

- `OLLAMA_ORIGINS="*"` — allows the browser extension's `chrome-extension://` origin to call Ollama. Without this, Ollama rejects the request with `403 Forbidden` (see [Troubleshooting](#-troubleshooting)).
- `OLLAMA_HOST="0.0.0.0"` — binds Ollama to all interfaces so it is reachable from the extension.

### Install a model
```bash
# e.g. install the Gemma model used in this project
ollama pull gemma4:26b-mlx
```

Verify the server is up and the model exists:

```bash
curl http://localhost:11434/api/tags
```

### Configure the sidepanel
1. Click ⚙️ Settings in the sidepanel
2. Select **Ollama** as Server Type
3. Verify Server URL is `http://localhost:11434`
4. Set Model Name to your installed model (e.g., `gemma4:26b-mlx`)
5. Click "Save Settings"

## 🌐 OpenAI-Compatible Servers

The extension works with any OpenAI-compatible API:

**Supported Services:**
- OpenAI API
- Azure OpenAI
- Anthropic Claude (via compatible wrapper)
- LocalAI
- Text Generation WebUI
- LM Studio
- And more...

**Configuration Example:**
```
Server Type: OpenAI Compatible
Server URL: https://api.openai.com
API Key: sk-...
Model Name: gpt-4
```

## 🎨 Architecture

### Components
1. **Content Script** (`src/content/index.js`): Main logic for transcript capture and in-page UI
2. **Page Injector** (`src/inject/page.js`): Intercepts YouTube's timedtext API calls
3. **Background Service Worker** (`src/background/service-worker.js`): Manages sidepanel and storage
4. **Sidepanel** (`sidepanel.html` + `sidepanel.js`): UI for transcripts and summaries
5. **Popup** (`public/popup.html` + `popup.js`): Quick access to sidepanel

### Data Flow
```
YouTube API → Page Injector → Content Script → Chrome Storage → Sidepanel
                                      ↓
                                 Downloads (JSON/TXT)
```

### Detection Strategy
- Wrap `window.fetch` and `XMLHttpRequest` in the page world so the extension sees the actual network calls YouTube makes.
- Match URLs containing `/api/timedtext` with a `v=` parameter.
- After the response, verify `status` is OK and `content-type` contains `application/json`.
- Signal once per current `videoId`; reset on navigation (`yt-navigate-finish` or a `MutationObserver` watching `ytd-watch-flexy`).

## 🛠️ Development

### Project Structure
```
youtube_transcript_extension-main/
├── src/
│   ├── content/
│   │   └── index.js          # Content script
│   ├── inject/
│   │   └── page.js           # Page-world script
│   └── background/
│       └── service-worker.js # Background service worker
├── public/
│   ├── popup.html            # Extension popup
│   └── popup.js
├── sidepanel.html            # Sidepanel UI
├── sidepanel.js              # Sidepanel logic
├── start_ollama.sh           # Ollama launcher (OLLAMA_ORIGINS="*")
├── vite.config.ts            # Build configuration
└── package.json
```

### Build Commands
```bash
npm run dev   # Development build with watch mode
npm run build # Production build
```

### Testing
1. Build the extension
2. Load in Chrome via `chrome://extensions`
3. Navigate to a YouTube video
4. Test keyboard shortcuts
5. Open the sidepanel and test AI features

## 🔐 Privacy & Security
- All processing happens client-side
- Transcripts are stored locally in Chrome storage
- No external servers are accessed except the configured AI endpoints
- API keys are stored securely in Chrome sync storage
- No tracking or analytics

## 🐛 Troubleshooting

### "Summarize" fails with HTTP 403 Forbidden
A `403 Forbidden` on `POST http://localhost:11434/api/chat` means **Ollama is rejecting the browser extension's origin** — it was started without `OLLAMA_ORIGINS="*"`.

Fix it:
1. Stop the current `ollama serve` (Ctrl+C in its terminal).
2. Restart it with the launcher: `./start_ollama.sh`
3. Confirm the env is right — you should see a `200` (not `403`) for this request:
   ```bash
   curl -X POST http://localhost:11434/api/chat \
     -H "Origin: chrome-extension://anything" \
     -H "Content-Type: application/json" \
     -d '{"model":"gemma4:26b-mlx","messages":[{"role":"user","content":"hi"}],"stream":false}'
   ```
4. Retry "Summarize" in the sidepanel.

Note: starting Ollama with a plain `ollama serve` (no `OLLAMA_ORIGINS`) will reproduce this 403. The model must also be installed (`ollama list`) and the model name in the sidepanel settings must match.

### No transcript captured
- Ensure the video has captions enabled
- Try toggling captions on/off
- Some videos may not have transcripts available

### Cmd+B downloads JSON instead of TXT / Chinese characters become `???`
- Both were fixed in v0.2.0; make sure you're using the latest build.

### AI summarization fails
- **Ollama**: Ensure Ollama is running via `./start_ollama.sh` and that it was started with `OLLAMA_ORIGINS="*"` (otherwise see the 403 section above)
- **OpenAI**: Verify the API key is correct
- Check the server URL is accessible and the model name matches `ollama list`
- Check the browser console for error details

### Sidepanel doesn't update
- Click "Refresh" in the sidepanel
- Re-capture the transcript with Cmd+I
- Check Chrome storage in DevTools

## 📝 Changelog

### v0.2.0 (Current)
- ✅ Fixed Chinese/Unicode character support in filenames
- ✅ Fixed Cmd+B shortcut to download TXT instead of JSON
- ✅ Fixed both keyboard shortcuts with proper event handling
- ✅ Added sidepanel interface
- ✅ Added AI summarization (Ollama + OpenAI compatible)
- ✅ Added configurable summary prompts
- ✅ Added summary download functionality
- ✅ Added background service worker
- ✅ Improved UI/UX across all components

### v0.1.0
- Initial release
- Basic transcript capture
- JSON download
- In-page panel with search

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Acknowledgments

Built with:
- Vite + @crxjs/vite-plugin
- Chrome Extension Manifest V3
- Ollama for local AI
- OpenAI-compatible API standards
