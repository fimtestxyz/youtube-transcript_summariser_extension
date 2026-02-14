const badgeId = 'yttx-badge'
let lastVideoId = null
let lastTimedtextUrl = null
let initialized = false
let shortcutConfig = {
    meta: true,
    ctrl: false,
    alt: false,
    shift: false,
    code: 'KeyI'
}
let downloadTextShortcut = {
    meta: true,
    ctrl: false,
    alt: false,
    shift: false,
    code: 'KeyB'
}
let transcriptData = null
let rawTranscriptJson = null
let videoTitle = null
let videoTitleSlug = null
let panelEl = null
let listEl = null
let searchEl = null
let syncTimer = null

function createBadge() {
    if (document.getElementById(badgeId)) return
    const el = document.createElement('div')
    el.id = badgeId
    el.textContent = 'Transcript captured'
    el.style.position = 'fixed'
    el.style.top = '12px'
    el.style.right = '12px'
    el.style.padding = '6px 10px'
    el.style.background = '#16a34a'
    el.style.color = '#fff'
    el.style.fontSize = '12px'
    el.style.lineHeight = '1'
    el.style.borderRadius = '12px'
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
    el.style.zIndex = '2147483647'
    el.style.display = 'none'
    el.style.userSelect = 'none'
    document.documentElement.appendChild(el)
}

function showBadge() {
    const el = document.getElementById(badgeId)
    if (!el) return
    el.style.display = 'block'
}

function hideBadge() {
    const el = document.getElementById(badgeId)
    if (!el) return
    el.style.display = 'none'
}

function createPanel() {
    if (panelEl) return
    const wrap = document.createElement('div')
    wrap.style.position = 'fixed'
    wrap.style.top = '60px'
    wrap.style.right = '12px'
    wrap.style.width = '360px'
    wrap.style.maxHeight = '60vh'
    wrap.style.background = '#0f0f0f'
    wrap.style.color = '#fff'
    wrap.style.borderRadius = '8px'
    wrap.style.boxShadow = '0 6px 24px rgba(0,0,0,0.35)'
    wrap.style.zIndex = '2147483647'
    wrap.style.display = 'none'

    const header = document.createElement('div')
    header.style.display = 'flex'
    header.style.alignItems = 'center'
    header.style.justifyContent = 'space-between'
    header.style.padding = '8px'
    const title = document.createElement('div')
    title.textContent = 'Transcript'
    title.style.fontWeight = '600'
    title.style.fontSize = '13px'
    header.appendChild(title)
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    closeBtn.style.cursor = 'pointer'
    closeBtn.style.background = 'transparent'
    closeBtn.style.border = 'none'
    closeBtn.style.color = '#fff'
    closeBtn.style.fontSize = '16px'
    closeBtn.style.lineHeight = '1'
    closeBtn.addEventListener('click', () => hidePanel())
    header.appendChild(closeBtn)

    const search = document.createElement('input')
    search.type = 'text'
    search.placeholder = 'Search'
    search.style.margin = '0 8px 8px'
    search.style.width = 'calc(100% - 16px)'
    search.style.padding = '6px 8px'
    search.style.borderRadius = '6px'
    search.style.border = '1px solid #333'

    const list = document.createElement('div')
    list.style.overflow = 'auto'
    list.style.maxHeight = '48vh'
    list.style.padding = '4px 8px 8px'
    list.style.fontSize = '13px'
    list.style.lineHeight = '1.4'

    wrap.appendChild(header)
    wrap.appendChild(search)
    wrap.appendChild(list)
    document.documentElement.appendChild(wrap)
    panelEl = wrap
    listEl = list
    searchEl = search
    searchEl.addEventListener('input', renderList)
}

function showPanel() {
    createPanel()
    if (panelEl) panelEl.style.display = 'block'
    startSync()
}

function hidePanel() {
    if (panelEl) panelEl.style.display = 'none'
    stopSync()
}

function msToTs(ms) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const r = s % 60
    const mm = String(m)
    const rr = r < 10 ? '0' + r : String(r)
    return mm + ':' + rr
}

