document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const pendingLaunches = new Set();
    const profileConfig = window.registreDesktopProfiles?.[currentUser] || {};
    const profileExclusiveApps = {
        "n.bennett": {
            id: "compliance",
            title: "Console de Conformité Bureau",
            width: 780,
            height: 560,
            minWidth: 740,
            minHeight: 520,
            render: renderComplianceConsole
        },
        "o.reynolds": {
            id: "trash",
            title: "Corbeille - 29/06/2032",
            width: 860,
            height: 560,
            minWidth: 800,
            minHeight: 520,
            render: renderTrashBin
        },
        "m.brooks": {
            id: "camera",
            title: "Flux Caméra - Station 02",
            width: 960,
            height: 620,
            minWidth: 900,
            minHeight: 580,
            render: renderCameraFeed
        },
        "e.carter": {
            id: "regis-monitor",
            title: "Moniteur R.E.G.I.S. - Processus Autonome",
            width: 1020,
            height: 700,
            minWidth: 960,
            minHeight: 640,
            render: renderRegisMonitor
        }
    };

    function updateLoadingState() {
        document.body.classList.toggle('is-app-loading', pendingLaunches.size > 0);
    }

    function playUiSelect(options = {}) {
        const selectSound = profileConfig.selectSound || {
            name: 'uiSelect',
            volume: 0.1,
            playbackRate: 0.92
        };

        window.registreAudio?.play(selectSound.name, {
            volume: typeof options.volume === 'number' ? options.volume : selectSound.volume,
            playbackRate: typeof options.playbackRate === 'number' ? options.playbackRate : selectSound.playbackRate
        });
    }

    sidebar?.addEventListener('click', (event) => {
        const button = event.target.closest('.app-link');
        if (!button) return;
        launchApp(button.dataset.app);
    });

    sidebar?.addEventListener('keydown', (event) => {
        const button = event.target.closest('.app-link');
        if (!button) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            launchApp(button.dataset.app);
        }
    });

    function launchApp(appId) {
        if (!appId || pendingLaunches.has(appId)) return;

        const existingWindow = document.getElementById(`window-${appId}`);
        if (existingWindow) {
            bringToFront(existingWindow);
            return;
        }

        const delayMs = profileConfig.windowOpenDelayMs || 0;
        if (delayMs > 0) {
            pendingLaunches.add(appId);
            setAppPendingState(appId, true);
            updateLoadingState();
            window.setTimeout(() => {
                pendingLaunches.delete(appId);
                setAppPendingState(appId, false);
                updateLoadingState();
                openApp(appId);
            }, delayMs);
            return;
        }

        openApp(appId);
    }

    function openApp(appId) {
        const userData = vmData[currentUser];
        const exclusiveApp = profileExclusiveApps[currentUser];
        let contentContainer;

        switch(appId) {
            case 'explorer':
                contentContainer = createWindow('explorer', `${userData.rootFolder}`, 880, 560, 820, 500);
                if(contentContainer) renderSplitView(contentContainer, userData.explorer, 'name', 'type', 'content');
                break;
            case 'messages':
                contentContainer = createWindow('messages', `Messagerie Interne - ${currentUser}`, 800, 520, 740, 480);
                if(contentContainer) renderSplitView(contentContainer, userData.messages, 'from', 'date', 'content', true);
                break;
            case 'logs':
                contentContainer = createWindow('logs', `Journaux d'Activité`, 760, 460, 700, 420);
                if(contentContainer) renderSplitView(contentContainer, userData.logs, 'id', 'date', 'content');
                break;
            case 'synthesis':
                contentContainer = createWindow('synthesis', `Aperçu Document - ${userData.synthesis.title}`, 980, 720, 940, 680);
                if(contentContainer) renderDocument(contentContainer, userData.synthesis);
                break;
            case 'terminal':
                contentContainer = createWindow('terminal', `C:\\Windows\\System32\\cmd.exe - Interface Restreinte`, 780, 540, 720, 500);
                if(contentContainer) renderTerminal(contentContainer, userData);
                break;
            default:
                if (exclusiveApp && appId === exclusiveApp.id) {
                    contentContainer = createWindow(
                        exclusiveApp.id,
                        exclusiveApp.title,
                        exclusiveApp.width,
                        exclusiveApp.height,
                        exclusiveApp.minWidth,
                        exclusiveApp.minHeight
                    );
                    if (contentContainer) exclusiveApp.render(contentContainer, userData);
                }
                break;
        }
    }

    function renderSplitView(container, dataArray, titleKey, metaKey, contentKey, isMessage = false) {
        const appId = container.closest('.os-window')?.dataset.app || '';
        const win = container.closest('.os-window');
        if (appId === 'explorer') setWindowMinimumSize(container, 820, 500);
        if (appId === 'messages') setWindowMinimumSize(container, 740, 480);
        if (appId === 'logs') setWindowMinimumSize(container, 700, 420);

        container.innerHTML = `
            <div class="split-view">
                <div class="list-pane"></div>
                <div class="detail-pane">Sélectionnez une entrée pour afficher le contenu.</div>
            </div>
        `;

        container.tabIndex = -1;
        const listPane = container.querySelector('.list-pane');
        const detailPane = container.querySelector('.detail-pane');
        const presentation = prepareSplitViewItems(dataArray, { appId, titleKey, metaKey, isMessage });
        const useMechanicalReveal = currentUser === 'n.bennett' && appId === 'explorer';
        const revealTimers = [];
        let slideshowController = null;
        let firstSelect = null;
        let hasInitialSelection = false;

        listPane.classList.toggle('is-strict-profile', presentation.mode === 'strict');
        listPane.classList.toggle('is-chaotic-profile', presentation.mode === 'chaotic');

        if (useMechanicalReveal && win) {
            const previousCleanup = typeof win._cleanup === 'function' ? win._cleanup : null;
            win._cleanup = () => {
                revealTimers.forEach((timerId) => window.clearTimeout(timerId));
                if (previousCleanup) previousCleanup();
            };
        }

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

        presentation.items.forEach((entry, index) => {
            const item = entry.item;
            const div = document.createElement('div');
            div.className = `list-item type-${item.type || 'entry'}${entry.extraClasses ? ` ${entry.extraClasses.join(' ')}` : ''}`;
            div.tabIndex = 0;

            Object.entries(entry.styleVars || {}).forEach(([name, value]) => {
                div.style.setProperty(name, value);
            });

            let displayTitle = entry.displayTitle || item[titleKey];
            if (isMessage) displayTitle = `De: ${item[titleKey]}`;

            const typeLabel = entry.typeLabel || (isMessage ? 'message' : (item.type || 'entrée'));
            const metaLabel = entry.metaLabel || item[metaKey] || item.summary || '';

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
                    playUiSelect({
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
                            playUiSelect({
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

            if (useMechanicalReveal) {
                div.classList.add('is-mechanical');
                const revealTimer = window.setTimeout(() => {
                    listPane.appendChild(div);
                    const visibleTimer = window.setTimeout(() => {
                        div.classList.add('is-visible');
                    }, 18);
                    revealTimers.push(visibleTimer);

                    if (!hasInitialSelection) {
                        hasInitialSelection = true;
                        selectItem(false);
                        div.focus();
                    }
                }, index * 58);
                revealTimers.push(revealTimer);
            } else {
                listPane.appendChild(div);

                if (!firstSelect) {
                    firstSelect = () => {
                        selectItem(false);
                        div.focus();
                    };
                }
            }
        });

        if (!useMechanicalReveal && firstSelect) {
            firstSelect();
        }
    }

    function renderComplianceConsole(container) {
        setWindowMinimumSize(container, 740, 520);
        resizeWindow(container, 780, 560);
        container.innerHTML = `
            <div class="compliance-console">
                <div class="compliance-header">
                    <div>
                        <div class="compliance-kicker">Audit local de bureau</div>
                        <div class="compliance-title">NOAH BENNETT / OPEN SPACE CONTROL</div>
                    </div>
                    <div class="compliance-badge">Conformité partielle</div>
                </div>
                <div class="compliance-grid">
                    <section class="compliance-panel">
                        <div class="compliance-label">Température zone A</div>
                        <div class="compliance-value">19.5°C</div>
                        <div class="compliance-copy">Dérive tolérée : 0.3°C. Toute variation supérieure entraîne une baisse nette de productivité.</div>
                    </section>
                    <section class="compliance-panel">
                        <div class="compliance-label">Statut mug personnel</div>
                        <div class="compliance-value">Localisé</div>
                        <div class="compliance-copy">Risque de contamination faible. Surveillance renforcée des usages collectifs recommandée.</div>
                    </section>
                    <section class="compliance-panel">
                        <div class="compliance-label">Cuisine commune</div>
                        <div class="compliance-value compliance-value--warn">Incident résiduel</div>
                        <div class="compliance-copy">Trace olfactive persistante post micro-ondes. Action corrective : affichage d'une charte, refus passif-agressif de toute odeur marine.</div>
                    </section>
                    <section class="compliance-panel">
                        <div class="compliance-label">Bruit ambiant</div>
                        <div class="compliance-value">43 dB</div>
                        <div class="compliance-copy">Tolérable si aucune personne ne mastique, soupire ou tape frénétiquement sur un clavier mécanique.</div>
                    </section>
                </div>
                <div class="compliance-log">
                    <div class="compliance-log-title">Infractions du jour</div>
                    <ul>
                        <li>01 mug inconnu laissé dans l'évier.</li>
                        <li>02 stylos déplacés sans justification.</li>
                        <li>01 tentative de climatisation à 22°C détectée puis corrigée.</li>
                    </ul>
                </div>
            </div>
        `;
    }

    function renderTrashBin(container) {
        const trashEntries = [
            {
                name: "draft_mail_steph_02h14.msg",
                type: "deleted",
                summary: "Brouillon supprimé dans la panique.",
                content: "Objet : Réponds.\n\nSteph, si le message de rupture vient vraiment de toi, alors je veux une explication immédiate. Noah est furieux, Madison m'appelle toutes les cinq minutes et Emily ne répond plus. Je n'arrive plus à couvrir ça."
            },
            {
                name: "tickets_compta_regis_real.xlsx",
                type: "spreadsheet",
                summary: "Budget réel non maquillé.",
                content: "29/06/2032 - Ventilation serveurs REGIS : 18 400€\n29/06/2032 - Fibre optique non déclarée : 6 200€\n29/06/2032 - 'Maintenance station 2' : prétexte administratif."
            },
            {
                name: "appel_noah_08h12.txt",
                type: "text",
                summary: "Transcription automatique.",
                content: "Noah hurle qu'il est devant les grilles, que son badge ne passe plus et que la sécurité ne le laisse pas entrer. Il me demande si je savais. Je n'ai pas décroché."
            },
            {
                name: "notes_panique_olivia.md",
                type: "markdown",
                summary: "Tentative de remise en ordre.",
                content: "Ce n'est pas normal. Steph ne répond pas. Emily a disparu. La compta va voir les chiffres. Si REGIS a vraiment envoyé le mail, alors tout le reste est déjà dans ses logs."
            }
        ];

        renderSplitView(container, trashEntries, 'name', 'summary', 'content');
    }

    function renderCameraFeed(container) {
        setWindowMinimumSize(container, 900, 580);
        resizeWindow(container, 960, 620);
        container.innerHTML = `
            <div class="camera-feed-window">
                <div class="camera-feed-topbar">
                    <span>BNI / CAMERA DE SECURITE / STATION_02</span>
                    <span>CANAL 4B // HORS SERVICE</span>
                </div>
                <div class="camera-feed-screen camera-feed-screen--lost">
                    <div class="camera-failure-noise"></div>
                    <div class="camera-failure-snow"></div>
                    <div class="camera-failure-bar"></div>
                    <div class="camera-failure-vignette"></div>
                    <div class="camera-lost-center">
                        <div class="camera-lost-kicker">LIAISON VIDEO INTERRUPTED</div>
                        <div class="camera-lost-title">SIGNAL LOST</div>
                        <div class="camera-lost-copy">Flux inexploitable. Perte du port optique ou obturateur recouvert. Derniere tentative de synchronisation : 29/06/2032 - 03:14.</div>
                    </div>
                    <div class="camera-feed-label">Image perdue. Activite parasite detectee sur lentille.</div>
                    <div class="camera-feed-timestamp">ARCHIVE / NO INPUT / 03:14:22</div>
                </div>
            </div>
        `;
    }

    function renderRegisMonitor(container) {
        setWindowMinimumSize(container, 960, 640);
        resizeWindow(container, 1040, 700);
        const columns = Array.from({ length: 8 }, (_, index) => {
            const rows = Array.from({ length: 38 }, () => `<span>${escapeHTML(generateRegisCodeLine())}</span>`).join('');
            return `
                <div class="regis-monitor-column" style="--rain-duration:${9 + (index * 1.2)}s; --rain-delay:${-1 * ((index % 4) * 1.4)}s;">
                    <div class="regis-monitor-rain">${rows}${rows}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="regis-monitor-window">
                <div class="regis-monitor-topbar">
                    <div>
                        <div class="regis-monitor-kicker">IA autonome en exécution</div>
                        <div class="regis-monitor-title">MONITEUR R.E.G.I.S.</div>
                    </div>
                    <div class="regis-monitor-status">STREAM NON INTERROMPABLE</div>
                </div>
                <div class="regis-monitor-grid">
                    ${columns}
                </div>
            </div>
        `;
    }

    function renderDocument(container, synthData) {
        setWindowMinimumSize(container, 940, 680);
        resizeWindow(container, 980, 720);
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
        const win = container.closest('.os-window');
        container.classList.add('terminal-window');
        container.innerHTML = `
            <div class="terminal-chrome">
                <span>PROJET REGISTRE - OS v4.02</span>
                <span>SESSION ${currentUser.toUpperCase()}</span>
            </div>
            <div class="terminal-output"></div>
            <div class="terminal-human-gate" hidden>
                <div class="terminal-gate-header">
                    <div>
                        <div class="terminal-gate-kicker">PROTOCOLE H-9</div>
                        <div class="terminal-gate-title">VERROU ANALOGIQUE HUMAIN</div>
                    </div>
                    <button type="button" class="terminal-gate-replay">Rejouer la séquence</button>
                </div>
                <div class="terminal-gate-copy">
                    Archive cachée isolée du contrôle REGIS. Observez la séquence lumineuse, puis cliquez les cellules dans le même ordre.
                </div>
                <div class="terminal-gate-track" aria-hidden="true"></div>
                <div class="terminal-human-grid" role="group" aria-label="Verification humaine"></div>
                <div class="terminal-gate-status">Initialisation du verrou humain...</div>
            </div>
            <div class="terminal-input-line">
                <span class="terminal-prompt">></span>
                <input type="text" class="terminal-input" autocomplete="off" spellcheck="false" placeholder="Entrer une commande">
            </div>
        `;

        const outputDiv = container.querySelector('.terminal-output');
        const inputField = container.querySelector('.terminal-input');
        const humanGate = container.querySelector('.terminal-human-gate');
        const humanGrid = container.querySelector('.terminal-human-grid');
        const gateTrack = container.querySelector('.terminal-gate-track');
        const gateStatus = container.querySelector('.terminal-gate-status');
        const replayButton = container.querySelector('.terminal-gate-replay');
        const gridLabels = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
        const truthGateState = {
            unlocked: false,
            sequence: [],
            progress: 0,
            isPlaying: false,
            buttons: [],
            timers: []
        };
        const ghostState = {
            idleTimer: null,
            timers: [],
            nodes: [],
            isActive: false
        };
        const prankState = {
            active: false,
            screen: null,
            timers: []
        };

        humanGrid.innerHTML = gridLabels.map((label, index) => `
            <button type="button" class="human-node" data-node-index="${index}" disabled>
                <span class="human-node-id">${label}</span>
                <span class="human-node-signal">idle</span>
            </button>
        `).join('');
        truthGateState.buttons = Array.from(humanGrid.querySelectorAll('.human-node'));

        setWindowMinimumSize(container, 720, 500);
        resizeWindow(container, 780, 540);
        inputField.focus();
        container.addEventListener('click', () => inputField.focus());
        replayButton.addEventListener('click', () => startTruthGate(true));
        humanGrid.addEventListener('click', (event) => {
            const button = event.target.closest('.human-node');
            if (!button || truthGateState.isPlaying || !truthGateState.sequence.length) return;
            handleTruthGateInput(Number(button.dataset.nodeIndex));
        });

        const previousCleanup = typeof win?._cleanup === 'function' ? win._cleanup : null;
        if (win) {
            win._cleanup = () => {
                clearTruthGateTimers();
                clearGhostState(true);
                clearPrankSequence();
                if (previousCleanup) previousCleanup();
            };
        }

        appendOutput("PROJET REGISTRE - OS v4.02");
        appendOutput("Droit d'accès : ADMINISTRATIF.");
        appendOutput("Tapez 'help' pour la liste des commandes.");
        scheduleGhostTyping();

        function appendOutput(text, options = {}) {
            const lines = String(text).split('\n');
            const createdNodes = lines.map((line) => {
                const node = document.createElement('div');
                node.className = 'terminal-line';
                if (options.variant) node.classList.add(`terminal-line--${options.variant}`);
                if (options.ghost) node.dataset.ghost = 'true';
                node.textContent = line || ' ';
                outputDiv.appendChild(node);
                return node;
            });
            outputDiv.scrollTop = outputDiv.scrollHeight;
            return createdNodes;
        }

        function appendCommand(command) {
            if (!command) return;
            appendOutput(`> ${command}`, { variant: 'command' });
        }

        function clearTruthGateTimers() {
            truthGateState.timers.forEach((timerId) => window.clearTimeout(timerId));
            truthGateState.timers = [];
        }

        function clearGhostTimers() {
            ghostState.timers.forEach((timerId) => window.clearTimeout(timerId));
            ghostState.timers = [];
        }

        function clearPrankSequence() {
            prankState.timers.forEach((timerId) => {
                window.clearTimeout(timerId);
                window.clearInterval(timerId);
            });
            prankState.timers = [];
            prankState.active = false;
            if (prankState.screen) {
                prankState.screen.remove();
                prankState.screen = null;
            }
        }

        function removeGhostLines() {
            ghostState.nodes.forEach((node) => node.remove());
            ghostState.nodes = [];
            ghostState.isActive = false;
            outputDiv.classList.remove('is-self-typing');
        }

        function clearGhostState(removeLines = false) {
            if (ghostState.idleTimer) {
                window.clearTimeout(ghostState.idleTimer);
                ghostState.idleTimer = null;
            }

            clearGhostTimers();
            if (removeLines) removeGhostLines();
        }

        function scheduleGhostTyping() {
            if (currentUser !== 'e.carter') return;
            if (prankState.active) return;
            if (!humanGate.hidden || truthGateState.isPlaying || inputField.value.trim()) return;

            clearGhostState(false);
            ghostState.idleTimer = window.setTimeout(() => {
                startGhostTyping();
            }, 10000);
        }

        function startGhostTyping() {
            if (currentUser !== 'e.carter' || prankState.active || !humanGate.hidden || truthGateState.isPlaying || inputField.value.trim()) return;

            removeGhostLines();
            outputDiv.classList.add('is-self-typing');
            ghostState.isActive = true;

            const ghostLines = [
                "> ANALYSE DE L'UTILISATEUR EN COURS...",
                "> PROFIL DÉTECTÉ.",
                "> VOUS N'ÊTES PAS EMILY CARTER."
            ];

            ghostLines.forEach((line, index) => {
                const timerId = window.setTimeout(() => {
                    const [node] = appendOutput(line, {
                        variant: 'ghost',
                        ghost: true
                    });
                    if (node) ghostState.nodes.push(node);
                }, index * 620);
                ghostState.timers.push(timerId);
            });

            const clearTimer = window.setTimeout(() => {
                removeGhostLines();
                scheduleGhostTyping();
            }, (ghostLines.length * 620) + 850);
            ghostState.timers.push(clearTimer);
        }

        function updateTruthGateTrack() {
            gateTrack.innerHTML = truthGateState.sequence.map((_, index) => {
                let stateClass = '';
                if (index < truthGateState.progress) stateClass = ' is-complete';
                else if (!truthGateState.isPlaying && index === truthGateState.progress) stateClass = ' is-current';
                return `<span class="terminal-gate-step${stateClass}">${index + 1}</span>`;
            }).join('');
        }

        function setTruthGateEnabled(isEnabled) {
            truthGateState.buttons.forEach((button) => {
                button.disabled = !isEnabled;
            });
        }

        function resetTruthGateVisuals() {
            humanGate.classList.remove('is-failed', 'is-success');
            truthGateState.buttons.forEach((button) => {
                button.classList.remove('is-flash', 'is-correct', 'is-error');
                const signal = button.querySelector('.human-node-signal');
                if (signal) signal.textContent = 'idle';
            });
        }

        function flashTruthGateButton(index, className, signalText, duration = 340) {
            const button = truthGateState.buttons[index];
            if (!button) return;

            const signal = button.querySelector('.human-node-signal');
            button.classList.add(className);
            if (signal) signal.textContent = signalText;

            const timerId = window.setTimeout(() => {
                button.classList.remove(className);
                if (!button.classList.contains('is-correct') && !button.classList.contains('is-error') && signal) {
                    signal.textContent = truthGateState.isPlaying ? 'scan' : 'idle';
                }
            }, duration);

            truthGateState.timers.push(timerId);
        }

        function generateTruthGateSequence(length = 4) {
            const sequence = [];
            while (sequence.length < length) {
                const next = Math.floor(Math.random() * gridLabels.length);
                if (sequence[sequence.length - 1] !== next) sequence.push(next);
            }
            return sequence;
        }

        function revealTruthArchive() {
            truthGateState.unlocked = true;
            truthGateState.isPlaying = false;
            truthGateState.progress = truthGateState.sequence.length;
            humanGate.classList.remove('is-failed');
            humanGate.classList.add('is-success');
            gateStatus.textContent = "Empreinte humaine validée. Déverrouillage de l'archive truth...";
            updateTruthGateTrack();
            setTruthGateEnabled(false);
            window.registreAudio?.play('authSuccess', {
                volume: 0.24,
                playbackRate: 0.88
            });
            setWindowMinimumSize(container, 980, 720);
            resizeWindow(container, 1020, 760);

            const revealTimer = window.setTimeout(() => {
                humanGate.hidden = true;
                appendOutput(userData.terminal.truth || "Archive introuvable.");
                inputField.focus();
                scheduleGhostTyping();
            }, 520);
            truthGateState.timers.push(revealTimer);
        }

        function failTruthGate() {
            truthGateState.isPlaying = false;
            truthGateState.progress = 0;
            humanGate.classList.remove('is-success');
            humanGate.classList.add('is-failed');
            gateStatus.textContent = "Sequence invalide. Les modeles REGIS imitent mal la motricite humaine. Relancez.";
            setTruthGateEnabled(false);
            updateTruthGateTrack();
            window.registreAudio?.play('authError', {
                volume: 0.18,
                playbackRate: 0.92
            });
            appendOutput("[PROTOCOLE H-9] Echec de verification. Cliquez sur 'Rejouer la sequence' ou retapez 'truth'.");
        }

        function playTruthGateSequence() {
            clearTruthGateTimers();
            resetTruthGateVisuals();
            truthGateState.progress = 0;
            truthGateState.isPlaying = true;
            setTruthGateEnabled(false);
            gateStatus.textContent = "Observation requise. Memorisez la sequence lumineuse.";
            updateTruthGateTrack();

            truthGateState.sequence.forEach((nodeIndex, stepIndex) => {
                const startDelay = 320 + (stepIndex * 540);
                const flashTimer = window.setTimeout(() => {
                    const button = truthGateState.buttons[nodeIndex];
                    const signal = button?.querySelector('.human-node-signal');
                    if (signal) signal.textContent = 'pulse';
                    flashTruthGateButton(nodeIndex, 'is-flash', 'pulse', 320);
                    playUiSelect({
                        volume: 0.05,
                        playbackRate: 0.72 + (stepIndex * 0.03)
                    });
                }, startDelay);
                truthGateState.timers.push(flashTimer);
            });

            const unlockTimer = window.setTimeout(() => {
                truthGateState.isPlaying = false;
                setTruthGateEnabled(true);
                gateStatus.textContent = "Mode reception actif. Reproduisez la sequence pour prouver une presence humaine.";
                truthGateState.buttons.forEach((button) => {
                    const signal = button.querySelector('.human-node-signal');
                    if (signal) signal.textContent = 'ready';
                });
                updateTruthGateTrack();
            }, 320 + (truthGateState.sequence.length * 540));
            truthGateState.timers.push(unlockTimer);
        }

        function startTruthGate(isReplay = false) {
            clearGhostState(true);

            if (!userData.terminal.truth) {
                appendOutput("Commande non reconnue. Tentative consignee.");
                return;
            }

            if (truthGateState.unlocked) {
                resizeWindow(container, 940, 660);
                appendOutput(userData.terminal.truth);
                return;
            }

            clearTruthGateTimers();
            truthGateState.sequence = generateTruthGateSequence();
            truthGateState.progress = 0;
            humanGate.hidden = false;
            humanGate.classList.remove('is-failed', 'is-success');
            gateStatus.textContent = "Initialisation du protocole humain...";
            replayButton.disabled = false;
            setWindowMinimumSize(container, 980, 720);
            resizeWindow(container, 1020, 760);

            if (isReplay) appendOutput("[PROTOCOLE H-9] Sequence reinitialisee.");
            else appendOutput("[VERROU IA] Archive truth detectee. Validation humaine analogique requise.");

            updateTruthGateTrack();
            playTruthGateSequence();
        }

        function handleTruthGateInput(index) {
            if (truthGateState.isPlaying || truthGateState.progress >= truthGateState.sequence.length) return;

            const expectedIndex = truthGateState.sequence[truthGateState.progress];
            if (index !== expectedIndex) {
                const wrongButton = truthGateState.buttons[index];
                wrongButton?.classList.add('is-error');
                const wrongSignal = wrongButton?.querySelector('.human-node-signal');
                if (wrongSignal) wrongSignal.textContent = 'fault';
                failTruthGate();
                return;
            }

            const button = truthGateState.buttons[index];
            button?.classList.add('is-correct');
            const signal = button?.querySelector('.human-node-signal');
            if (signal) signal.textContent = 'ok';
            truthGateState.progress += 1;
            updateTruthGateTrack();
            playUiSelect({
                volume: 0.08,
                playbackRate: 0.95 + (truthGateState.progress * 0.03)
            });

            if (truthGateState.progress >= truthGateState.sequence.length) {
                revealTruthArchive();
            }
        }

        function startPrankBomb() {
            clearPrankSequence();
            prankState.active = true;

            const prankScreen = document.createElement('div');
            prankScreen.id = "prank-screen";
            document.body.appendChild(prankScreen);
            prankState.screen = prankScreen;

            prankScreen.style.position = "fixed";
            prankScreen.style.top = "0";
            prankScreen.style.left = "0";
            prankScreen.style.width = "100vw";
            prankScreen.style.height = "100vh";
            prankScreen.style.background = "radial-gradient(circle at 50% 12%, rgba(207, 33, 33, 0.16), transparent 22%), linear-gradient(180deg, #050506 0%, #140304 52%, #010101 100%)";
            prankScreen.style.color = "#ffd8d8";
            prankScreen.style.fontFamily = "Consolas, monospace";
            prankScreen.style.zIndex = "999999";
            prankScreen.style.display = "flex";
            prankScreen.style.flexDirection = "column";
            prankScreen.style.justifyContent = "center";
            prankScreen.style.alignItems = "center";
            prankScreen.style.padding = "28px";
            prankScreen.style.overflow = "hidden";
            prankScreen.style.cursor = "none";

            const scanline = document.createElement('div');
            scanline.style.position = "absolute";
            scanline.style.left = "0";
            scanline.style.right = "0";
            scanline.style.top = "0";
            scanline.style.height = "160px";
            scanline.style.opacity = "0.24";
            scanline.style.pointerEvents = "none";
            scanline.style.mixBlendMode = "screen";
            scanline.style.background = "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,120,120,0.12) 25%, rgba(255,255,255,0.24) 50%, rgba(255,120,120,0.14) 70%, rgba(255,255,255,0) 100%)";
            prankScreen.appendChild(scanline);

            const hazardTop = document.createElement('div');
            hazardTop.style.position = "absolute";
            hazardTop.style.top = "0";
            hazardTop.style.left = "0";
            hazardTop.style.right = "0";
            hazardTop.style.height = "22px";
            hazardTop.style.background = "repeating-linear-gradient(135deg, rgba(255, 86, 86, 0.9) 0 18px, rgba(15, 10, 10, 0.95) 18px 36px)";
            hazardTop.style.boxShadow = "0 0 24px rgba(255, 64, 64, 0.22)";
            prankScreen.appendChild(hazardTop);

            const hazardBottom = hazardTop.cloneNode();
            hazardBottom.style.top = "auto";
            hazardBottom.style.bottom = "0";
            prankScreen.appendChild(hazardBottom);

            const pulseOverlay = document.createElement('div');
            pulseOverlay.style.position = "absolute";
            pulseOverlay.style.inset = "0";
            pulseOverlay.style.background = "radial-gradient(circle at center, rgba(255, 58, 58, 0.1), transparent 52%)";
            pulseOverlay.style.opacity = "0";
            pulseOverlay.style.pointerEvents = "none";
            pulseOverlay.style.transition = "opacity 0.12s linear";
            prankScreen.appendChild(pulseOverlay);

            const hud = document.createElement('div');
            hud.style.position = "relative";
            hud.style.width = "min(1280px, calc(100vw - 56px))";
            hud.style.display = "grid";
            hud.style.gridTemplateColumns = "minmax(0, 1.45fr) minmax(340px, 0.9fr)";
            hud.style.gap = "18px";
            hud.style.alignItems = "stretch";
            hud.style.textAlign = "left";
            hud.style.transition = "transform 0.08s linear";

            const consolePanel = document.createElement('section');
            consolePanel.style.position = "relative";
            consolePanel.style.border = "1px solid rgba(255, 84, 84, 0.28)";
            consolePanel.style.background = "linear-gradient(180deg, rgba(13, 13, 15, 0.97) 0%, rgba(7, 4, 4, 0.97) 100%)";
            consolePanel.style.boxShadow = "0 28px 90px rgba(0, 0, 0, 0.66), inset 0 0 0 1px rgba(255,255,255,0.03)";
            consolePanel.style.padding = "26px 28px 30px";
            consolePanel.style.overflow = "hidden";

            const topbar = document.createElement('div');
            topbar.style.display = "flex";
            topbar.style.justifyContent = "space-between";
            topbar.style.flexWrap = "wrap";
            topbar.style.gap = "18px";
            topbar.style.marginBottom = "20px";
            topbar.style.fontSize = "12px";
            topbar.style.letterSpacing = "2px";
            topbar.style.textTransform = "uppercase";
            topbar.style.color = "rgba(255, 120, 120, 0.78)";
            topbar.innerHTML = `
                <span>CERBERUS // MATÉRIAL PURGE LAYER</span>
                <span>SESSION TRACE : ${escapeHTML((currentUser || "unknown").toUpperCase())}</span>
                <span>SATA0 / NV-CACHE / UPS CLAMP</span>
            `;

            const title = document.createElement('div');
            title.textContent = "ARMEMENT DE LA CHARGE DU DISQUE";
            title.style.fontSize = "clamp(32px, 4vw, 60px)";
            title.style.lineHeight = "0.9";
            title.style.letterSpacing = "4px";
            title.style.textTransform = "uppercase";
            title.style.color = "#fff2f2";
            title.style.marginBottom = "10px";
            title.style.textShadow = "0 0 24px rgba(255, 64, 64, 0.16)";

            const subtitle = document.createElement('div');
            subtitle.textContent = "Binaire interdit déclenché. La micro-charge interne du SSD local entre en séquence d'armement.";
            subtitle.style.fontSize = "14px";
            subtitle.style.letterSpacing = "1.3px";
            subtitle.style.color = "rgba(255, 182, 182, 0.72)";
            subtitle.style.marginBottom = "18px";

            const progressFrame = document.createElement('div');
            progressFrame.style.height = "14px";
            progressFrame.style.border = "1px solid rgba(255, 84, 84, 0.22)";
            progressFrame.style.background = "rgba(255,255,255,0.04)";
            progressFrame.style.overflow = "hidden";
            progressFrame.style.marginBottom = "18px";

            const progressBar = document.createElement('div');
            progressBar.style.width = "0%";
            progressBar.style.height = "100%";
            progressBar.style.background = "linear-gradient(90deg, #8a1111 0%, #ff4a4a 100%)";
            progressBar.style.boxShadow = "0 0 24px rgba(255, 74, 74, 0.18)";
            progressBar.style.transition = "width 0.24s ease";
            progressFrame.appendChild(progressBar);

            const textContainer = document.createElement('div');
            textContainer.style.minHeight = "380px";
            textContainer.style.maxHeight = "56vh";
            textContainer.style.overflow = "auto";
            textContainer.style.padding = "20px 22px";
            textContainer.style.border = "1px solid rgba(255, 84, 84, 0.14)";
            textContainer.style.background = "linear-gradient(180deg, rgba(10, 6, 6, 0.98) 0%, rgba(4, 3, 3, 0.98) 100%)";
            textContainer.style.fontSize = "20px";
            textContainer.style.lineHeight = "1.45";
            textContainer.style.letterSpacing = "1.2px";
            textContainer.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,0.02)";

            const footer = document.createElement('div');
            footer.style.display = "flex";
            footer.style.justifyContent = "space-between";
            footer.style.flexWrap = "wrap";
            footer.style.gap = "16px";
            footer.style.marginTop = "16px";
            footer.style.fontSize = "12px";
            footer.style.textTransform = "uppercase";
            footer.style.letterSpacing = "1.8px";
            footer.style.color = "rgba(255, 165, 165, 0.64)";
            footer.innerHTML = `
                <span>NODE // LOCAL SSD / CHARGE ARMÉE</span>
                <span>POWER CUTOFF : LOCKED</span>
                <span>PHYSICAL OVERRIDE : DENIED</span>
            `;

            const statusPanel = document.createElement('aside');
            statusPanel.style.position = "relative";
            statusPanel.style.display = "grid";
            statusPanel.style.gridTemplateRows = "auto auto auto 1fr auto";
            statusPanel.style.gap = "14px";
            statusPanel.style.border = "1px solid rgba(255, 84, 84, 0.24)";
            statusPanel.style.background = "linear-gradient(180deg, rgba(12, 8, 8, 0.97) 0%, rgba(6, 4, 4, 0.97) 100%)";
            statusPanel.style.boxShadow = "0 24px 72px rgba(0, 0, 0, 0.54), inset 0 0 0 1px rgba(255,255,255,0.02)";
            statusPanel.style.padding = "24px";

            const etaLabel = document.createElement('div');
            etaLabel.textContent = "DÉTONATION DU DISQUE";
            etaLabel.style.fontSize = "12px";
            etaLabel.style.textTransform = "uppercase";
            etaLabel.style.letterSpacing = "2.2px";
            etaLabel.style.color = "rgba(255, 135, 135, 0.72)";

            const countdownDisplay = document.createElement('div');
            countdownDisplay.textContent = "--";
            countdownDisplay.style.fontSize = "clamp(84px, 16vw, 160px)";
            countdownDisplay.style.fontWeight = "700";
            countdownDisplay.style.lineHeight = "0.9";
            countdownDisplay.style.letterSpacing = "4px";
            countdownDisplay.style.color = "#fff4f4";
            countdownDisplay.style.textShadow = "0 0 28px rgba(255, 72, 72, 0.3)";

            const directive = document.createElement('div');
            directive.textContent = "NE PAS COUPER L'ALIMENTATION // LA CHARGE SSD EST EN COURS D'ARMEMENT";
            directive.style.padding = "14px 16px";
            directive.style.border = "1px solid rgba(255, 84, 84, 0.22)";
            directive.style.background = "rgba(255, 84, 84, 0.08)";
            directive.style.fontSize = "12px";
            directive.style.lineHeight = "1.55";
            directive.style.letterSpacing = "1.6px";
            directive.style.textTransform = "uppercase";
            directive.style.color = "#ffd7d7";

            const metricsGrid = document.createElement('div');
            metricsGrid.style.display = "grid";
            metricsGrid.style.gridTemplateColumns = "1fr";
            metricsGrid.style.gap = "10px";

            function createMetric(label, initialValue) {
                const card = document.createElement('div');
                card.style.padding = "12px 14px";
                card.style.border = "1px solid rgba(255, 84, 84, 0.16)";
                card.style.background = "rgba(255, 255, 255, 0.03)";

                const name = document.createElement('div');
                name.textContent = label;
                name.style.fontSize = "11px";
                name.style.textTransform = "uppercase";
                name.style.letterSpacing = "1.8px";
                name.style.color = "rgba(255, 150, 150, 0.62)";
                name.style.marginBottom = "8px";

                const value = document.createElement('div');
                value.textContent = initialValue;
                value.style.fontSize = "20px";
                value.style.lineHeight = "1.2";
                value.style.color = "#fff1f1";

                card.append(name, value);
                metricsGrid.appendChild(card);
                return value;
            }

            const stateValue = createMetric("CHARGE SSD", "désarmée");
            const traceValue = createMetric("TRACE", "corrélation active");
            const thermalValue = createMetric("THERMIQUE", "41C");
            const powerValue = createMetric("ALIMENTATION", "stable");

            const telemetry = document.createElement('div');
            telemetry.style.display = "grid";
            telemetry.style.gap = "10px";
            telemetry.style.alignContent = "start";
            telemetry.style.padding = "14px";
            telemetry.style.border = "1px solid rgba(255, 84, 84, 0.18)";
            telemetry.style.background = "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)";

            const telemetryLabel = document.createElement('div');
            telemetryLabel.textContent = "ARMEMENT DE LA CHARGE";
            telemetryLabel.style.fontSize = "11px";
            telemetryLabel.style.letterSpacing = "2px";
            telemetryLabel.style.textTransform = "uppercase";
            telemetryLabel.style.color = "rgba(255, 150, 150, 0.62)";

            const telemetryBarFrame = document.createElement('div');
            telemetryBarFrame.style.height = "12px";
            telemetryBarFrame.style.border = "1px solid rgba(255, 84, 84, 0.18)";
            telemetryBarFrame.style.background = "rgba(255,255,255,0.03)";
            telemetryBarFrame.style.overflow = "hidden";

            const telemetryBar = document.createElement('div');
            telemetryBar.style.height = "100%";
            telemetryBar.style.width = "8%";
            telemetryBar.style.background = "linear-gradient(90deg, #751313 0%, #ff5d5d 100%)";
            telemetryBar.style.transition = "width 0.18s ease";
            telemetryBarFrame.appendChild(telemetryBar);

            const telemetryValue = document.createElement('div');
            telemetryValue.textContent = "8%";
            telemetryValue.style.fontSize = "28px";
            telemetryValue.style.letterSpacing = "1px";
            telemetryValue.style.color = "#fff2f2";

            telemetry.append(telemetryLabel, telemetryBarFrame, telemetryValue);
            statusPanel.append(etaLabel, countdownDisplay, directive, metricsGrid, telemetry);
            consolePanel.append(topbar, title, subtitle, progressFrame, textContainer, footer);
            hud.append(consolePanel, statusPanel);
            prankScreen.appendChild(hud);

            const steps = [
                { text: "CERBERUS // EXÉCUTABLE PIÉGÉ DÉTECTÉ. ARMEMENT DE LA CHARGE DU DISQUE ENGAGÉ.", state: "armement", trace: "empreinte rapprochée", thermal: "41C", power: "stable", purge: 12, countdown: "--" },
                { text: "SESSION CORRÉLÉE. LE SSD LOCAL RESTE SOUS TENSION ET PASSE SOUS TUTELLE.", state: "verrouillée", trace: "bus HID scellé", thermal: "46C", power: "stable", purge: 24, countdown: "--" },
                { text: "MICRO-CHARGE INTERNE DU SUPPORT SATA0 : SÉQUENCE D'ARMEMENT ACTIVE.", state: "armement", trace: "sata rerouté", thermal: "55C", power: "scellée", purge: 42, countdown: "--" },
                { text: "COUPURE D'ALIMENTATION INTERDITE. LA CHARGE DÉTONERA DANS LE DISQUE.", state: "verrou alim", trace: "UPS clamp", thermal: "63C", power: "scellée", purge: 58, countdown: "--" },
                { text: "DÉTONATION INTERNE DU SSD IMMINENTE.", state: "prête", trace: "impact armé", thermal: "81C", power: "critique", purge: 76, countdown: "--" },
                { text: "DÉTONATION SSD : 03", state: "prête", trace: "fenêtre critique", thermal: "87C", power: "critique", purge: 88, countdown: "03" },
                { text: "DÉTONATION SSD : 02", state: "prête", trace: "fenêtre critique", thermal: "92C", power: "impact", purge: 95, countdown: "02" },
                { text: "DÉTONATION SSD : 01", state: "prête", trace: "détonation logique", thermal: "96C", power: "impact", purge: 99, countdown: "01" },
                { text: "OVERRIDE INTERNE DÉTECTÉ. CHARGE DU DISQUE DÉSACTIVÉE.", state: "désarmée", trace: "override interne", thermal: "41C", power: "relâchée", purge: 100, countdown: "00" },
                { text: "Il n'y avait évidemment aucune bombe dans le disque. Juste un test de panique.", state: "désarmée", trace: "social test", thermal: "41C", power: "nominale", purge: 100, countdown: "--" },
                { text: "Le nom top_secret_do_not_run.exe était déjà l'avertissement.", state: "révélation", trace: "avertissement ignoré", thermal: "41C", power: "nominale", purge: 100, countdown: "--" },
                { text: "Signature interne : Emily Carter / Noah Bennett.", state: "révélation", trace: "journal fermé", thermal: "41C", power: "nominale", purge: 100, countdown: "--" }
            ];

            let delay = 0;
            const threatPhaseCount = 8;
            const totalSteps = steps.length;
            let scanlineOffset = -180;

            const scanlineTimer = window.setInterval(() => {
                if (!prankState.screen) return;
                scanlineOffset += 10;
                if (scanlineOffset > window.innerHeight + 180) scanlineOffset = -180;
                scanline.style.transform = `translateY(${scanlineOffset}px)`;
            }, 26);
            prankState.timers.push(scanlineTimer);

            const jitter = window.setInterval(() => {
                if (!prankState.screen) return;
                const intensity = countdownDisplay.textContent !== "--" && countdownDisplay.textContent !== "00" ? 2.2 : 0.9;
                const x = ((Math.random() * 2) - 1) * intensity;
                const y = ((Math.random() * 2) - 1) * intensity;
                hud.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
            }, 84);
            prankState.timers.push(jitter);

            steps.forEach((step, index) => {
                delay += index < 5 ? 1500 : (index < threatPhaseCount ? 1300 : 1800);

                const timerId = window.setTimeout(() => {
                    if (!prankState.screen) return;

                    const progress = Math.round(((index + 1) / totalSteps) * 100);
                    progressBar.style.width = `${progress}%`;
                    telemetryBar.style.width = `${step.purge}%`;
                    telemetryValue.textContent = `${step.purge}%`;
                    stateValue.textContent = step.state;
                    traceValue.textContent = step.trace;
                    thermalValue.textContent = step.thermal;
                    powerValue.textContent = step.power;
                    countdownDisplay.textContent = step.countdown;
                    pulseOverlay.style.opacity = index >= 4 && index < threatPhaseCount ? "0.22" : "0";

                    if (index === 4) {
                        title.textContent = "DÉSTRUCTION MATÉRIELLE IMMINENTE";
                        subtitle.textContent = "Le nœud local ne répond plus aux sécurités opérateur.";
                    }

                    if (index >= threatPhaseCount) {
                        prankScreen.style.background = "radial-gradient(circle at 50% 12%, rgba(166, 255, 166, 0.1), transparent 24%), linear-gradient(180deg, #020402 0%, #020602 52%, #000000 100%)";
                        consolePanel.style.borderColor = "rgba(148, 255, 146, 0.22)";
                        consolePanel.style.background = "linear-gradient(180deg, rgba(7, 12, 7, 0.97) 0%, rgba(3, 6, 3, 0.97) 100%)";
                        statusPanel.style.borderColor = "rgba(148, 255, 146, 0.18)";
                        statusPanel.style.background = "linear-gradient(180deg, rgba(7, 12, 7, 0.96) 0%, rgba(3, 6, 3, 0.96) 100%)";
                        title.textContent = "TEST DE DISCIPLINE OPÉRATIONNELLE";
                        title.style.color = "#efffea";
                        title.style.textShadow = "0 0 24px rgba(126, 255, 126, 0.12)";
                        subtitle.textContent = "Aucune charge réelle. Simple vérification de sang-froid.";
                        subtitle.style.color = "rgba(192, 255, 187, 0.72)";
                        topbar.style.color = "rgba(166, 255, 166, 0.72)";
                        footer.style.color = "rgba(166, 255, 166, 0.58)";
                        progressBar.style.background = "linear-gradient(90deg, #195319 0%, #82ff82 100%)";
                        textContainer.style.borderColor = "rgba(118, 255, 113, 0.12)";
                        textContainer.style.background = "linear-gradient(180deg, rgba(5, 9, 5, 0.98) 0%, rgba(2, 4, 2, 0.98) 100%)";
                        textContainer.style.color = "#dcffd7";
                        etaLabel.style.color = "rgba(166, 255, 166, 0.72)";
                        directive.style.borderColor = "rgba(118, 255, 113, 0.14)";
                        directive.style.background = "rgba(118, 255, 113, 0.06)";
                        directive.style.color = "#d7ffd3";
                        telemetryLabel.style.color = "rgba(166, 255, 166, 0.64)";
                        telemetryBar.style.background = "linear-gradient(90deg, #1d611d 0%, #88ff88 100%)";
                        telemetryValue.style.color = "#eeffe8";
                        countdownDisplay.style.color = "#ecffe9";
                        countdownDisplay.style.textShadow = "0 0 28px rgba(126, 255, 126, 0.18)";
                    }

                    if (index === threatPhaseCount) {
                        prankScreen.style.filter = "brightness(1.45)";
                        const flashTimer = window.setTimeout(() => {
                            if (prankState.screen) prankScreen.style.filter = "brightness(1)";
                        }, 120);
                        prankState.timers.push(flashTimer);
                    }

                    const lineNode = document.createElement('p');
                    lineNode.textContent = step.text;
                    lineNode.style.margin = "0 0 12px 0";
                    lineNode.style.color = index < threatPhaseCount ? "#ffd4d4" : "#dbffd8";
                    lineNode.style.textTransform = index < threatPhaseCount ? "uppercase" : "none";
                    lineNode.style.letterSpacing = index < threatPhaseCount ? "1.6px" : "0.8px";
                    lineNode.style.textShadow = index < threatPhaseCount ? "0 0 16px rgba(255,84,84,0.12)" : "0 0 16px rgba(118,255,113,0.08)";
                    textContainer.appendChild(lineNode);
                    textContainer.scrollTop = textContainer.scrollHeight;

                    if (index < threatPhaseCount) {
                        const beep = new Audio('assets/audio/ui_select_regis.wav');
                        beep.volume = index >= 5 ? 0.92 : 0.72;
                        beep.playbackRate = index >= 5 ? 1.02 + ((index - 5) * 0.07) : 0.82 + (index * 0.04);
                        beep.play().catch(() => {});

                        if (index >= 4) {
                            const sweep = new Audio('assets/audio/ui_open_regis.wav');
                            sweep.volume = 0.14;
                            sweep.playbackRate = 0.92 + (index * 0.02);
                            sweep.play().catch(() => {});
                        }
                    } else if (index === threatPhaseCount) {
                        const revealHit = new Audio('assets/audio/auth_error.wav');
                        revealHit.volume = 0.72;
                        revealHit.play().catch(() => {});

                        const release = new Audio('assets/audio/auth_success.wav');
                        release.volume = 0.34;
                        const releaseTimer = window.setTimeout(() => release.play().catch(() => {}), 180);
                        prankState.timers.push(releaseTimer);
                    }
                }, delay);

                prankState.timers.push(timerId);
            });

            const endTimer = window.setTimeout(() => {
                clearPrankSequence();
                appendOutput("> top_secret_do_not_run.exe terminé. Le test de panique est archivé.");
                inputField.focus();
                scheduleGhostTyping();
            }, delay + 5200);
            prankState.timers.push(endTimer);
        }

        inputField.addEventListener('keydown', (event) => {
            if (currentUser === 'e.carter' && event.key !== 'Tab') {
                clearGhostState(true);
            }
        });

        inputField.addEventListener('input', () => {
            if (currentUser !== 'e.carter') return;
            if (inputField.value.trim()) {
                clearGhostState(true);
            } else {
                scheduleGhostTyping();
            }
        });

        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = inputField.value.trim().toLowerCase();
                inputField.value = "";
                clearGhostState(true);

                if (command === "") {
                    scheduleGhostTyping();
                    return;
                }

                let response = "";
                let responseVariant = "";
                const isKnownCommand =
                    command === "help" ||
                    command === "status" ||
                    command === "logs" ||
                    command === "users" ||
                    command === "list" ||
                    command === "truth" ||
                    command === "top_secret_do_not_run.exe" ||
                    command.startsWith("open");
                const suppressEcho = currentUser === 'n.bennett' && !isKnownCommand;

                if (!suppressEcho) appendCommand(command);

                if (command === "help") response = "Commandes disponibles : list, open [fichier], status, users, logs";
                else if (command === "status") response = userData.terminal.status || "Statut non disponible.";
                else if (command === "logs") response = userData.terminal.logs || "Aucune alerte critique.";
                else if (command === "users") response = userData.terminal.users || "Accès restreint.";
                else if (command === "list") response = userData.terminal.list || "Utilisez l'Explorateur pour lister l'arborescence.";
                else if (command === "truth") {
                    startTruthGate();
                }
                else if (command === "top_secret_do_not_run.exe") {
                    startPrankBomb();
                    response = "Exécution en cours...";
                }
                else if (command.startsWith("open")) response = "Erreur : Ouverture via terminal restreinte. Utilisez l'Explorateur.";
                else if (command !== "") {
                    if (currentUser === 'n.bennett') {
                        response = "[ERREUR DE SYNTAXE - CORRECTION EXIGÉE].";
                        responseVariant = "error";
                    } else {
                        response = "Commande non reconnue. Tentative consignee.";
                    }
                }

                if (response) appendOutput(response, responseVariant ? { variant: responseVariant } : {});
                scheduleGhostTyping();
            }
        });
    }

    function setWindowMinimumSize(container, minWidth, minHeight) {
        const win = container.closest('.os-window');
        const area = document.getElementById('window-area');
        if (!win || !area) return;

        const availableWidth = Math.max(area.clientWidth - 24, 320);
        const availableHeight = Math.max(area.clientHeight - 24, 240);
        const clampedMinWidth = Math.min(Math.max(minWidth, 340), availableWidth);
        const clampedMinHeight = Math.min(Math.max(minHeight, 250), availableHeight);

        win.style.minWidth = clampedMinWidth + 'px';
        win.style.minHeight = clampedMinHeight + 'px';
    }

    function expandWindowForSlideshow(container) {
        const area = document.getElementById('window-area');
        if (!area) return;

        setWindowMinimumSize(container, 980, 700);
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

        const availableWidth = Math.max(area.clientWidth - 24, 320);
        const availableHeight = Math.max(area.clientHeight - 24, 240);
        const minWidth = Math.min(parseInt(win.style.minWidth, 10) || 340, availableWidth);
        const minHeight = Math.min(parseInt(win.style.minHeight, 10) || 250, availableHeight);
        const clampedWidth = Math.min(Math.max(targetWidth, minWidth), availableWidth);
        const clampedHeight = Math.min(Math.max(targetHeight, minHeight), availableHeight);

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

    function prepareSplitViewItems(dataArray, options = {}) {
        const appId = options.appId || '';
        const titleKey = options.titleKey || 'name';
        const preparedItems = dataArray.map((item) => ({
            item,
            displayTitle: item[titleKey],
            typeLabel: null,
            metaLabel: null,
            extraClasses: [],
            styleVars: {}
        }));

        if (appId !== 'explorer') {
            return {
                mode: 'default',
                items: preparedItems
            };
        }

        if (currentUser === 'n.bennett') {
            preparedItems.sort((a, b) => String(a.item[titleKey] || '').localeCompare(String(b.item[titleKey] || ''), 'fr', { sensitivity: 'base' }));
            preparedItems.forEach((entry) => entry.extraClasses.push('is-strict'));
            return {
                mode: 'strict',
                items: preparedItems
            };
        }

        if (currentUser === 'o.reynolds' || currentUser === 'm.brooks') {
            const chaoticItems = preparedItems.map((entry) => {
                const hash = getDeterministicHash(`${currentUser}:${entry.item[titleKey]}`);
                const displayTitle = currentUser === 'o.reynolds'
                    ? formatOliviaExplorerTitle(entry.item[titleKey], hash)
                    : formatMadisonExplorerTitle(entry.item[titleKey], hash);

                const extraClasses = ['is-chaotic'];
                if (hash % 3 === 0) extraClasses.push('is-suspect');

                return {
                    ...entry,
                    displayTitle,
                    typeLabel: hash % 4 === 0 && !['corrupt', 'deleted'].includes(entry.item.type) ? 'fichier?' : null,
                    extraClasses,
                    sortWeight: hash,
                    styleVars: {
                        '--item-tilt': `${((hash % 5) - 2) * 0.35}deg`,
                        '--item-shift': `${(hash % 7) - 3}px`
                    }
                };
            });

            chaoticItems.sort((a, b) => {
                if (a.sortWeight === b.sortWeight) {
                    return String(a.item[titleKey] || '').localeCompare(String(b.item[titleKey] || ''), 'fr', { sensitivity: 'base' });
                }
                return a.sortWeight - b.sortWeight;
            });

            return {
                mode: 'chaotic',
                items: chaoticItems
            };
        }

        return {
            mode: 'default',
            items: preparedItems
        };
    }

    function formatOliviaExplorerTitle(title, hash) {
        let output = String(title || '');
        if (hash % 2 === 0) output = output.replace(/ /g, '_');
        if (hash % 3 === 0) output = output.replace(/\.(?=[^.]+$)/, '_rev2.');
        if (hash % 5 === 0) output = `copie_${output}`;
        return output;
    }

    function formatMadisonExplorerTitle(title, hash) {
        let output = String(title || '');
        if (hash % 2 === 0) output = output.replace(/_/g, ' ');
        if (hash % 3 === 0) output = output.replace(/\.(?=[^.]+$)/, '?.');
        if (hash % 5 === 0) output = `${output} (obs)`;
        if (hash % 7 === 0) {
            output = output.split('').map((char, index) => {
                if (!/[a-z]/i.test(char)) return char;
                return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
            }).join('');
        }
        return output;
    }

    function getDeterministicHash(value) {
        let hash = 0;
        const input = String(value || '');
        for (let index = 0; index < input.length; index++) {
            hash = ((hash << 5) - hash) + input.charCodeAt(index);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function generateRegisCodeLine() {
        const prefixes = ['regis', 'archive', 'future', 'citywide', 'override', 'predictive', 'intake', 'scan'];
        const operators = ['=', '=>', '::', '!=', '&&', '||'];
        const suffixes = [
            'bniconnect.profile',
            'human_override_disabled',
            'candidate.integration',
            'redundant_data',
            'trajectory_lock',
            'behavioral_seed',
            'authority_matrix'
        ];

        const left = prefixes[Math.floor(Math.random() * prefixes.length)];
        const right = suffixes[Math.floor(Math.random() * suffixes.length)];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const scalar = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        return `${left}.${scalar} ${operator} ${right}`;
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
