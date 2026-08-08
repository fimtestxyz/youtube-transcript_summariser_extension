import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'

const manifest = {
  manifest_version: 3,
  name: 'YouTube Transcript scraper',
  version: '0.2.0',
  description: 'Detects /api/timedtext JSON transcripts and shows a signal on YouTube watch pages.',
  host_permissions: [
    '*://*.youtube.com/*',
    '<all_urls>'
  ],
  permissions: [
    'scripting',
    'activeTab',
    'storage',
    'sidePanel'
  ],
  content_scripts: [
    {
      matches: [
        'https://www.youtube.com/*'
      ],
      js: [
        'src/content/index.js'
      ],
      run_at: 'document_idle'
    }
  ],
  web_accessible_resources: [
    {
      matches: [
        'https://www.youtube.com/*'
      ],
      resources: [
        'src/inject/page.js'
      ]
    }
  ],
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  action: {
    default_title: 'YouTube Transcript Extension',
    default_popup: 'popup.html',
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    }
  },
  side_panel: {
    default_path: 'sidepanel.html'
  },
  background: {
    service_worker: 'src/background/service-worker.js',
    type: 'module'
  }
}

export default defineConfig({
  plugins: [crx({ manifest })]
})
