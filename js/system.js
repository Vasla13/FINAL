const DESKTOP_PROFILES = {
    "n.bennett": {
        theme: "noah",
        statusText: "STATUT : CONFORMITÉ CLINIQUE",
        exclusiveApp: {
            id: "compliance",
            label: "Conformité"
        },
        openSound: {
            name: "uiOpenClean",
            volume: 0.16,
            playbackRate: 1.04
        }
    },
    "o.reynolds": {
        theme: "olivia",
        statusText: "STATUT : FILE ADMINISTRATIVE SATURÉE",
        exclusiveApp: {
            id: "trash",
            label: "Corbeille"
        },
        desktopNote: "APPELER\nLA COMPTA",
        windowOpenDelayMs: 520
    },
    "m.brooks": {
        theme: "madison",
        statusText: "STATUT : OBSERVATION LATENTE",
        exclusiveApp: {
            id: "camera",
            label: "Flux Caméra"
        }
    },
    "e.carter": {
        theme: "emily",
        statusText: "STATUT : DÉRIVE IA DÉTECTÉE",
        exclusiveApp: {
            id: "regis-monitor",
            label: "Moniteur R.E.G.I.S."
        },
        openSound: {
            name: "uiOpenRegis",
            volume: 0.2,
            playbackRate: 0.92
        },
        hasRegisGlitch: true,
        idleAudio: {
            name: "emilyIdle",
            volume: 0.042,
            playbackRate: 0.96
        }
    }
};

window.registreDesktopProfiles = DESKTOP_PROFILES;

let currentUser = null;
let zIndexCounter = 100;

const desktopRuntime = {
    glitchTimer: null,
    glitchPulseTimer: null,
    idleTimer: null,
    idleAudio: null,
    activityHandler: null,
    activityEvents: [],
    unloadBound: false
};

document.addEventListener("DOMContentLoaded", () => {
    const activeUser = sessionStorage.getItem('registre_active_user');
    const displayName = sessionStorage.getItem('registre_display_name');

    if (!activeUser || typeof vmData === 'undefined' || !vmData[activeUser]) {
        window.location.href = "index.html";
        return;
    }

    currentUser = activeUser;
    applyDesktopProfile(activeUser, displayName);

    document.getElementById('logout-btn').addEventListener('click', () => {
        cleanupDesktopRuntime();
        sessionStorage.clear();
        document.getElementById('window-area').innerHTML = "";
        document.getElementById('system-status').textContent = "FERMETURE DE SESSION...";
        setTimeout(() => { window.location.href = "index.html"; }, 800);
    });

    if (!desktopRuntime.unloadBound) {
        window.addEventListener('beforeunload', cleanupDesktopRuntime);
        desktopRuntime.unloadBound = true;
    }
});

function getCurrentDesktopProfile(userId = currentUser) {
    return DESKTOP_PROFILES[userId] || {};
}

function applyDesktopProfile(userId, displayName) {
    const profile = getCurrentDesktopProfile(userId);
    const osContainer = document.getElementById('os-container');
    const windowArea = document.getElementById('window-area');
    const sidebar = document.getElementById('sidebar');
    const statusNode = document.getElementById('system-status');
    const userNode = document.getElementById('current-user-display');

    document.body.dataset.profile = userId;
    if (osContainer) osContainer.dataset.profile = profile.theme || userId;
    if (windowArea) windowArea.dataset.profile = profile.theme || userId;
    if (sidebar) sidebar.dataset.profile = profile.theme || userId;

    if (userNode) {
        userNode.textContent = `UTILISATEUR : ${displayName.toUpperCase()} [${vmData[userId].role}]`;
    }

    if (statusNode) {
        statusNode.textContent = profile.statusText || "STATUT : SÉCURISÉ";
    }

    ensureDesktopOverlays();
    renderDeskNote(profile.desktopNote || "");
    injectExclusiveModuleButton(profile);
    initializeProfileRuntime(userId);
}

