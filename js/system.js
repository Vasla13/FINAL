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
        deskNotes: [
            "APPELER\nLA COMPTA",
            "OU EST PASSE\nLE BUDGET FIBRE ??",
            "RELANCER NOAH\nPOUR LES TASSES"
        ],
        windowOpenDelayMs: 520,
        notificationMessages: [
            "Alerte : Depassement budget serveur R.E.G.I.S.",
            "Rappel : Facture electricite Station 3 impayee.",
            "Alerte Systeme : Espace disque C: insuffisant."
        ]
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
        selectSound: {
            name: "uiSelectRegis",
            volume: 0.11,
            playbackRate: 0.82
        },
        hasRegisGlitch: true,
        idleAudio: {
            name: "emilyIdle",
            volume: 0.042,
            playbackRate: 0.96
        },
        dreadDurationMs: 180000,
        dreadMaxOpacity: 0.5
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
    unloadBound: false,
    notificationTimer: null,
    cursorTrailRAF: null,
    cursorTrailHandler: null,
    cursorTrailNodes: [],
    tooltipTimer: null,
    tooltipHandlers: [],
    activeTooltipTarget: null,
    parallaxHandler: null,
    dreadFrame: null,
    dreadStartTime: 0
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
    renderDeskNote(profile.deskNotes || profile.desktopNote || "");
    renderDeskIndicator(profile);
    renderEmilyCodefield(userId === "e.carter");
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

    if (!document.getElementById('desk-rec-indicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'desk-rec-indicator';
        indicator.hidden = true;
        indicator.innerHTML = `<span class="desk-rec-dot"></span><span class="desk-rec-text">REC</span>`;
        windowArea.appendChild(indicator);
    }

    if (!document.getElementById('emily-codefield')) {
        const codefield = document.createElement('div');
        codefield.id = 'emily-codefield';
        codefield.hidden = true;
        codefield.setAttribute('aria-hidden', 'true');
        codefield.innerHTML = Array.from({ length: 14 }, (_, index) => {
            const seed = (index + 1).toString(16).padStart(2, '0').toUpperCase();
            return `<div class="emily-code-line">0x${seed}A3FF :: 7E 01 9C D2 44 8B C1 EF / REGIS / DETERMINISTIC / TRACK ${seed}</div>`;
        }).join('');
        windowArea.appendChild(codefield);
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

    if (!document.getElementById('system-notification-stack')) {
        const stack = document.createElement('div');
        stack.id = 'system-notification-stack';
        stack.hidden = true;
        osContainer.appendChild(stack);
    }

    if (!document.getElementById('cursor-trail-layer')) {
        const trailLayer = document.createElement('div');
        trailLayer.id = 'cursor-trail-layer';
        trailLayer.hidden = true;
        osContainer.appendChild(trailLayer);
    }

    if (!document.getElementById('madison-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'madison-tooltip';
        tooltip.hidden = true;
        osContainer.appendChild(tooltip);
    }

    if (!document.getElementById('emily-dread-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'emily-dread-overlay';
        overlay.hidden = true;
        osContainer.appendChild(overlay);
    }
}

function renderDeskNote(noteText) {
    const note = document.getElementById('desk-note');
    if (!note) return;

    const notes = Array.isArray(noteText)
        ? noteText.filter(Boolean)
        : (noteText ? [noteText] : []);

    note.innerHTML = notes.map((content, index) => `
        <div class="desk-note-card desk-note-card--${index + 1}">${content}</div>
    `).join('');
    note.hidden = notes.length === 0;
}

function renderDeskIndicator(profile) {
    const indicator = document.getElementById('desk-rec-indicator');
    if (!indicator) return;

    indicator.hidden = true;
}

function renderEmilyCodefield(isVisible) {
    const codefield = document.getElementById('emily-codefield');
    if (!codefield) return;

    codefield.hidden = !isVisible;
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

    if (userId === "o.reynolds") {
        initializeOliviaNotifications();
        initializeOliviaCursorTrail();
    }

    if (userId === "m.brooks") {
        initializeMadisonTooltips();
        initializeMadisonParallax();
    }

    if (userId === "e.carter") {
        initializeEmilyGlitch();
        initializeEmilyIdleAudio();
        initializeEmilyDread();
    }
}

function initializeOliviaNotifications() {
    const profile = getCurrentDesktopProfile("o.reynolds");
    const stack = document.getElementById('system-notification-stack');
    if (!stack || !Array.isArray(profile.notificationMessages)) return;

    stack.hidden = false;

    const queueNotification = () => {
        desktopRuntime.notificationTimer = window.setTimeout(() => {
            if (currentUser !== "o.reynolds") return;
            spawnOliviaNotification(profile.notificationMessages);
            queueNotification();
        }, 30000 + Math.floor(Math.random() * 10000));
    };

    queueNotification();
}

function spawnOliviaNotification(messages) {
    const stack = document.getElementById('system-notification-stack');
    if (!stack || !messages.length) return;

    const message = messages[Math.floor(Math.random() * messages.length)];
    const item = document.createElement('section');
    item.className = 'system-notification';
    item.innerHTML = `
        <div class="system-notification-kicker">BNI INTERNAL ALERT</div>
        <div class="system-notification-copy">${message}</div>
        <button type="button" class="system-notification-close" aria-label="Fermer notification">X</button>
    `;

    item.querySelector('.system-notification-close')?.addEventListener('click', () => {
        item.remove();
    });

    stack.appendChild(item);
}

function initializeOliviaCursorTrail() {
    const trailLayer = document.getElementById('cursor-trail-layer');
    if (!trailLayer) return;

    trailLayer.hidden = false;
    trailLayer.innerHTML = "";

    const trailPoints = Array.from({ length: 5 }, () => ({ x: -24, y: -24 }));
    desktopRuntime.cursorTrailNodes = trailPoints.map((_, index) => {
        const node = document.createElement('span');
        node.className = 'cursor-trail-node';
        node.style.setProperty('--trail-scale', (1 - (index * 0.12)).toFixed(2));
        node.style.setProperty('--trail-opacity', (0.34 - (index * 0.05)).toFixed(2));
        trailLayer.appendChild(node);
        return node;
    });

    let targetX = -24;
    let targetY = -24;
    let hasPointer = false;

    const onPointerMove = (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        hasPointer = true;
    };

    const renderTrail = () => {
        if (hasPointer) {
            trailPoints.forEach((point, index) => {
                const anchor = index === 0 ? { x: targetX, y: targetY } : trailPoints[index - 1];
                const ease = 0.26 - (index * 0.03);
                point.x += (anchor.x - point.x) * Math.max(ease, 0.08);
                point.y += (anchor.y - point.y) * Math.max(ease, 0.08);

                const node = desktopRuntime.cursorTrailNodes[index];
                if (node) {
                    node.style.transform = `translate(${(point.x - 7).toFixed(1)}px, ${(point.y - 7).toFixed(1)}px) scale(var(--trail-scale))`;
                }
            });
        }

        desktopRuntime.cursorTrailRAF = window.requestAnimationFrame(renderTrail);
    };

    desktopRuntime.cursorTrailHandler = onPointerMove;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    renderTrail();
}

function initializeMadisonTooltips() {
    const tooltip = document.getElementById('madison-tooltip');
    if (!tooltip) return;

    const showTooltip = (target) => {
        const message = getMadisonTooltipMessage(target);
        if (!message) return;

        const rect = target.getBoundingClientRect();
        const horizontalCenter = rect.left + (rect.width / 2);

        tooltip.textContent = message;
        tooltip.style.left = `${Math.min(Math.max(horizontalCenter, 30), window.innerWidth - 30)}px`;
        tooltip.style.top = `${Math.max(rect.top, 24)}px`;
        tooltip.hidden = false;
        tooltip.classList.add('is-visible');
        desktopRuntime.activeTooltipTarget = target;
    };

    const hideTooltip = () => {
        if (desktopRuntime.tooltipTimer) {
            window.clearTimeout(desktopRuntime.tooltipTimer);
            desktopRuntime.tooltipTimer = null;
        }
        desktopRuntime.activeTooltipTarget = null;
        tooltip.classList.remove('is-visible');
        tooltip.hidden = true;
    };

    const scheduleTooltip = (target) => {
        hideTooltip();
        desktopRuntime.tooltipTimer = window.setTimeout(() => {
            desktopRuntime.tooltipTimer = null;
            showTooltip(target);
        }, 620);
    };

    const onPointerOver = (event) => {
        const target = event.target.closest('button, .app-link');
        if (!target || target.closest('#system-notification-stack')) return;
        scheduleTooltip(target);
    };

    const onPointerOut = (event) => {
        const target = event.target.closest('button, .app-link');
        if (!target) return;
        if (event.relatedTarget && target.contains(event.relatedTarget)) return;
        if (desktopRuntime.activeTooltipTarget === target || desktopRuntime.tooltipTimer) {
            hideTooltip();
        }
    };

    const onPointerDown = () => hideTooltip();

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('pointerdown', onPointerDown);

    desktopRuntime.tooltipHandlers = [
        ['pointerover', onPointerOver],
        ['pointerout', onPointerOut],
        ['pointerdown', onPointerDown]
    ];
}

function getMadisonTooltipMessage(target) {
    if (!target) return "";
    if (target.matches('.window-close')) return "[Action détectée : Comportement d'évitement / Fuite]";
    if (target.matches('#logout-btn')) return "[Action détectée : Désengagement / Rupture de session]";

    const appId = target.dataset.app;
    if (appId === 'explorer') return "[Action détectée : Curiosité exploratoire active]";
    if (appId === 'messages') return "[Action détectée : Recherche de validation interpersonnelle]";
    if (appId === 'logs') return "[Action détectée : Compulsion de traçabilité]";
    if (appId === 'synthesis') return "[Action détectée : Besoin de narration cohérente]";
    if (appId === 'terminal') return "[Action détectée : Contrôle direct / Contournement méthodique]";
    if (appId === 'camera') return "[Action détectée : Fixation sur la surveillance passive]";

    if (target.matches('.slide-btn[data-regis-nav="next"]')) return "[Action détectée : Projection vers la cible suivante]";
    if (target.matches('.slide-btn[data-regis-nav="prev"]')) return "[Action détectée : Relecture compulsive / Retour sur indice]";
    if (target.matches('.terminal-gate-replay')) return "[Action détectée : Vérification anxieuse répétée]";

    return "[Action détectée : Interaction instrumentale sous observation]";
}

function initializeMadisonParallax() {
    const windowArea = document.getElementById('window-area');
    if (!windowArea) return;

    const onPointerMove = (event) => {
        const offsetX = ((window.innerWidth / 2) - event.clientX) / window.innerWidth;
        const offsetY = ((window.innerHeight / 2) - event.clientY) / window.innerHeight;
        windowArea.style.setProperty('--madison-parallax-x', `${(offsetX * 6).toFixed(2)}px`);
        windowArea.style.setProperty('--madison-parallax-y', `${(offsetY * 4).toFixed(2)}px`);
    };

    desktopRuntime.parallaxHandler = onPointerMove;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    onPointerMove({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
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
            }, 110);
        }, 15000 + Math.floor(Math.random() * 5000));
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

function initializeEmilyDread() {
    const overlay = document.getElementById('emily-dread-overlay');
    const profile = getCurrentDesktopProfile("e.carter");
    if (!overlay) return;

    overlay.hidden = false;
    overlay.style.opacity = '0';
    desktopRuntime.dreadStartTime = Date.now();

    const tick = () => {
        if (currentUser !== "e.carter") return;

        const elapsed = Date.now() - desktopRuntime.dreadStartTime;
        const progress = Math.min(elapsed / (profile.dreadDurationMs || 180000), 1);
        overlay.style.opacity = String(progress * (profile.dreadMaxOpacity || 0.5));

        if (progress < 1) {
            desktopRuntime.dreadFrame = window.requestAnimationFrame(tick);
        }
    };

    desktopRuntime.dreadFrame = window.requestAnimationFrame(tick);
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

    if (desktopRuntime.notificationTimer) {
        window.clearTimeout(desktopRuntime.notificationTimer);
        desktopRuntime.notificationTimer = null;
    }

    if (desktopRuntime.cursorTrailRAF) {
        window.cancelAnimationFrame(desktopRuntime.cursorTrailRAF);
        desktopRuntime.cursorTrailRAF = null;
    }

    if (desktopRuntime.cursorTrailHandler) {
        window.removeEventListener('pointermove', desktopRuntime.cursorTrailHandler);
        desktopRuntime.cursorTrailHandler = null;
    }

    if (desktopRuntime.dreadFrame) {
        window.cancelAnimationFrame(desktopRuntime.dreadFrame);
        desktopRuntime.dreadFrame = null;
    }

    if (desktopRuntime.activityHandler) {
        desktopRuntime.activityEvents.forEach((eventName) => {
            window.removeEventListener(eventName, desktopRuntime.activityHandler, { passive: eventName !== 'keydown' });
        });
    }

    desktopRuntime.activityHandler = null;
    desktopRuntime.activityEvents = [];
    desktopRuntime.cursorTrailNodes = [];

    desktopRuntime.tooltipHandlers.forEach(([eventName, handler]) => {
        document.removeEventListener(eventName, handler);
    });
    desktopRuntime.tooltipHandlers = [];

    if (desktopRuntime.tooltipTimer) {
        window.clearTimeout(desktopRuntime.tooltipTimer);
        desktopRuntime.tooltipTimer = null;
    }

    desktopRuntime.activeTooltipTarget = null;

    if (desktopRuntime.parallaxHandler) {
        window.removeEventListener('pointermove', desktopRuntime.parallaxHandler);
        desktopRuntime.parallaxHandler = null;
    }

    document.body.classList.remove('is-regis-glitch');
    const codeNode = document.querySelector('.regis-glitch-code');
    if (codeNode) codeNode.textContent = "";

    const notificationStack = document.getElementById('system-notification-stack');
    if (notificationStack) {
        notificationStack.innerHTML = "";
        notificationStack.hidden = true;
    }

    const trailLayer = document.getElementById('cursor-trail-layer');
    if (trailLayer) {
        trailLayer.innerHTML = "";
        trailLayer.hidden = true;
    }

    const tooltip = document.getElementById('madison-tooltip');
    if (tooltip) {
        tooltip.classList.remove('is-visible');
        tooltip.hidden = true;
        tooltip.textContent = "";
    }

    const windowArea = document.getElementById('window-area');
    if (windowArea) {
        windowArea.style.removeProperty('--madison-parallax-x');
        windowArea.style.removeProperty('--madison-parallax-y');
    }

    const dreadOverlay = document.getElementById('emily-dread-overlay');
    if (dreadOverlay) {
        dreadOverlay.hidden = true;
        dreadOverlay.style.opacity = '0';
    }
}

function playProfileSelectSound(options = {}) {
    const profile = getCurrentDesktopProfile();
    const selectSound = profile.selectSound || {
        name: 'uiSelect',
        volume: 0.12,
        playbackRate: 0.82
    };

    window.registreAudio?.play(selectSound.name, {
        volume: typeof options.volume === 'number' ? options.volume : selectSound.volume,
        playbackRate: typeof options.playbackRate === 'number' ? options.playbackRate : selectSound.playbackRate
    });
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
    playProfileSelectSound();
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
