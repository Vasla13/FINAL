document.addEventListener("DOMContentLoaded", () => {
    const recoveryIntro = document.getElementById('recovery-intro');
    const recoveryOutput = document.getElementById('recovery-output');
    const recoveryProgressBar = document.getElementById('recovery-progress-bar');
    const recoveryStatus = document.getElementById('recovery-status');
    const hackScreen = document.getElementById('hack-screen');
    const hackInput = document.getElementById('hack-input');
    const hackOutput = document.getElementById('hack-output');
    const challengeOverlay = document.getElementById('challenge-overlay');
    const bootScreen = document.getElementById('boot-screen');
    const loginContainer = document.querySelector('.login-container');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = loginForm?.querySelector('button[type="submit"]');
    const submitLabel = submitButton?.querySelector('.submit-label');
    const submitMeta = submitButton?.querySelector('.submit-meta');
    const skipRecovery = sessionStorage.getItem('registre_skip_recovery') === '1';

    let bootAudio = null;
    let introAudio = null;
    let firewallBypassed = false;
    let usersExtracted = false;
    let bootStarted = false;
    let lineIndex = 0;
    let activeChallenge = null;
    let popupCleanupInterval = null;
    let challengeTimers = [];
    let challengeAnimationFrame = null;
    let challengeKeyHandler = null;

    const bootSequence = [
        "BNI UEFI BIOS v0.9.12 (build 27.01)",
        "CPU: x86_64  |  uCode: 0xC17C18",
        "MEM: 16384MB  |  OK",
        "PCI: scanning...",
        "SATA0: PORT:C-17-C-18  |  READY",
        "NVMe0: not present",
        "USB: 2 device(s)",
        "NET: PXE disabled",
        "SEC: TPM present  |  OK",
        "----",
        "SELFTEST: [OK] timer",
        "SELFTEST: [OK] rtc",
        "SELFTEST: [OK] iommu",
        "SELFTEST: [OK] vmm",
        "----",
        "INIT: loading microcode...",
        "INIT: applying profile \"UEFI-C17-C18\"...",
        "INIT: preparing VM context...",
        "READY."
    ];
    const recoveryIntroLines = [
        "[RECOVERY] Cold start detected on BNI_SECURE_OS.",
        "[RECOVERY] Graphical shell unavailable.",
        "[RECOVERY] Mounting emergency filesystem snapshot...",
        "[RECOVERY] Validating archive partitions C-17 / C-18...",
        "[RECOVERY] Loading restricted operator prompt...",
        "[RECOVERY] Manual intrusion workflow required."
    ];
    const recoveryStatuses = [
        "MONTAGE DU SHELL DE RÉCUPÉRATION...",
        "VÉRIFICATION DES ARCHIVES SYSTÈME...",
        "INITIALISATION DE L'INTERFACE OPERATEUR...",
        "INVITE ROOT EN ATTENTE."
    ];
    const syncCalibrationHits = 3;
    const popupAds = [
        { network: "Bravado Media", title: "Gagnez une Bravado Banshee !", copy: "Cliquez pour repartir avec un coupé rouge payé par un sponsor douteux.", badge: "Auto", image: "assets/hack_ads/banshee.webp", imageMode: "cover" },
        { network: "Nightlife LS", title: "Rencontres rapides à Vinewood", copy: "Profils certifiés, filtres douteux et décisions regrettables incluses.", badge: "Nightlife", image: "assets/hack_ads/vanilla-unicorn.webp", imageMode: "cover" },
        { network: "eCola Network", title: "Achetez du eCola !", copy: "Le goût de la performance liquide et du sucre contractuel.", badge: "eCola", image: "assets/hack_ads/ecola.webp", imageMode: "contain" },
        { network: "Maze Bank Ads", title: "Maze Bank Premium+", copy: "Transformez votre découvert en opportunité de croissance.", badge: "Finance", image: "assets/hack_ads/maze-bank.webp", imageMode: "contain" },
        { network: "Lifeinvader Media", title: "Lifeinvader Boost Pack", copy: "Achetez votre crédibilité sociale avant votre pause déjeuner.", badge: "Social", image: "assets/hack_ads/lifeinvader.jpg", imageMode: "cover" },
        { network: "Sprunk Street", title: "Sprunk Max Energy", copy: "Restez éveillé, tremblant et parfaitement monétisable.", badge: "Sprunk", image: "assets/hack_ads/sprunk.webp", imageMode: "contain" },
        { network: "Up-n-Atom TV", title: "Combo atomique minute", copy: "Burgers rétro, digestion risquée et drive-thru toujours trop long.", badge: "Fast Food", image: "assets/hack_ads/up-n-atom.webp", imageMode: "cover" },
        { network: "Burger Shot TV", title: "Burger Shot Mega Deal", copy: "Un menu, trois sauces, zéro idée de la provenance.", badge: "Promo", image: "assets/hack_ads/burger-shot.webp", imageMode: "contain" },
        { network: "Cluckin Bell Live", title: "Cluckin' Bell Rewards", copy: "Le poulet industriel que votre rythme cardiaque mérite.", badge: "Food", image: "assets/hack_ads/cluckin-bell.webp", imageMode: "contain" },
        { network: "Pisswasser Sports", title: "Pisswasser Fan Pack", copy: "Hydratation de stade, mousse suspecte et patriotisme liquide.", badge: "Beer", image: "assets/hack_ads/pisswasser.webp", imageMode: "contain" },
        { network: "Bean Machine Radio", title: "Bean Machine Night Fuel", copy: "Trois cafés, aucune pause et une productivité socialement inquiétante.", badge: "Cafe", image: "assets/hack_ads/bean-machine.webp", imageMode: "cover" },
        { network: "Property Wire", title: "Shark Property Alerts", copy: "Recevez 42 notifications par heure sur des lofts hors budget.", badge: "Alertes", image: "assets/hack_ads/maze-bank.webp", imageMode: "contain" },
        { network: "Vision Channel", title: "Vinewood Vision Coaching", copy: "Réinventez votre carrière en quinze slides et deux mensonges.", badge: "Coaching", image: "assets/hack_ads/lifeinvader.jpg", imageMode: "cover" },
        { network: "Club Strawberry", title: "Sortie VIP Strawberry", copy: "Une soirée, trois néons, aucun remboursement.", badge: "Club", image: "assets/hack_ads/vanilla-unicorn.webp", imageMode: "cover" },
        { network: "Bravado Media", title: "Banshee Weekend Drop", copy: "Passez de piéton stressé à pilote irresponsable en un clic.", badge: "Sponsorisé", image: "assets/hack_ads/banshee.webp", imageMode: "cover" }
    ];
    const popupLayout = [
        [0.02, 0.04], [0.22, 0.02], [0.43, 0.03], [0.64, 0.02], [0.82, 0.05],
        [0.05, 0.31], [0.26, 0.27], [0.47, 0.29], [0.68, 0.28], [0.83, 0.34],
        [0.02, 0.62], [0.24, 0.6], [0.46, 0.63], [0.68, 0.61], [0.82, 0.64]
    ];

    const playKeySound = () => {
        const snd = new Audio('assets/audio/ui_select.wav');
        snd.volume = 0.3;
        snd.play().catch(() => {});
    };

    function appendHackOutput(text) {
        hackOutput.textContent += `${text}\n`;
        hackOutput.scrollTop = hackOutput.scrollHeight;
    }

    function clearChallengeTimers() {
        challengeTimers.forEach((timerId) => window.clearTimeout(timerId));
        challengeTimers = [];

        if (popupCleanupInterval) {
            window.clearInterval(popupCleanupInterval);
            popupCleanupInterval = null;
        }

        if (challengeAnimationFrame) {
            window.cancelAnimationFrame(challengeAnimationFrame);
            challengeAnimationFrame = null;
        }

        if (challengeKeyHandler) {
            window.removeEventListener('keydown', challengeKeyHandler);
            challengeKeyHandler = null;
        }
    }

    function setHackInteractive(isEnabled) {
        hackInput.disabled = !isEnabled;
        if (isEnabled && hackScreen.classList.contains('is-ready')) {
            window.setTimeout(() => hackInput.focus(), 40);
        }
    }

    function hideChallengeOverlay() {
        clearChallengeTimers();
        activeChallenge = null;

        if (!challengeOverlay) return;
        challengeOverlay.hidden = true;
        challengeOverlay.innerHTML = "";
        setHackInteractive(true);
    }

    function showChallengeOverlay(markup) {
        if (!challengeOverlay) return;
        clearChallengeTimers();
        setHackInteractive(false);
        challengeOverlay.hidden = false;
        challengeOverlay.innerHTML = markup;
    }

    function revealLoginScreen() {
        loginContainer?.classList.add('is-visible');
    }

    function setLoginVisualState(state = "idle") {
        loginContainer?.classList.remove('has-error', 'is-authenticating');
        usernameInput?.removeAttribute('aria-invalid');

        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "Connexion";
        if (submitMeta) submitMeta.textContent = "Ouvrir la session restauree";

        if (state === "error") {
            loginContainer?.classList.add('has-error');
            usernameInput?.setAttribute('aria-invalid', 'true');
            if (submitMeta) submitMeta.textContent = "Verifier l'identite complete";
        }

        if (state === "authenticating") {
            loginContainer?.classList.add('is-authenticating');
            if (submitButton) submitButton.disabled = true;
            if (submitLabel) submitLabel.textContent = "Connexion validee";
            if (submitMeta) submitMeta.textContent = "Chargement du profil...";
        }
    }

    function typeBootLines() {
        if (lineIndex < bootSequence.length) {
            bootScreen.textContent += bootSequence[lineIndex] + "\n";
            lineIndex++;
            window.setTimeout(typeBootLines, Math.random() * 200 + 100);
        } else {
            window.setTimeout(() => {
                if (window.registreAudio) {
                    window.registreAudio.stop(bootAudio, 700);
                }
                bootScreen.style.opacity = '0';
                window.setTimeout(() => {
                    bootScreen.style.display = 'none';
                    revealLoginScreen();
                    usernameInput.focus();
                }, 1000);
            }, 800);
        }
    }

    function revealHackScreen() {
        if (recoveryIntro) {
            recoveryIntro.classList.add('is-hidden');
            window.setTimeout(() => {
                recoveryIntro.style.display = 'none';
            }, 820);
        }

        if (window.registreAudio) {
            window.registreAudio.stop(introAudio, 500);
        }

        setHackInteractive(true);
        hackScreen.classList.add('is-ready');
    }

    function startRecoveryIntro() {
        if (!recoveryIntro || !recoveryOutput || !recoveryProgressBar || !recoveryStatus) {
            setHackInteractive(true);
            hackScreen.classList.add('is-ready');
            hackInput.focus();
            return;
        }

        setHackInteractive(false);
        hackScreen.classList.remove('is-ready');
        recoveryIntro.style.display = 'flex';
        recoveryIntro.classList.remove('is-hidden');
        recoveryOutput.textContent = "";
        recoveryProgressBar.style.width = "0%";
        recoveryStatus.textContent = recoveryStatuses[0];
        introAudio = window.registreAudio?.play('boot', {
            loop: true,
            volume: 0.12,
            playbackRate: 1.04
        }) || null;

        recoveryIntroLines.forEach((line, index) => {
            const timerId = window.setTimeout(() => {
                recoveryOutput.textContent += `${line}\n`;
                recoveryOutput.scrollTop = recoveryOutput.scrollHeight;
                recoveryProgressBar.style.width = `${Math.round(((index + 1) / recoveryIntroLines.length) * 100)}%`;
                recoveryStatus.textContent = recoveryStatuses[Math.min(index + 1, recoveryStatuses.length - 1)];
                playKeySound();
            }, 260 + (index * 340));
            challengeTimers.push(timerId);
        });

        const statusTimer = window.setTimeout(() => {
            recoveryStatus.textContent = "SHELL DE RÉCUPÉRATION PRÊT. ENTRÉE OPÉRATEUR REQUISE.";
        }, 260 + (recoveryIntroLines.length * 340));
        challengeTimers.push(statusTimer);

        const revealTimer = window.setTimeout(() => {
            clearChallengeTimers();
            revealHackScreen();
        }, 1080 + (recoveryIntroLines.length * 340));
        challengeTimers.push(revealTimer);
    }

    function startBootSequence() {
        if (bootStarted) return;
        bootStarted = true;
        lineIndex = 0;
        bootScreen.textContent = "";
        bootScreen.style.display = 'block';
        bootScreen.style.opacity = '1';
        bootAudio = window.registreAudio?.play('boot', { loop: true, volume: 0.22 }) || null;
        typeBootLines();
    }

    function completeFirewallBypass() {
        firewallBypassed = true;
        window.registreAudio?.play('authSuccess', { volume: 0.24 });
        hideChallengeOverlay();
        appendHackOutput("[VALIDATION HUMAINE] Signature motrice organique confirmée.");
        appendHackOutput("Injection sur le port 842... SUCCÈS.\nNiveau d'accès élevé obtenu. Vous pouvez maintenant extraire les données système.");
    }

    function completeUserExtraction() {
        usersExtracted = true;
        window.registreAudio?.play('authSuccess', { volume: 0.24 });
        hideChallengeOverlay();
        appendHackOutput("Déchiffrement de l'archive 'users.dat'...");
        appendHackOutput("[ACCOUNTS RECOVERED] : Les profils suivants ont été identifiés dans le cache :\n- Noah Bennett\n- Olivia Reynolds\n- Madison Brooks\n- Emily Carter\n\nTapez 'boot' pour démarrer l'interface de connexion avec ces identifiants.");
    }

    function startCaptchaChallenge() {
        activeChallenge = "captcha";
        let successCount = 0;
        let markerPosition = 0.08;
        let direction = 1;
        let speed = 0.52;
        let lastFrame = performance.now();

        const createZone = () => {
            const width = 0.14 + (Math.random() * 0.07);
            const start = 0.08 + (Math.random() * (0.84 - width));
            return {
                start,
                end: start + width
            };
        };

        let targetZone = createZone();

        showChallengeOverlay(`
            <div class="challenge-shell">
                <div class="challenge-frame">
                    <div class="challenge-kicker">BNI HUMAN RESOURCES VALIDATION</div>
                    <div class="challenge-title">CALIBRAGE DE LATENCE HUMAINE</div>
                    <div class="challenge-copy">Le filtre automatisé distingue mal les micro-ajustements moteurs humains. Appuyez sur <strong>Espace</strong> au moment exact où l'impulsion traverse la fenêtre orange. Trois validations ouvrent le port 842.</div>
                    <div class="challenge-status">Stabilisez l'impulsion. Un échec réinitialise la séquence.</div>
                    <div class="sync-shell">
                        <div class="sync-progress">
                            ${Array.from({ length: syncCalibrationHits }, (_, index) => `<span class="sync-pip" data-sync-pip="${index}"></span>`).join('')}
                        </div>
                        <div class="sync-track">
                            <div class="sync-zone"></div>
                            <div class="sync-marker"></div>
                        </div>
                        <div class="sync-meta">
                            <span>Fenêtre biomotrice variable</span>
                            <span>Port ciblé : 842</span>
                        </div>
                        <div class="sync-hint">Appuyez sur ESPACE pendant la traversée de la zone orange.</div>
                    </div>
                    <div class="captcha-actions">
                        <button type="button" class="challenge-btn" data-action="restart">Recalibrer la fenêtre</button>
                    </div>
                </div>
            </div>
        `);

        const statusNode = challengeOverlay.querySelector('.challenge-status');
        const trackNode = challengeOverlay.querySelector('.sync-track');
        const zoneNode = challengeOverlay.querySelector('.sync-zone');
        const markerNode = challengeOverlay.querySelector('.sync-marker');
        const pips = Array.from(challengeOverlay.querySelectorAll('.sync-pip'));

        const renderCalibration = () => {
            zoneNode.style.left = `${targetZone.start * 100}%`;
            zoneNode.style.width = `${(targetZone.end - targetZone.start) * 100}%`;
            markerNode.style.left = `calc(${markerPosition * 100}% - 10px)`;
            pips.forEach((pip, index) => {
                pip.classList.toggle('is-complete', index < successCount);
            });
        };

        const resetCalibration = (fullReset = false) => {
            if (fullReset) {
                successCount = 0;
                speed = 0.52;
            }
            markerPosition = 0.08 + (Math.random() * 0.1);
            direction = Math.random() > 0.5 ? 1 : -1;
            targetZone = createZone();
            renderCalibration();
        };

        challengeOverlay.querySelector('[data-action="restart"]')?.addEventListener('click', () => {
            statusNode.classList.remove('is-error');
            statusNode.textContent = "Fenêtre recalibrée. Reprenez la mesure depuis le début.";
            resetCalibration(true);
            window.registreAudio?.play('uiOpen', { volume: 0.12, playbackRate: 0.96 });
        });

        const animateCalibration = (timestamp) => {
            const delta = Math.min((timestamp - lastFrame) / 1000, 0.03);
            lastFrame = timestamp;

            markerPosition += direction * speed * delta;
            if (markerPosition >= 1) {
                markerPosition = 1;
                direction = -1;
            } else if (markerPosition <= 0) {
                markerPosition = 0;
                direction = 1;
            }

            renderCalibration();
            challengeAnimationFrame = window.requestAnimationFrame(animateCalibration);
        };

        challengeKeyHandler = (event) => {
            if (activeChallenge !== "captcha") return;
            if (event.code !== 'Space') return;

            event.preventDefault();
            const isHit = markerPosition >= targetZone.start && markerPosition <= targetZone.end;

            if (isHit) {
                successCount += 1;
                speed = Math.min(speed + 0.08, 1.04);
                statusNode.classList.remove('is-error');
                statusNode.textContent = `Synchronisation validée (${successCount}/${syncCalibrationHits}). Fenêtre suivante en approche.`;
                window.registreAudio?.play('uiSelect', {
                    volume: 0.1,
                    playbackRate: 1 + (successCount * 0.05)
                });

                if (successCount >= syncCalibrationHits) {
                    completeFirewallBypass();
                    return;
                }

                resetCalibration(false);
                return;
            }

            successCount = 0;
            speed = 0.52;
            statusNode.textContent = "Dérive détectée. Séquence humaine rejetée, reprise depuis zéro.";
            statusNode.classList.add('is-error');
            window.registreAudio?.play('authError', { volume: 0.16, playbackRate: 0.94 });
            resetCalibration(true);
        };

        window.addEventListener('keydown', challengeKeyHandler);
        renderCalibration();
        challengeAnimationFrame = window.requestAnimationFrame(animateCalibration);
    }

    function startPopupCleanupChallenge() {
        activeChallenge = "popup_cleanup";

        showChallengeOverlay(`
            <div class="challenge-shell popup-cleanup-shell">
                <div class="popup-cleanup-header">
                    <span>Serveur de récupération infecté. Neutralisez toutes les fenêtres parasites.</span>
                    <strong>Temps restant : <span id="popup-cleanup-timer">15</span>s</strong>
                </div>
                <div class="popup-cleanup-stage" id="popup-cleanup-stage"></div>
            </div>
        `);

        const stage = document.getElementById('popup-cleanup-stage');
        const timerNode = document.getElementById('popup-cleanup-timer');
        let remaining = 15;

        const failCleanup = () => {
            window.registreAudio?.play('authError', { volume: 0.18, playbackRate: 0.92 });
            hideChallengeOverlay();
            appendHackOutput("[ADWARE] Nettoyage interrompu. Relancez 'extract' et fermez les pop-ups plus vite.");
        };

        const maybeComplete = () => {
            if (!stage || stage.querySelectorAll('.malware-popup').length > 0) return;
            completeUserExtraction();
        };

        const spawnPopups = () => {
            const maxLeft = Math.max(stage.clientWidth - 218, 16);
            const maxTop = Math.max(stage.clientHeight - 150, 90);

            popupLayout.forEach((position, index) => {
                const ad = popupAds[index % popupAds.length];
                const popup = document.createElement('section');
                popup.className = 'malware-popup';
                popup.style.left = `${Math.round(position[0] * maxLeft)}px`;
                popup.style.top = `${Math.round(position[1] * maxTop)}px`;
                popup.style.transform = `rotate(${((index % 5) - 2) * 1.6}deg)`;
                popup.style.zIndex = String(10 + index);
                popup.innerHTML = `
                    <div class="malware-popup-header">
                        <span>${ad.network || 'Lifeinvader Media Partner'}</span>
                        <button type="button" class="malware-popup-close" aria-label="Fermer">X</button>
                    </div>
                    <div class="malware-popup-body">
                        ${ad.image ? `
                            <div class="malware-popup-media malware-popup-media--${ad.imageMode || 'cover'}">
                                <img src="${ad.image}" alt="" loading="eager" decoding="async">
                            </div>
                        ` : ''}
                        <div class="malware-popup-title">${ad.title}</div>
                        <div class="malware-popup-copy">${ad.copy}</div>
                        <div class="malware-popup-badge">${ad.badge}</div>
                    </div>
                `;

                popup.querySelector('.malware-popup-close')?.addEventListener('click', () => {
                    window.registreAudio?.play('uiSelect', {
                        volume: 0.08,
                        playbackRate: 0.98 + (Math.random() * 0.06)
                    });
                    popup.remove();
                    maybeComplete();
                });

                stage.appendChild(popup);
            });
        };

        const spawnTimer = window.setTimeout(spawnPopups, 40);
        challengeTimers.push(spawnTimer);

        popupCleanupInterval = window.setInterval(() => {
            remaining -= 1;
            if (timerNode) timerNode.textContent = String(remaining);

            if (remaining <= 0) {
                failCleanup();
            }
        }, 1000);
    }

    setLoginVisualState();

    if (skipRecovery) {
        if (recoveryIntro) recoveryIntro.style.display = 'none';
        if (hackScreen) hackScreen.style.display = 'none';
        if (challengeOverlay) {
            challengeOverlay.hidden = true;
            challengeOverlay.innerHTML = "";
        }
        if (bootScreen) bootScreen.style.display = 'none';
        revealLoginScreen();
        window.setTimeout(() => usernameInput?.focus(), 40);
    } else if (sessionStorage.getItem('registre_active_user')) {
        if (recoveryIntro) recoveryIntro.style.display = 'none';
        if (hackScreen) hackScreen.style.display = 'none';
        if (challengeOverlay) challengeOverlay.hidden = true;
        if (bootScreen) bootScreen.style.display = 'none';
        revealLoginScreen();
    } else {
        if (bootScreen) bootScreen.style.display = 'none';
        startRecoveryIntro();
        document.addEventListener('click', () => {
            if (hackScreen?.classList.contains('is-ready') && activeChallenge === null) {
                hackInput?.focus();
            }
        });
    }

    function launchHackBoot(message = "", delayMs = 1500) {
        if (message) {
            hackOutput.textContent += message;
            hackOutput.scrollTop = hackOutput.scrollHeight;
        }

        hideChallengeOverlay();
        setHackInteractive(false);

        const fadeTimer = window.setTimeout(() => {
            hackScreen.classList.remove('is-ready');
            const hideTimer = window.setTimeout(() => {
                hackScreen.style.display = 'none';
                startBootSequence();
            }, 1000);
            challengeTimers.push(hideTimer);
        }, delayMs);
        challengeTimers.push(fadeTimer);
    }

    hackInput?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || hackInput.disabled) return;

        const cmd = hackInput.value.trim().toLowerCase();
        hackInput.value = "";
        hackOutput.textContent += `\nroot@bni-recovery:~# ${cmd}\n`;
        playKeySound();

        let response = "";

        if (cmd === "1234") {
            response = "CODE D'ACCÈS DE SECOURS ACCEPTÉ. (Merci Kevin_IT).\nLancement immédiat de la séquence de démarrage...";
            launchHackBoot(response, 1500);
            return;
        }

        if (cmd === "help") {
            response = "Commandes autorisées :\n- scan : Analyse les ports et vulnérabilités du disque.\n- bypass [port] : Tente une injection sur le port ciblé.\n- extract : Déchiffre l'archive des utilisateurs.\n- boot : Lance l'interface graphique (GUI).";
        } else if (cmd === "scan") {
            response = "Analyse en cours...\n[PORT 22] : SSH - FERMÉ\n[PORT 80] : HTTP - FERMÉ\n[PORT 842] : SERVICE PROPRIÉTAIRE - OUVERT (Vulnérabilité critique détectée).";
        } else if (cmd.startsWith("bypass")) {
            const port = cmd.split(" ")[1];
            if (port === "842" && firewallBypassed) {
                response = "Le port 842 est déjà compromis. Passez à 'extract'.";
            } else if (port === "842") {
                response = "Le port 842 requiert une synchronisation motrice humaine.";
                appendHackOutput(response);
                startCaptchaChallenge();
                return;
            } else {
                response = "Échec de l'injection. Port sécurisé ou inexistant.";
            }
        } else if (cmd === "extract") {
            if (!firewallBypassed) {
                response = "ACCÈS REFUSÉ. Le pare-feu système est toujours actif.";
            } else if (usersExtracted) {
                response = "[ACCOUNTS RECOVERED] : Archive déjà extraite. Tapez 'boot' pour lancer l'interface graphique.";
            } else {
                response = "L'archive utilisateurs est encapsulée derrière un adware obsolète. Neutralisation manuelle requise.";
                appendHackOutput(response);
                startPopupCleanupChallenge();
                return;
            }
        } else if (cmd === "boot") {
            if (usersExtracted) {
                const trollScreen = document.createElement('div');
                trollScreen.style.position = "fixed";
                trollScreen.style.top = "0";
                trollScreen.style.left = "0";
                trollScreen.style.width = "100vw";
                trollScreen.style.height = "100vh";
                trollScreen.style.backgroundColor = "#0000aa";
                trollScreen.style.color = "#fff";
                trollScreen.style.fontFamily = "monospace";
                trollScreen.style.fontSize = "20px";
                trollScreen.style.padding = "50px";
                trollScreen.style.zIndex = "999999";
                trollScreen.style.display = "flex";
                trollScreen.style.flexDirection = "column";
                trollScreen.style.justifyContent = "center";
                trollScreen.style.alignItems = "center";
                trollScreen.style.textAlign = "center";
                document.body.appendChild(trollScreen);

                const trollLines = [
                    "DÉMARRAGE EN COURS...",
                    "CONTOURNEMENT DU PARE-FEU... RÉUSSI.",
                    "DÉCHIFFREMENT RSA-4096... RÉUSSI.",
                    "FÉLICITATIONS.",
                    "Vous êtes vraiment un(e) hacker de génie.",
                    "Un talent exceptionnel.",
                    "...",
                    "Juste pour info :",
                    "Le mot de passe de secours admin était '1234'.",
                    "Taper juste '1234' contournait tout le système.",
                    "Vous avez perdu 5 minutes de votre vie. 🤡",
                    "Lancement de l'OS..."
                ];

                let delay = 0;
                trollScreen.innerHTML = "<div></div>";
                const textContainer = trollScreen.querySelector('div');

                trollLines.forEach((line, index) => {
                    delay += (index > 6 && index < 10) ? 1500 : 800;
                    const lineTimer = window.setTimeout(() => {
                        textContainer.innerHTML += `<p style="margin: 10px 0;">${line}</p>`;
                        const snd = new Audio('assets/audio/ui_select.wav');
                        snd.play().catch(() => {});
                    }, delay);
                    challengeTimers.push(lineTimer);
                });

                const endTimer = window.setTimeout(() => {
                    trollScreen.remove();
                    launchHackBoot("", 0);
                }, delay + 3000);
                challengeTimers.push(endTimer);
                return;
            }
            response = "ERREUR FATALE. Impossible de lancer l'interface sans avoir extrait les profils utilisateurs.";
        } else if (cmd !== "") {
            response = `Commande '${cmd}' introuvable.`;
        }

        appendHackOutput(response);
    });

    const authorizedUsers = {
        "noah bennett": "n.bennett",
        "olivia reynolds": "o.reynolds",
        "madison brooks": "m.brooks",
        "emily carter": "e.carter"
    };

    usernameInput?.addEventListener('input', () => {
        if (errorMessage.textContent) errorMessage.textContent = "";
        setLoginVisualState();
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = "";
        setLoginVisualState();
        const rawInput = usernameInput.value.trim().toLowerCase();

        if (authorizedUsers[rawInput]) {
            sessionStorage.removeItem('registre_skip_recovery');
            sessionStorage.setItem('registre_active_user', authorizedUsers[rawInput]);
            sessionStorage.setItem('registre_display_name', usernameInput.value.trim());
            window.registreAudio?.play('authSuccess', { volume: 0.34 });
            setLoginVisualState("authenticating");
            errorMessage.style.color = "#27ae60";
            errorMessage.textContent = "Habilitation confirmée. Chargement du profil...";
            window.setTimeout(() => { window.location.href = "desktop.html"; }, 1200);
        } else {
            window.registreAudio?.play('authError', { volume: 0.26 });
            setLoginVisualState("error");
            errorMessage.style.color = "var(--error-color)";
            errorMessage.textContent = "Erreur : Identifiant inconnu ou profil archivé.";
            usernameInput.value = "";
            usernameInput.focus();
        }
    });
});
