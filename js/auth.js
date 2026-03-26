document.addEventListener("DOMContentLoaded", () => {
    const bootScreen = document.getElementById('boot-screen');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const errorMessage = document.getElementById('errorMessage');
    let bootAudio = null;

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

    let lineIndex = 0;
    function typeBootLines() {
        if (lineIndex < bootSequence.length) {
            bootScreen.textContent += bootSequence[lineIndex] + "\n";
            lineIndex++;
            setTimeout(typeBootLines, Math.random() * 200 + 100); 
        } else {
            setTimeout(() => {
                if (window.registreAudio) {
                    window.registreAudio.stop(bootAudio, 700);
                }
                bootScreen.style.opacity = '0';
                setTimeout(() => {
                    bootScreen.style.display = 'none';
                    usernameInput.focus();
                }, 1000);
            }, 800);
        }
    }
    
    // Si pas encore connecté, lancer le boot
    if (!sessionStorage.getItem('registre_active_user')) {
        bootAudio = window.registreAudio?.play('boot', { loop: true, volume: 0.22 });
        typeBootLines();
    } else {
        bootScreen.style.display = 'none';
    }

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
            setTimeout(() => { window.location.href = "desktop.html"; }, 1200);
        } else {
            window.registreAudio?.play('authError', { volume: 0.26 });
            errorMessage.style.color = "var(--error-color)";
            errorMessage.textContent = "Erreur : Identifiant inconnu ou profil archivé.";
            usernameInput.value = "";
            usernameInput.focus();
        }
    });
});
