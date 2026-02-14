# YouTube Transcript Extension v0.2.0 - Enhanced Edition

A Chrome Extension (Manifest V3) that captures YouTube transcripts with support for Chinese/Unicode characters, AI-powered summarization, and an integrated sidepanel for enhanced workflow.

## 🎯 What's New in v0.2.0

### ✅ Fixed Issues
1. **Chinese Character Support**: Video titles in Chinese and other Unicode languages are now properly captured and used in filenames
2. **Cmd+B Shortcut Fix**: Now correctly downloads transcript as TXT file instead of JSON
3. **Both Shortcuts Working**: Both Cmd+I and Cmd+B shortcuts now work reliably with proper event handling

### 🆕 New Features
1. **Sidepanel Interface**: Modern sidepanel for viewing and managing transcripts
2. **AI Summarization**: Integrate with Ollama (localhost:11434) or OpenAI-compatible servers
3. **Configurable Prompts**: Customize the AI summary prompt to your needs
4. **Download Summaries**: Save AI-generated summaries as TXT files
5. **Real-time Updates**: Sidepanel automatically updates when new transcripts are captured

## 🚀 Quick Start

### Installation
```bash
npm install
npm run build
```

Then load the `dist` folder as an unpacked extension in Chrome.

### Usage

#### Method 1: Keyboard Shortcuts (On YouTube)
- **Cmd/Ctrl + I**: Capture transcript and download as JSON
- **Cmd/Ctrl + B**: Download transcript as plain TXT file

#### Method 2: Sidepanel
1. Click the extension icon in Chrome toolbar
2. Click "Open Sidepanel" button
3. Navigate to a YouTube video
4. Use Cmd+I to capture the transcript
5. View transcript in sidepanel
6. Click "Summarize" to generate AI summary

## 🔧 Configuration

### AI Summary Settings
Access settings in the sidepanel by clicking the ⚙️ Settings icon:

**Server Type:**
- **Ollama**: For local AI models (default: http://localhost:11434)
- **OpenAI Compatible**: For remote API endpoints

**Configuration Options:**
- **Server URL**: API endpoint URL
- **API Key**: Optional authentication key (for OpenAI-compatible servers)
- **Model Name**: Model to use (e.g., "llama2", "gpt-4", "claude-3")
- **Summary Prompt**: Customize how transcripts are summarized

### Default Prompt Template
```
Please provide a concise summary of the following YouTube video transcript. 
Include the main topics discussed and key takeaways:

{transcript}
```

The `{transcript}` placeholder will be replaced with the actual transcript text.

## 📋 Features

### Transcript Capture
- ✅ Automatic detection of YouTube captions
- ✅ Supports json3 format transcripts
- ✅ Works with auto-generated and manual captions
- ✅ Handles Chinese, Japanese, Korean, and all Unicode characters
- ✅ Smart filename generation from video titles

### Transcript Display
- ✅ In-page panel with search and filtering
- ✅ Dedicated sidepanel for better workflow
- ✅ Click-to-seek functionality (in-page panel)
- ✅ Copy transcript text
- ✅ Download as TXT or JSON

### AI Integration
- ✅ Local AI via Ollama
- ✅ Remote OpenAI-compatible APIs
- ✅ Configurable prompts
- ✅ Downloadable summaries
- ✅ Error handling and loading states

## 🎨 Architecture

### Components
1. **Content Script** (`src/content/index.js`): Main logic for transcript capture and in-page UI
2. **Page Injector** (`src/inject/page.js`): Intercepts YouTube's timedtext API calls
3. **Background Service Worker** (`src/background/service-worker.js`): Manages sidepanel and storage
4. **Sidepanel** (`sidepanel.html` + `sidepanel.js`): Modern UI for transcripts and summaries
5. **Popup** (`public/popup.html` + `popup.js`): Quick access to sidepanel

### Data Flow
```
YouTube API → Page Injector → Content Script → Chrome Storage → Sidepanel
                                      ↓
                                 Downloads (JSON/TXT)
```

## 🔌 Ollama Setup

To use local AI summarization with Ollama:

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Download a model (e.g., llama2)
ollama pull llama2

# Start Ollama (runs on http://localhost:11434)
ollama serve
```

Then in the extension sidepanel:
1. Click ⚙️ Settings
2. Select "Ollama" as Server Type
3. Verify URL is `http://localhost:11434`
4. Set Model Name to `llama2` (or your installed model)
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
5. Open sidepanel and test AI features

## 🔐 Privacy & Security

- All processing happens client-side
- Transcripts stored locally in Chrome storage
- No external servers accessed except configured AI endpoints
- API keys stored securely in Chrome sync storage
- No tracking or analytics

## 🐛 Troubleshooting

### No transcript captured
- Ensure video has captions enabled
- Try toggling captions on/off
- Check if video has auto-generated captions
- Some videos may not have transcripts available

### Cmd+B downloads JSON instead of TXT
- This has been fixed in v0.2.0
- Ensure you're using the latest build
- Cmd+B now properly downloads plain text

### Chinese characters become ??? in filename
- This has been fixed in v0.2.0
- Update to latest version
- Now supports all Unicode characters

### AI summarization fails
- **Ollama**: Ensure Ollama is running (`ollama serve`)
- **OpenAI**: Verify API key is correct
- Check server URL is accessible
- Verify model name is correct
- Check browser console for error details

### Sidepanel doesn't update
- Click "Refresh" button in sidepanel
- Re-capture transcript with Cmd+I
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
