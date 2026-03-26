document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const errorMessage = document.getElementById('errorMessage');
    const timeDisplay = document.getElementById('system-time');

    // Mise à jour de l'heure système dans le footer
    function updateTime() {
        const now = new Date();
        timeDisplay.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
    setInterval(updateTime, 1000);
    updateTime();

    // Liste stricte des utilisateurs autorisés
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
            // Sauvegarde de l'utilisateur dans la session de l'ordinateur
            sessionStorage.setItem('registre_active_user', authorizedUsers[rawInput]);
            sessionStorage.setItem('registre_display_name', usernameInput.value.trim());
            
            // Simulation d'un léger délai de traitement serveur
            errorMessage.style.color = "#27ae60";
            errorMessage.textContent = "Habilitation confirmée. Chargement du profil...";
            
            setTimeout(() => {
                window.location.href = "desktop.html";
            }, 1200);
        } else {
            // Rejet froid et administratif
            errorMessage.style.color = "var(--error-color)";
            errorMessage.textContent = "Erreur : Identifiant inconnu ou profil archivé.";
            usernameInput.value = "";
            usernameInput.focus();
        }
    });
});