function parseJson3(text) {
    try {
        const obj = JSON.parse(text)
        const ev = obj.events || []
        const out = []
        for (let i = 0; i < ev.length; i++) {
            const e = ev[i]
            const segs = e.segs || []
            let t = ''
            for (let j = 0; j < segs.length; j++) {
                const s = segs[j]
                if (s && s.utf8) t += s.utf8
            }
            t = String(t || '').trim()
            if (!t) continue
            const start = e.tStartMs || 0
            const dur = e.dDurationMs || 0
            out.push({
                start,
                end: start + dur,
                text: t
            })
        }
        return out
    } catch (_) {
        return []
    }
}

function extractAndJoinUtf8(data) {
    if (!data || !data.events || !Array.isArray(data.events)) {
        console.error("Invalid data structure provided.");
        return "";
    }

    const allUtf8Segments = [];

    // Iterate over each event object in the events array
    for (const event of data.events) {
        // Ensure the event has a segs array and it is an array
        if (event.segs && Array.isArray(event.segs)) {
            // Iterate over each segment object in the segs array
            for (const segment of event.segs) {
                // Check if the segment has a non-empty 'utf8' string
                if (typeof segment.utf8 === 'string' && segment.utf8.length > 0) {
                    allUtf8Segments.push(segment.utf8);
                }
            }
        }
    }

    // Join all the extracted segments into a single string, using a space as a separator
    return allUtf8Segments.join(' ');
}

function joinTranscriptText() {
    if (!transcriptData || !transcriptData.length) return ''
    return transcriptData.map(item => item.text).join(' ')
}

function copyFilteredResults() {
    if (!transcriptData || !searchEl) return
    const q = searchEl.value.trim().toLowerCase()
    const filtered = q ?
        transcriptData.filter(item => item.text.toLowerCase().includes(q)) :
        transcriptData
    const textToCopy = filtered.map(item => item.text).join(' ')
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Show brief feedback
            const copyBtn = document.getElementById('yttx-copy-btn')
            if (copyBtn) {
                const originalText = copyBtn.textContent
                copyBtn.textContent = 'Copied!'
                setTimeout(() => {
                    copyBtn.textContent = originalText
                }, 1000)
            }
        }).catch(err => {
            console.warn('Failed to copy text:', err)
        })
    }
}

function renderList() {
    if (!listEl) return
    const q = (searchEl && searchEl.value || '').trim().toLowerCase()
    listEl.innerHTML = ''
    const items = transcriptData || []

    // Add copy button if there are filtered results
    if (items.length > 0) {
        const copyRow = document.createElement('div')
        copyRow.style.display = 'flex'
        copyRow.style.justifyContent = 'flex-end'
        copyRow.style.padding = '4px 0 8px 0'

        const copyBtn = document.createElement('button')
        copyBtn.id = 'yttx-copy-btn'
        copyBtn.textContent = 'Copy transcript text'
        copyBtn.style.background = '#1a73e8'
        copyBtn.style.color = '#fff'
        copyBtn.style.border = 'none'
        copyBtn.style.borderRadius = '4px'
        copyBtn.style.padding = '4px 8px'
        copyBtn.style.fontSize = '11px'
        copyBtn.style.cursor = 'pointer'
        copyBtn.addEventListener('click', copyFilteredResults)

        copyRow.appendChild(copyBtn)
        listEl.appendChild(copyRow)
    }

    for (let i = 0; i < items.length; i++) {
        const it = items[i]
        const txt = it.text
        if (q && txt.toLowerCase().indexOf(q) === -1) continue
        const row = document.createElement('div')
        row.style.display = 'flex'
        row.style.gap = '8px'
        row.style.padding = '4px 0'
        const ts = document.createElement('div')
        ts.textContent = msToTs(it.start)
        ts.style.color = '#9aa0a6'
        ts.style.minWidth = '52px'
        const text = document.createElement('div')
        text.textContent = txt
        text.style.flex = '1'
        row.appendChild(ts)
        row.appendChild(text)
        row.addEventListener('click', () => seekTo(it.start))
        listEl.appendChild(row)
    }
}

function seekTo(ms) {
    const v = document.querySelector('video')
    if (!v) return
    v.currentTime = ms / 1000
}

