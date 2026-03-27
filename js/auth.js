document.addEventListener("DOMContentLoaded", () => {
    const hackScreen = document.getElementById('hack-screen');
    const hackInput = document.getElementById('hack-input');
    const hackOutput = document.getElementById('hack-output');
    const bootScreen = document.getElementById('boot-screen');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const errorMessage = document.getElementById('errorMessage');

    let bootAudio = null;
    let firewallBypassed = false;
    let usersExtracted = false;
    let bootStarted = false;
    let lineIndex = 0;

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

    const playKeySound = () => {
        const snd = new Audio('assets/audio/ui_select.wav');
        snd.volume = 0.3;
        snd.play().catch(() => {});
    };

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
                    usernameInput.focus();
                }, 1000);
            }, 800);
        }
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

    if (sessionStorage.getItem('registre_active_user')) {
        if (hackScreen) hackScreen.style.display = 'none';
        if (bootScreen) bootScreen.style.display = 'none';
    } else {
        if (bootScreen) bootScreen.style.display = 'none';
        hackInput?.focus();
        document.addEventListener('click', () => {
            if (hackScreen?.style.display !== 'none') hackInput?.focus();
        });
    }

    hackInput?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;

        const cmd = hackInput.value.trim().toLowerCase();
        hackInput.value = "";
        hackOutput.textContent += `\nroot@bni-recovery:~# ${cmd}\n`;
        playKeySound();

        let response = "";

        if (cmd === "help") {
            response = "Commandes autorisées :\n- scan : Analyse les ports et vulnérabilités du disque.\n- bypass [port] : Tente une injection sur le port ciblé.\n- extract : Déchiffre le registre des utilisateurs.\n- boot : Lance l'interface graphique (GUI).";
        } else if (cmd === "scan") {
            response = "Analyse en cours...\n[PORT 22] : SSH - FERMÉ\n[PORT 80] : HTTP - FERMÉ\n[PORT 842] : PROTOCOLE R.E.G.I.S - OUVERT (Vulnérabilité critique détectée).";
        } else if (cmd.startsWith("bypass")) {
            const port = cmd.split(" ")[1];
            if (port === "842") {
                firewallBypassed = true;
                response = "Injection sur le port 842... SUCCÈS.\nNiveau d'accès élevé obtenu. Vous pouvez maintenant extraire les données système.";
            } else {
                response = "Échec de l'injection. Port sécurisé ou inexistant.";
            }
        } else if (cmd === "extract") {
            if (firewallBypassed) {
                usersExtracted = true;
                response = "Déchiffrement du registre 'users.dat'...\n[ACCOUNTS RECOVERED] : Les profils suivants ont été identifiés dans le cache :\n- Noah Bennett\n- Olivia Reynolds\n- Madison Brooks\n- Emily Carter\n\nTapez 'boot' pour démarrer l'interface de connexion avec ces identifiants.";
            } else {
                response = "ACCÈS REFUSÉ. Le pare-feu système est toujours actif.";
            }
        } else if (cmd === "boot") {
            if (usersExtracted) {
                response = "Lancement de la séquence de démarrage BNI...";
                hackOutput.textContent += response;
                hackOutput.scrollTop = hackOutput.scrollHeight;
                hackInput.disabled = true;

                window.setTimeout(() => {
                    hackScreen.style.opacity = '0';
                    window.setTimeout(() => {
                        hackScreen.style.display = 'none';
                        startBootSequence();
                    }, 1000);
                }, 1000);
                return;
            }
            response = "ERREUR FATALE. Impossible de lancer l'interface sans avoir extrait les profils utilisateurs.";
        } else if (cmd !== "") {
            response = `Commande '${cmd}' introuvable.`;
        }

        hackOutput.textContent += response + "\n";
        hackOutput.scrollTop = hackOutput.scrollHeight;
    });

    const authorizedUsers = {
        "noah bennett": "n.bennett",
        "olivia reynolds": "o.reynolds",
        "madison brooks": "m.brooks",
        "emily carter": "e.carter"
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = "";
        const rawInput = usernameInput.value.trim().toLowerCase();

        if (authorizedUsers[rawInput]) {
            sessionStorage.setItem('registre_active_user', authorizedUsers[rawInput]);
            sessionStorage.setItem('registre_display_name', usernameInput.value.trim());
            window.registreAudio?.play('authSuccess', { volume: 0.34 });
            errorMessage.style.color = "#27ae60";
            errorMessage.textContent = "Habilitation confirmée. Chargement du profil...";
            window.setTimeout(() => { window.location.href = "desktop.html"; }, 1200);
        } else {
            window.registreAudio?.play('authError', { volume: 0.26 });
            errorMessage.style.color = "var(--error-color)";
            errorMessage.textContent = "Erreur : Identifiant inconnu ou profil archivé.";
            usernameInput.value = "";
            usernameInput.focus();
        }
    });
});
