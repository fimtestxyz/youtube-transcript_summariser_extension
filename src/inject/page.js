(function() {
    if (window.__yttx_installed) return
    window.__yttx_installed = true

    function shouldTrack(u) {
        try {
            const url = typeof u === 'string' ? u : u && u.url ? u.url : String(u)
            if (!url || typeof url !== 'string') return false
            if (url.indexOf('/api/timedtext') === -1) return false
            return /[?&]v=([^&]+)/.test(url)
        } catch (_) {
            return false
        }
    }

    function extractVideoId(url) {
        try {
            const uu = new URL(typeof url === 'string' ? url : url.url || String(url))
            return uu.searchParams.get('v')
        } catch (_) {
            return null
        }
    }

    const origFetch = window.fetch
    window.fetch = async function() {
        const args = arguments
        const input = args[0]
        const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input)
        const res = await origFetch.apply(this, args)
        try {
            if (shouldTrack(url)) {
                const ct = res && res.headers ? res.headers.get('content-type') || '' : ''
                if (ct.indexOf('application/json') !== -1) {
                    const videoId = extractVideoId(url)
                    window.postMessage({
                        source: 'yttx',
                        type: 'YTTX_TIMEDTEXT_JSON',
                        videoId: videoId,
                        url: url
                    }, '*')
                }
            }
        } catch (_) {}
        return res
    }

    const OrigXHR = window.XMLHttpRequest

    function YTTXXHR() {
        const xhr = new OrigXHR()
        let trackedUrl = null
        const origOpen = xhr.open
        xhr.open = function(method, url) {
            trackedUrl = url
            return origOpen.apply(this, arguments)
        }
        const origSend = xhr.send
        xhr.addEventListener('load', function() {
            try {
                if (shouldTrack(trackedUrl)) {
                    const ct = xhr.getResponseHeader('content-type') || ''
                    if (ct.indexOf('application/json') !== -1) {
                        const videoId = extractVideoId(trackedUrl)
                        window.postMessage({
                            source: 'yttx',
                            type: 'YTTX_TIMEDTEXT_JSON',
                            videoId: videoId,
                            url: trackedUrl
                        }, '*')
                    }
                }
            } catch (_) {}
        })
        xhr.send = function() {
            return origSend.apply(this, arguments)
        }
        return xhr
    }
    window.XMLHttpRequest = YTTXXHR

    window.addEventListener('message', async function(evt) {
        const data = evt.data
        if (!data || data.source !== 'yttx-cs') return
        if (data.type === 'YTTX_FETCH_TIMEDTEXT') {
            try {
                const url = data.url
                const res = await window.fetch(url, {
                    credentials: 'include'
                })
                const ct = res && res.headers ? res.headers.get('content-type') || '' : ''
                if (ct.indexOf('application/json') !== -1) {
                    const text = await res.text()
                    const videoId = extractVideoId(url)
                    window.postMessage({
                        source: 'yttx',
                        type: 'YTTX_TIMEDTEXT_JSON_DATA',
                        jsonText: text,
                        videoId: videoId
                    }, '*')
                }
            } catch (_) {}
        }
    })
})()