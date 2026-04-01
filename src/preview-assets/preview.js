import morphdom from '/tikz-preview/vendor/morphdom-esm.js';

const statusEl = document.getElementById('status');
const gridEl = document.getElementById('grid');

if (!statusEl || !gridEl) {
    throw new Error('Preview page is missing required elements.');
}

let lastFingerprint = '';
let refreshInFlight = false;
let refreshQueued = false;

const morphdomOptions = {
    getNodeKey: (node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return undefined;
        }

        return node.getAttribute('data-key') || node.id;
    },
    onBeforeElUpdated: (fromEl, toEl) => {
        if (fromEl.tagName === 'IMG' && toEl.tagName === 'IMG') {
            const nextSrc = toEl.getAttribute('src') || '';
            const currentSrc = fromEl.getAttribute('src') || '';

            if (nextSrc && nextSrc !== currentSrc) {
                preloadAndSwapImage(fromEl, nextSrc, toEl.getAttribute('alt') || '');
            }

            // Keep existing image node stable to avoid flashes while swapping sources.
            return false;
        }

        return !fromEl.isEqualNode(toEl);
    },
};

async function fetchSvgs() {
    const response = await fetch('/tikz-preview/svgs', { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Failed to fetch SVG list');
    }

    const payload = await response.json();
    return payload.svgs || [];
}

function buildFingerprint(svgs) {
    return svgs
        .map((svg) => `${svg.name}:${svg.version || '0'}`)
        .join('|');
}

async function loadSvgs() {
    if (refreshInFlight) {
        refreshQueued = true;
        return;
    }

    refreshInFlight = true;

    try {
        do {
            refreshQueued = false;
            const svgs = await fetchSvgs();
            const nextFingerprint = buildFingerprint(svgs);

            if (nextFingerprint !== lastFingerprint) {
                renderSvgs(svgs);
                lastFingerprint = nextFingerprint;
            }
        } while (refreshQueued);
    } finally {
        refreshInFlight = false;
    }
}

function renderSvgs(svgs) {
    const virtualGridEl = gridEl.cloneNode(false);
    const previousScrollX = window.scrollX;
    const previousScrollY = window.scrollY;

    if (!svgs.length) {
        virtualGridEl.innerHTML = '<div class="empty">No SVG files found yet. Add or update a .tex file in utils/tikz/input.</div>';
        morphdom(gridEl, virtualGridEl, morphdomOptions);
        restoreScroll(previousScrollX, previousScrollY);
        return;
    }

    virtualGridEl.innerHTML = svgs
        .map((svg) => {
            const cacheKey = encodeURIComponent(svg.version || '0');
            return `
                <article class="card" data-key="${escapeHtml(svg.name)}">
                    <h2>${escapeHtml(svg.name)}</h2>
                    <div class="preview">
                        <img src="${svg.url}?v=${cacheKey}" alt="${escapeHtml(svg.name)}" loading="lazy">
                    </div>
                </article>
            `;
        })
        .join('');

    morphdom(gridEl, virtualGridEl, morphdomOptions);
    restoreScroll(previousScrollX, previousScrollY);
}

function restoreScroll(previousScrollX, previousScrollY) {
    if (window.scrollX !== previousScrollX || window.scrollY !== previousScrollY) {
        window.scrollTo(previousScrollX, previousScrollY);
    }
}

function preloadAndSwapImage(imgEl, nextSrc, nextAlt) {
    if (imgEl.dataset.pendingSrc === nextSrc) {
        return;
    }

    imgEl.dataset.pendingSrc = nextSrc;

    const loader = new Image();
    loader.decoding = 'async';

    loader.onload = () => {
        if (imgEl.dataset.pendingSrc !== nextSrc) {
            return;
        }

        imgEl.src = nextSrc;
        imgEl.alt = nextAlt;
        delete imgEl.dataset.pendingSrc;
    };

    loader.onerror = () => {
        if (imgEl.dataset.pendingSrc === nextSrc) {
            delete imgEl.dataset.pendingSrc;
        }
    };

    loader.src = nextSrc;
}

function connectEvents() {
    const events = new EventSource('/tikz-preview/events');

    events.onopen = () => {
        statusEl.textContent = 'Live updates enabled';
        statusEl.classList.remove('pulse');
    };

    events.addEventListener('update', async () => {
        statusEl.textContent = 'Live updates enabled';
        statusEl.classList.add('pulse');
        await loadSvgs();

        window.clearTimeout(connectEvents.statusTimeout);
        connectEvents.statusTimeout = window.setTimeout(() => {
            statusEl.textContent = 'Live updates enabled';
            statusEl.classList.remove('pulse');
        }, 900);
    });

    events.onerror = () => {
        statusEl.textContent = 'Disconnected. Retrying...';
        statusEl.classList.remove('pulse');
    };
}

function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

connectEvents.statusTimeout = 0;

loadSvgs()
    .then(connectEvents)
    .catch((error) => {
        statusEl.textContent = 'Unable to load SVGs';
        const virtualGridEl = gridEl.cloneNode(false);
        virtualGridEl.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
        morphdom(gridEl, virtualGridEl, morphdomOptions);
    });
