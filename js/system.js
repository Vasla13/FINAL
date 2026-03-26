let currentUser = null;
let zIndexCounter = 100;

document.addEventListener("DOMContentLoaded", () => {
    const activeUser = sessionStorage.getItem('registre_active_user');
    const displayName = sessionStorage.getItem('registre_display_name');

    if (!activeUser || typeof vmData === 'undefined' || !vmData[activeUser]) {
        window.location.href = "index.html";
        return;
    }

    currentUser = activeUser;
    
    document.getElementById('current-user-display').textContent = `UTILISATEUR : ${displayName.toUpperCase()} [${vmData[currentUser].role}]`;

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        document.getElementById('window-area').innerHTML = "";
        document.getElementById('system-status').textContent = "FERMETURE DE SESSION...";
        setTimeout(() => { window.location.href = "index.html"; }, 800);
    });
});

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
    window.registreAudio?.play('uiOpen', {
        volume: 0.18,
        playbackRate: 0.92 + (Math.random() * 0.14)
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
    window.registreAudio?.play('uiSelect', {
        volume: 0.12,
        playbackRate: 0.82
    });
    win.remove();
    setAppButtonState(appId, false);

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