function startSync() {
    stopSync()
    syncTimer = setInterval(() => {
        const v = document.querySelector('video')
        if (!v || !listEl) return
        const t = v.currentTime * 1000
        const rows = listEl.children
        if (!rows || !rows.length) return
        let idx = -1
        const items = transcriptData || []
        for (let i = 0; i < items.length; i++) {
            const it = items[i]
            if (t >= it.start && t < it.end) {
                idx = i;
                break
            }
        }
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i]
            r.style.background = ''
        }
        if (idx >= 0 && rows[idx]) {
            rows[idx].style.background = '#1f2937'
            rows[idx].scrollIntoView({
                block: 'nearest'
            })
        }
    }, 500)
}

function stopSync() {
    if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null
    }
}

function injectPageScript() {
    const src = chrome.runtime.getURL('src/inject/page.js')
    const s = document.createElement('script')
    s.src = src
    s.async = false;
    (document.head || document.documentElement).appendChild(s)
    s.remove()
}

function getCurrentVideoIdFromUrl() {
    try {
        const u = new URL(window.location.href)
        return u.searchParams.get('v')
    } catch (_) {
        return null
    }
}

function extractVideoTitle() {
    try {
        const titleElement = document.querySelector('h1 > yt-formatted-string[title]')
        if (titleElement) {
            return titleElement.getAttribute('title') || titleElement.textContent || titleElement.innerText || ''
        }
        // Fallback: try to get from meta tag
        const metaTitle = document.querySelector('meta[name="title"]')
        if (metaTitle) {
            return metaTitle.getAttribute('content') || ''
        }
        // Fallback: try h1 title
        const h1Title = document.querySelector('h1.title')
        if (h1Title) {
            return h1Title.textContent || h1Title.innerText || ''
        }
        // Last fallback: try page title
        return document.title.replace(' - YouTube', '') || 'unknown'
    } catch (_) {
        return 'unknown'
    }
}