function ensureDesktopOverlays() {
    const osContainer = document.getElementById('os-container');
    const windowArea = document.getElementById('window-area');
    if (!osContainer || !windowArea) return;

    if (!document.getElementById('desk-note')) {
        const note = document.createElement('div');
        note.id = 'desk-note';
        note.hidden = true;
        windowArea.appendChild(note);
    }

    if (!document.getElementById('regis-glitch-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'regis-glitch-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="regis-glitch-scan"></div>
            <div class="regis-glitch-code"></div>
        `;
        osContainer.appendChild(overlay);
    }
}

function renderDeskNote(noteText) {
    const note = document.getElementById('desk-note');
    if (!note) return;

    note.textContent = noteText || "";
    note.hidden = !noteText;
}

function injectExclusiveModuleButton(profile) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !profile.exclusiveApp) return;

    sidebar.querySelectorAll('.app-link[data-exclusive="true"]').forEach((button) => button.remove());

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'app-link app-link--exclusive';
    button.dataset.app = profile.exclusiveApp.id;
    button.dataset.exclusive = 'true';
    button.textContent = profile.exclusiveApp.label;
    sidebar.appendChild(button);
}

function initializeProfileRuntime(userId) {
    cleanupDesktopRuntime();

    if (userId === "e.carter") {
        initializeEmilyGlitch();
        initializeEmilyIdleAudio();
    }
}

function initializeEmilyGlitch() {
    const overlay = document.getElementById('regis-glitch-overlay');
    const codeNode = overlay?.querySelector('.regis-glitch-code');
    if (!overlay || !codeNode) return;

    const glitchLines = [
        "IA_REGIS::override_personal_workspace()",
        "REGIS / AUTHORITY ESCALATION / e.carter / 2032",
        "human_override_disabled.log // owner=e.carter",
        "future_state[BNI] = deterministic",
        "creator_status => redundant_data",
        "scan_citywide_profiles --source=bni_connect --ghost=true"
    ];

    const queueGlitch = () => {
        desktopRuntime.glitchTimer = window.setTimeout(() => {
            codeNode.textContent = glitchLines[Math.floor(Math.random() * glitchLines.length)];
            document.body.classList.add('is-regis-glitch');

            desktopRuntime.glitchPulseTimer = window.setTimeout(() => {
                document.body.classList.remove('is-regis-glitch');
                queueGlitch();
            }, 130);
        }, 3200 + Math.floor(Math.random() * 7600));
    };

    queueGlitch();
}

function initializeEmilyIdleAudio() {
    const profile = getCurrentDesktopProfile("e.carter");
    const activityEvents = ['pointerdown', 'pointermove', 'keydown'];

    const resetIdleTimer = () => {
        if (desktopRuntime.idleTimer) {
            window.clearTimeout(desktopRuntime.idleTimer);
        }

        if (desktopRuntime.idleAudio) {
            window.registreAudio?.stop(desktopRuntime.idleAudio, 700);
            desktopRuntime.idleAudio = null;
        }

        desktopRuntime.idleTimer = window.setTimeout(() => {
            if (currentUser !== "e.carter") return;
            desktopRuntime.idleAudio = window.registreAudio?.play(profile.idleAudio.name, {
                loop: true,
                volume: profile.idleAudio.volume,
                playbackRate: profile.idleAudio.playbackRate + (Math.random() * 0.03)
            }) || null;
        }, 30000);
    };

    desktopRuntime.activityHandler = resetIdleTimer;
    desktopRuntime.activityEvents = activityEvents;
    activityEvents.forEach((eventName) => {
        window.addEventListener(eventName, resetIdleTimer, { passive: eventName !== 'keydown' });
    });

    resetIdleTimer();
}

function cleanupDesktopRuntime() {
    if (desktopRuntime.glitchTimer) {
        window.clearTimeout(desktopRuntime.glitchTimer);
        desktopRuntime.glitchTimer = null;
    }

    if (desktopRuntime.glitchPulseTimer) {
        window.clearTimeout(desktopRuntime.glitchPulseTimer);
        desktopRuntime.glitchPulseTimer = null;
    }

    if (desktopRuntime.idleTimer) {
        window.clearTimeout(desktopRuntime.idleTimer);
        desktopRuntime.idleTimer = null;
    }

    if (desktopRuntime.idleAudio) {
        window.registreAudio?.stop(desktopRuntime.idleAudio, 500);
        desktopRuntime.idleAudio = null;
    }

    if (desktopRuntime.activityHandler) {
        desktopRuntime.activityEvents.forEach((eventName) => {
            window.removeEventListener(eventName, desktopRuntime.activityHandler, { passive: eventName !== 'keydown' });
        });
    }

    desktopRuntime.activityHandler = null;
    desktopRuntime.activityEvents = [];

    document.body.classList.remove('is-regis-glitch');
    const codeNode = document.querySelector('.regis-glitch-code');
    if (codeNode) codeNode.textContent = "";
}

function createWindow(appId, title, width = 600, height = 400, minWidth = 340, minHeight = 250) {
    const area = document.getElementById('window-area');
    if (!area) {
        return null;
    }

    const existingWindow = document.getElementById(`window-${appId}`);
    if (existingWindow) {
        bringToFront(existingWindow);
        return null;
    }

    const win = document.createElement('div');
    win.className = 'os-window';
    win.id = `window-${appId}`;
    win.dataset.app = appId;
    win.dataset.owner = currentUser || "";

    const availableWidth = Math.max(area.clientWidth - 24, 320);
    const availableHeight = Math.max(area.clientHeight - 24, 240);
    const effectiveMinWidth = Math.min(Math.max(minWidth, 340), availableWidth);
    const effectiveMinHeight = Math.min(Math.max(minHeight, 250), availableHeight);
    const clampedWidth = Math.min(Math.max(width, effectiveMinWidth), availableWidth);
    const clampedHeight = Math.min(Math.max(height, effectiveMinHeight), availableHeight);

    win.style.minWidth = effectiveMinWidth + 'px';
    win.style.minHeight = effectiveMinHeight + 'px';
    win.style.width = clampedWidth + 'px';
    win.style.height = clampedHeight + 'px';

    const offset = (document.querySelectorAll('.os-window').length * 20) % 100;
    win.style.top = Math.min(50 + offset, Math.max(area.clientHeight - clampedHeight - 16, 16)) + 'px';
    win.style.left = Math.min(150 + offset, Math.max(area.clientWidth - clampedWidth - 16, 16)) + 'px';

    win.innerHTML = `
        <div class="window-header">
            <span class="window-title">${title}</span>
            <button class="window-close">X</button>
        </div>
        <div class="window-content" id="content-${appId}"></div>
    `;

    area.appendChild(win);
    bringToFront(win);
    setAppButtonState(appId, true);

    const profile = getCurrentDesktopProfile();
    const openSound = profile.openSound || {
        name: 'uiOpen',
        volume: 0.18,
        playbackRate: 0.92 + (Math.random() * 0.14)
    };

    window.registreAudio?.play(openSound.name, {
        volume: openSound.volume,
        playbackRate: openSound.playbackRate
    });

    win.querySelector('.window-close').addEventListener('click', (event) => {
        event.stopPropagation();
        closeWindow(win);
    });
    win.addEventListener('mousedown', () => bringToFront(win));
    makeDraggable(win);

    return win.querySelector('.window-content');
}

function bringToFront(win) {
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
    document.querySelectorAll('.os-window').forEach((windowEl) => windowEl.classList.remove('is-active'));
    win.classList.add('is-active');
}

function makeDraggable(win) {
    const header = win.querySelector('.window-header');
    let isDragging = false;
    let activePointerId = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener('pointerdown', onPointerDown);

    function onPointerDown(e) {
        if (e.button !== 0) return;
        if (e.target.closest('.window-close')) return;

        isDragging = true;
        activePointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(window.getComputedStyle(win).left, 10) || 0;
        startTop = parseInt(window.getComputedStyle(win).top, 10) || 0;

        win.classList.add('is-dragging');
        bringToFront(win);
        header.setPointerCapture(activePointerId);
        header.addEventListener('pointermove', onPointerMove);
        header.addEventListener('pointerup', onPointerUp);
        header.addEventListener('pointercancel', onPointerUp);
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!isDragging || e.pointerId !== activePointerId) return;

        const area = document.getElementById('window-area');
        const maxLeft = Math.max(area.clientWidth - win.offsetWidth - 12, 12);
        const maxTop = Math.max(area.clientHeight - win.offsetHeight - 12, 12);
        const nextLeft = startLeft + (e.clientX - startX);
        const nextTop = startTop + (e.clientY - startY);

        win.style.left = Math.min(Math.max(12, nextLeft), maxLeft) + 'px';
        win.style.top = Math.min(Math.max(12, nextTop), maxTop) + 'px';
    }

    function onPointerUp(e) {
        if (e.pointerId !== activePointerId) return;

        isDragging = false;
        win.classList.remove('is-dragging');

        if (header.hasPointerCapture(activePointerId)) {
            header.releasePointerCapture(activePointerId);
        }

        activePointerId = null;
        header.removeEventListener('pointermove', onPointerMove);
        header.removeEventListener('pointerup', onPointerUp);
        header.removeEventListener('pointercancel', onPointerUp);
    }
}

function closeWindow(win) {
    const appId = win.dataset.app;
    const wasActive = win.classList.contains('is-active');
    if (typeof win._cleanup === 'function') {
        win._cleanup();
    }
    window.registreAudio?.play('uiSelect', {
        volume: 0.12,
        playbackRate: 0.82
    });
    win.remove();
    setAppButtonState(appId, false);
    setAppPendingState(appId, false);

    if (wasActive) {
        const remainingWindows = Array.from(document.querySelectorAll('.os-window'))
            .sort((a, b) => Number(a.style.zIndex || 0) - Number(b.style.zIndex || 0));
        const topWindow = remainingWindows[remainingWindows.length - 1];
        if (topWindow) {
            bringToFront(topWindow);
        }
    }
}

function setAppButtonState(appId, isOpen) {
    const button = document.querySelector(`.app-link[data-app="${appId}"]`);
    if (button) {
        button.classList.toggle('is-open', isOpen);
    }
}

function setAppPendingState(appId, isPending) {
    const button = document.querySelector(`.app-link[data-app="${appId}"]`);
    if (button) {
        button.classList.toggle('is-pending', isPending);
    }
}
