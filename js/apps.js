document.addEventListener("DOMContentLoaded", () => {
    
    const appButtons = document.querySelectorAll('.app-link');
    
    appButtons.forEach((btn) => {
        btn.addEventListener('click', () => launchApp(btn.dataset.app));
    });

    function launchApp(appId) {
        const userData = vmData[currentUser]; 
        let contentContainer;

        switch(appId) {
            case 'explorer':
                contentContainer = createWindow('explorer', `${userData.rootFolder}`, 760, 500);
                if(contentContainer) renderSplitView(contentContainer, userData.explorer, 'name', 'type', 'content');
                break;
            case 'messages':
                contentContainer = createWindow('messages', `Messagerie Interne - ${currentUser}`, 650, 400);
                if(contentContainer) renderSplitView(contentContainer, userData.messages, 'from', 'date', 'content', true);
                break;
            case 'logs':
                contentContainer = createWindow('logs', `Journaux d'Activité`, 600, 350);
                if(contentContainer) renderSplitView(contentContainer, userData.logs, 'id', 'date', 'content');
                break;
            case 'synthesis':
                contentContainer = createWindow('synthesis', `Aperçu Document - ${userData.synthesis.title}`, 920, 680);
                if(contentContainer) renderDocument(contentContainer, userData.synthesis);
                break;
            case 'terminal':
                contentContainer = createWindow('terminal', `C:\\Windows\\System32\\cmd.exe - Interface Restreinte`, 550, 350);
                if(contentContainer) renderTerminal(contentContainer, userData);
                break;
        }
    }

    function renderSplitView(container, dataArray, titleKey, metaKey, contentKey, isMessage = false) {
        container.innerHTML = `
            <div class="split-view">
                <div class="list-pane"></div>
                <div class="detail-pane">Sélectionnez une entrée pour afficher le contenu.</div>
            </div>
        `;

        container.tabIndex = -1;
        const listPane = container.querySelector('.list-pane');
        const detailPane = container.querySelector('.detail-pane');
        let slideshowController = null;
        let firstSelect = null;

        container.addEventListener('keydown', (event) => {
            if (!slideshowController) return;
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                slideshowController.prev();
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                slideshowController.next();
            }
        });

        dataArray.forEach((item) => {
            const div = document.createElement('div');
            div.className = `list-item type-${item.type || 'entry'}`;
            div.tabIndex = 0;

            let displayTitle = item[titleKey];
            if (isMessage) displayTitle = `De: ${item[titleKey]}`;

            const typeLabel = isMessage ? 'message' : (item.type || 'entrée');
            const metaLabel = item[metaKey] || item.summary || '';

            div.innerHTML = `
                <div class="item-row">
                    <div class="item-title">${escapeHTML(displayTitle)}</div>
                    <div class="item-tag">${escapeHTML(typeLabel)}</div>
                </div>
                <div class="item-meta">${escapeHTML(metaLabel)}</div>
            `;

            const selectItem = (playSound = true) => {
                listPane.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                detailPane.scrollTop = 0;

                if (playSound) {
                    window.registreAudio?.play('uiSelect', {
                        volume: 0.08,
                        playbackRate: 0.96 + (Math.random() * 0.08)
                    });
                }
                
                if (item.type === "slideshow") {
                    expandWindowForSlideshow(container);
                    let currentSlide = 0;

                    const moveSlide = (direction) => {
                        if (direction === 'next') {
                            currentSlide = (currentSlide < item.slides.length - 1) ? currentSlide + 1 : 0;
                            window.registreAudio?.play('regisNext', {
                                volume: 0.4,
                                playbackRate: 0.96 + (Math.random() * 0.05)
                            });
                        } else {
                            currentSlide = (currentSlide > 0) ? currentSlide - 1 : item.slides.length - 1;
                            window.registreAudio?.play('uiSelect', {
                                volume: 0.12,
                                playbackRate: 0.8
                            });
                        }

                        renderSlide();
                        container.focus();
                    };

                    const renderSlide = () => {
                        const slide = item.slides[currentSlide];
                        const progressWidth = ((currentSlide + 1) / item.slides.length) * 100;

                        detailPane.innerHTML = `
                            <div class="slideshow-container" style="--status-color: ${slide.color};">
                                <div class="slideshow-topbar">
                                    <div>
                                        <div class="regis-kicker">Autonomous Classification Layer</div>
                                        <div class="regis-title">REGIS_RECRUTEMENT_OVERRIDE.exe</div>
                                    </div>
                                    <div class="regis-sequence">Séquence ${(currentSlide + 1).toString().padStart(2, '0')} / ${item.slides.length.toString().padStart(2, '0')}</div>
                                </div>
                                <div class="slideshow-grid">
                                    <section class="slide-profile">
                                        <div class="slide-target">CIBLE ${(currentSlide + 1).toString().padStart(2, '0')}</div>
                                        <div class="slide-name">${escapeHTML(slide.name)}</div>
                                        <div class="slide-status">${escapeHTML(slide.status)}</div>
                                        <div class="slide-desc">${formatMultiline(slide.desc)}</div>
                                    </section>
                                    <aside class="slide-sidepanel">
                                        <div class="regis-panel">
                                            <div class="regis-panel-label">Identité</div>
                                            <div class="regis-panel-value">${escapeHTML(slide.name)}</div>
                                        </div>
                                        <div class="regis-panel">
                                            <div class="regis-panel-label">Statut modèle</div>
                                            <div class="regis-panel-value regis-panel-value--status">${escapeHTML(slide.status)}</div>
                                        </div>
                                        <div class="regis-panel">
                                            <div class="regis-panel-label">Extrait</div>
                                            <div class="regis-panel-copy">${formatMultiline(slide.desc)}</div>
                                        </div>
                                    </aside>
                                </div>
                                <div class="slide-footer">
                                    <div class="slide-progress">
                                        <div class="slide-progress-label">Progression de séquence</div>
                                        <div class="slide-progress-bar"><span style="width: ${progressWidth}%;"></span></div>
                                        <div class="slide-help">Navigation clavier : fleches gauche / droite</div>
                                    </div>
                                    <div class="slide-controls">
                                        <button class="slide-btn" type="button" data-regis-nav="prev">◀ Précédent</button>
                                        <button class="slide-btn" type="button" data-regis-nav="next">Suivant ▶</button>
                                    </div>
                                </div>
                            </div>
                        `;

                        detailPane.querySelector('[data-regis-nav="prev"]').addEventListener('click', () => {
                            moveSlide('prev');
                        });

                        detailPane.querySelector('[data-regis-nav="next"]').addEventListener('click', () => {
                            moveSlide('next');
                        });
                    };

                    detailPane.classList.add('is-slideshow');
                    slideshowController = {
                        prev: () => moveSlide('prev'),
                        next: () => moveSlide('next')
                    };

                    renderSlide();
                    container.focus();
                } else {
                    detailPane.classList.remove('is-slideshow');
                    slideshowController = null;

                    const textToDisplay = item[contentKey];
                    if (item.type === "corrupt" || item.type === "deleted") {
                        detailPane.innerHTML = `<div class="system-warning">[ERREUR SYSTÈME] ${escapeHTML(textToDisplay)}</div>`;
                    } else if (isMessage) {
                        detailPane.innerHTML = `
                            <div class="message-detail">
                                <div class="message-header">
                                    <div class="message-row"><strong>De</strong><span>${escapeHTML(item.from)}</span></div>
                                    <div class="message-row"><strong>À</strong><span>${escapeHTML(item.to)}</span></div>
                                    <div class="message-row"><strong>Date</strong><span>${escapeHTML(item.date)}</span></div>
                                </div>
                                <div class="message-copy">${formatMultiline(textToDisplay)}</div>
                            </div>
                        `;
                    } else {
                        detailPane.innerHTML = `<div class="detail-body">${formatMultiline(textToDisplay)}</div>`;
                    }

                    resizeWindowForContent(container, textToDisplay, {
                        isMessage,
                        type: item.type || '',
                        itemCount: dataArray.length
                    });
                }
            };

            div.addEventListener('click', () => selectItem(true));
            div.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectItem(true);
                }
            });

            listPane.appendChild(div);

            if (!firstSelect) {
                firstSelect = () => {
                    selectItem(false);
                    div.focus();
                };
            }
        });

        if (firstSelect) {
            firstSelect();
        }
    }

    function renderDocument(container, synthData) {
        container.innerHTML = `
            <div class="doc-view">
                <div class="doc-kicker">Aperçu document</div>
                <div class="doc-title">${synthData.title}</div>
                <div class="doc-subject">Objet : ${synthData.subject}</div>
                <div class="doc-body">${synthData.content}</div>
            </div>
        `;
    }

    function renderTerminal(container, userData) {
        container.classList.add('terminal-window');
        container.innerHTML = `
            <div class="terminal-chrome">
                <span>PROJET REGISTRE - OS v4.02</span>
                <span>SESSION ${currentUser.toUpperCase()}</span>
            </div>
            <div class="terminal-output">PROJET REGISTRE - OS v4.02
Droit d'accès : ADMINISTRATIF.
Tapez 'help' pour la liste des commandes.
</div>
            <div class="terminal-input-line">
                <span class="terminal-prompt">></span>
                <input type="text" class="terminal-input" autocomplete="off" spellcheck="false" placeholder="Entrer une commande">
            </div>
        `;

        const outputDiv = container.querySelector('.terminal-output');
        const inputField = container.querySelector('.terminal-input');

        inputField.focus();
        container.addEventListener('click', () => inputField.focus());

        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = inputField.value.trim().toLowerCase();
                inputField.value = "";
                outputDiv.textContent += `\n> ${command}\n`;

                let response = "";
                if (command === "help") response = "Commandes disponibles : list, open [fichier], status, users, logs";
                else if (command === "status") response = userData.terminal.status || "Statut non disponible.";
                else if (command === "logs") response = userData.terminal.logs || "Aucune alerte critique.";
                else if (command === "users") response = userData.terminal.users || "Accès restreint.";
                else if (command === "list") response = userData.terminal.list || "Utilisez l'Explorateur pour lister l'arborescence.";
                else if (command === "truth") {
                    response = userData.terminal.truth || "Commande non reconnue. Tentative consignée.";
                }
                else if (command.startsWith("open")) response = "Erreur : Ouverture via terminal restreinte. Utilisez l'Explorateur.";
                else if (command !== "") response = "Commande non reconnue. Tentative consignée.";

                if (response) outputDiv.textContent += `${response}\n`;
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
        });
    }

    function expandWindowForSlideshow(container) {
        const area = document.getElementById('window-area');
        if (!area) return;

        const targetWidth = Math.min(Math.max(Math.floor(area.clientWidth * 0.92), 960), area.clientWidth - 24);
        const targetHeight = Math.min(Math.max(Math.floor(area.clientHeight * 0.9), 680), area.clientHeight - 24);
        resizeWindow(container, targetWidth, targetHeight);
    }

    function resizeWindowForContent(container, textContent, options = {}) {
        const area = document.getElementById('window-area');
        if (!area) return;
        const win = container.closest('.os-window');
        const appId = win?.dataset.app || '';

        const normalizedLength = String(textContent || '').replace(/\s+/g, ' ').trim().length;
        const isMessage = options.isMessage === true;
        const type = options.type || '';
        const itemCount = options.itemCount || 0;

        let targetWidth = 720;
        let targetHeight = 460;

        if (type === 'document' || type === 'spreadsheet' || type === 'markdown') {
            if (normalizedLength <= 180) {
                targetWidth = 860;
                targetHeight = 520;
            } else if (normalizedLength <= 500) {
                targetWidth = 920;
                targetHeight = 620;
            } else {
                targetWidth = 980;
                targetHeight = 700;
            }
        } else if (type === 'corrupt' || type === 'deleted') {
            targetWidth = 600;
            targetHeight = 360;
        } else if (normalizedLength <= 120) {
            targetWidth = isMessage ? 680 : 620;
            targetHeight = isMessage ? 420 : 360;
        } else if (normalizedLength <= 320) {
            targetWidth = isMessage ? 760 : 700;
            targetHeight = isMessage ? 470 : 430;
        } else if (normalizedLength <= 700) {
            targetWidth = isMessage ? 820 : 780;
            targetHeight = isMessage ? 540 : 500;
        } else {
            targetWidth = isMessage ? 900 : 860;
            targetHeight = isMessage ? 620 : 560;
        }

        if (!isMessage && itemCount <= 5) {
            targetWidth -= 20;
        }

        if (appId === 'explorer') {
            targetWidth = Math.max(targetWidth, 820);
            targetHeight = Math.max(targetHeight, 460);
        }

        resizeWindow(container, targetWidth, targetHeight);
    }

    function resizeWindow(container, targetWidth, targetHeight) {
        const win = container.closest('.os-window');
        const area = document.getElementById('window-area');
        if (!win || !area) return;

        const clampedWidth = Math.min(Math.max(targetWidth, 340), area.clientWidth - 24);
        const clampedHeight = Math.min(Math.max(targetHeight, 250), area.clientHeight - 24);

        const currentLeft = parseInt(win.style.left, 10) || 12;
        const currentTop = parseInt(win.style.top, 10) || 12;
        const centerX = currentLeft + (win.offsetWidth / 2);
        const centerY = currentTop + (win.offsetHeight / 2);
        const maxLeft = Math.max(area.clientWidth - clampedWidth - 12, 12);
        const maxTop = Math.max(area.clientHeight - clampedHeight - 12, 12);

        const nextLeft = Math.min(Math.max(Math.round(centerX - (clampedWidth / 2)), 12), maxLeft);
        const nextTop = Math.min(Math.max(Math.round(centerY - (clampedHeight / 2)), 12), maxTop);

        win.style.width = clampedWidth + 'px';
        win.style.height = clampedHeight + 'px';
        win.style.left = nextLeft + 'px';
        win.style.top = nextTop + 'px';
        bringToFront(win);
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatMultiline(value) {
        return escapeHTML(value).replace(/\n/g, '<br>');
    }
});