function createSlug(text) {
    // Support Chinese and other Unicode characters
    return text
        .trim()
        .replace(/[\\/:"*?<>|]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .substring(0, 200) // Limit length for filename safety
}

function onNavigateFinish() {
    lastVideoId = getCurrentVideoIdFromUrl()
    videoTitle = extractVideoTitle()
    // vidoeTitle might contains chinese characters, need to parse it correctly and make it a slug
    videoTitle = decodeURIComponent(videoTitle)

    videoTitleSlug = createSlug(videoTitle)
    hideBadge()
}

function bindNavigation() {
    window.addEventListener('yt-navigate-finish', onNavigateFinish)
    const target = document.querySelector('ytd-watch-flexy') || document.body
    const mo = new MutationObserver(() => {
        const vid = getCurrentVideoIdFromUrl()
        if (vid && vid !== lastVideoId) {
            lastVideoId = vid
            hideBadge()
        }
    })
    mo.observe(target, {
        attributes: true,
        childList: true,
        subtree: true
    })
}

function bindMessaging() {
    window.addEventListener('message', (evt) => {
        const data = evt.data
        if (!data || data.source !== 'yttx') return
        if (data.type === 'YTTX_TIMEDTEXT_JSON') {
            const vid = data.videoId || getCurrentVideoIdFromUrl()
            if (!lastVideoId) lastVideoId = vid
            if (data.url) lastTimedtextUrl = data.url
            if (vid && vid === lastVideoId) {
                showBadge()
            } else if (vid && !lastVideoId) {
                lastVideoId = vid
                showBadge()
            }
        }
        if (data.type === 'YTTX_TIMEDTEXT_JSON_DATA') {
            const text = data.jsonText
            if (typeof text === 'string' && text.length) {
                try {
                    rawTranscriptJson = JSON.parse(text)
                } catch (e) {
                    console.warn('Failed to parse transcript JSON:', e)
                    rawTranscriptJson = null
                }
                transcriptData = parseJson3(text)
                renderList()
                showPanel()
                
                // Extract plain text for sidepanel
                const plainText = extractAndJoinUtf8(rawTranscriptJson)
                
                // Store transcript data for sidepanel access
                chrome.storage.local.set({
                    currentTranscript: plainText,
                    currentTranscriptJson: text,
                    currentVideoTitle: videoTitle || 'unknown',
                    currentVideoId: data.videoId || lastVideoId || 'unknown'
                })
                
                const blob = new Blob([text], {
                    type: 'application/json;charset=utf-8'
                })
                const a = document.createElement('a')
                const url = URL.createObjectURL(blob)
                let filename = videoTitleSlug || data.videoId || lastVideoId || 'video'
                // filename shall prepend with videoTitleSlug if it exists
                if (videoTitle) {
                    filename = `${videoTitle}-${filename}`
                }
                a.href = url
                a.download = `${filename}.json`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
            }
        }
    })
}

function matchesShortcut(evt) {
    if (!!shortcutConfig.meta !== !!evt.metaKey) return false
    if (!!shortcutConfig.ctrl !== !!evt.ctrlKey) return false
    if (!!shortcutConfig.alt !== !!evt.altKey) return false
    if (!!shortcutConfig.shift !== !!evt.shiftKey) return false
    if (evt.code !== shortcutConfig.code) return false
    return true
}

function matchesDownloadTextShortcut(evt) {
    if (!!downloadTextShortcut.meta !== !!evt.metaKey) return false
    if (!!downloadTextShortcut.ctrl !== !!evt.ctrlKey) return false
    if (!!downloadTextShortcut.alt !== !!evt.altKey) return false
    if (!!downloadTextShortcut.shift !== !!evt.shiftKey) return false
    if (evt.code !== downloadTextShortcut.code) return false
    return true
}

function downloadTranscriptText() {
    if (!rawTranscriptJson) {
        if (!lastTimedtextUrl) return
        // If no transcript data, fetch it first
        window.postMessage({
            source: 'yttx-cs',
            type: 'YTTX_FETCH_TIMEDTEXT',
            url: lastTimedtextUrl
        }, '*')
        return
    }

    const joinedText = extractAndJoinUtf8(rawTranscriptJson)
    if (!joinedText) return

    const blob = new Blob([joinedText], {
        type: 'text/plain;charset=utf-8'
    })
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const filename = videoTitleSlug || lastVideoId || 'video'
    a.href = url
    a.download = `${filename}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

function bindShortcut() {
    window.addEventListener('keydown', (evt) => {
        const tag = (evt.target && evt.target.tagName) || ''
        if (/(INPUT|TEXTAREA|SELECT)/.test(tag)) return

        // Handle Cmd+B (download joined text) - check first to prevent JSON download
        if (matchesDownloadTextShortcut(evt)) {
            evt.preventDefault()
            evt.stopPropagation()
            downloadTranscriptText()
            return
        }

        // Handle Cmd+I (show panel and download JSON)
        if (matchesShortcut(evt)) {
            evt.preventDefault()
            evt.stopPropagation()
            if (!lastTimedtextUrl) return
            window.postMessage({
                source: 'yttx-cs',
                type: 'YTTX_FETCH_TIMEDTEXT',
                url: lastTimedtextUrl
            }, '*')
        }
    })
}

function loadShortcut() {
    try {
        chrome.storage.sync.get({
            shortcut: shortcutConfig
        }, (items) => {
            const s = items && items.shortcut ? items.shortcut : shortcutConfig
            shortcutConfig = {
                meta: !!s.meta,
                ctrl: !!s.ctrl,
                alt: !!s.alt,
                shift: !!s.shift,
                code: typeof s.code === 'string' && s.code ? s.code : 'KeyI'
            }
        })
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'sync') return
            if (changes.shortcut) {
                const s = changes.shortcut.newValue
                if (s) {
                    shortcutConfig = {
                        meta: !!s.meta,
                        ctrl: !!s.ctrl,
                        alt: !!s.alt,
                        shift: !!s.shift,
                        code: typeof s.code === 'string' && s.code ? s.code : 'KeyI'
                    }
                }
            }
        })
    } catch (_) {}
}

function init() {
    if (initialized) return
    initialized = true
    createBadge()
    injectPageScript()
    bindNavigation()
    bindMessaging()
    bindShortcut()
    loadShortcut()
    lastVideoId = getCurrentVideoIdFromUrl()
    videoTitle = extractVideoTitle()
    videoTitleSlug = createSlug(videoTitle)
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init()
} else {
    window.addEventListener('DOMContentLoaded', init)
}