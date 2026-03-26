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

    function updateOSTime() {
        const now = new Date();
        document.getElementById('os-time').textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
    setInterval(updateOSTime, 1000);
    updateOSTime();

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        document.getElementById('window-area').innerHTML = "";
        document.getElementById('system-status').textContent = "FERMETURE DE SESSION...";
        setTimeout(() => { window.location.href = "index.html"; }, 800);
    });
});

function createWindow(appId, title, width = 600, height = 400) {
    const area = document.getElementById('window-area');
    if (document.getElementById(`window-${appId}`)) {
        bringToFront(document.getElementById(`window-${appId}`));
        return null; 
    }

    const win = document.createElement('div');
    win.className = 'os-window';
    win.id = `window-${appId}`;
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    
    const offset = (document.querySelectorAll('.os-window').length * 20) % 100;
    win.style.top = (50 + offset) + 'px';
    win.style.left = (150 + offset) + 'px';

    win.innerHTML = `
        <div class="window-header">
            <span class="window-title">${title}</span>
            <button class="window-close">X</button>
        </div>
        <div class="window-content" id="content-${appId}"></div>
    `;

    area.appendChild(win);
    bringToFront(win);

    win.querySelector('.window-close').addEventListener('click', () => win.remove());
    win.addEventListener('mousedown', () => bringToFront(win));
    makeDraggable(win);

    return win.querySelector('.window-content');
}

function bringToFront(win) {
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
}

function makeDraggable(win) {
    const header = win.querySelector('.window-header');
    let isDragging = false, startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(window.getComputedStyle(win).left, 10) || 0;
        startTop = parseInt(window.getComputedStyle(win).top, 10) || 0;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        win.style.left = startLeft + (e.clientX - startX) + 'px';
        win.style.top = startTop + (e.clientY - startY) + 'px';
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}