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
                    <span>BNI / FLUX THERMIQUE / STATION_02</span>
                    <span>CANAL 4B</span>
                </div>
                <div class="camera-feed-screen">
                    <div class="camera-room-frame">
                        <div class="camera-room-wall camera-room-wall--left"></div>
                        <div class="camera-room-wall camera-room-wall--right"></div>
                        <div class="camera-room-floor"></div>
                        <div class="camera-room-door"></div>
                    </div>
                    <div class="camera-heat camera-heat--one"></div>
                    <div class="camera-heat camera-heat--two"></div>
                    <div class="camera-static"></div>
                    <div class="camera-scanline"></div>
                    <div class="camera-feed-label">Aucune présence détectée.</div>
                    <div class="camera-feed-timestamp">THERMAL FEED / ARCHIVE LOOP / 03:14:22</div>
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

        function appendOutput(text) {
            outputDiv.textContent += `${text}\n`;
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }

        function clearTruthGateTimers() {
            truthGateState.timers.forEach((timerId) => window.clearTimeout(timerId));
            truthGateState.timers = [];
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
                    window.registreAudio?.play('uiSelect', {
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
            window.registreAudio?.play('uiSelect', {
                volume: 0.08,
                playbackRate: 0.95 + (truthGateState.progress * 0.03)
            });

            if (truthGateState.progress >= truthGateState.sequence.length) {
                revealTruthArchive();
            }
        }

        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = inputField.value.trim().toLowerCase();
                inputField.value = "";
                appendOutput(`\n> ${command}`);

                let response = "";
                if (command === "help") response = "Commandes disponibles : list, open [fichier], status, users, logs";
                else if (command === "status") response = userData.terminal.status || "Statut non disponible.";
                else if (command === "logs") response = userData.terminal.logs || "Aucune alerte critique.";
                else if (command === "users") response = userData.terminal.users || "Accès restreint.";
                else if (command === "list") response = userData.terminal.list || "Utilisez l'Explorateur pour lister l'arborescence.";
                else if (command === "truth") {
                    startTruthGate();
                }
                else if (command.startsWith("open")) response = "Erreur : Ouverture via terminal restreinte. Utilisez l'Explorateur.";
                else if (command !== "") response = "Commande non reconnue. Tentative consignée.";

                if (response) appendOutput(response);
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
