document.addEventListener("DOMContentLoaded", () => {
    
    // Écouteurs sur les boutons du menu latéral
    document.querySelectorAll('.app-link').addEventListener = function() {}; // Reset pour sécurité
    const appButtons = document.querySelectorAll('.app-link');
    
    appButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const appId = e.target.getAttribute('data-app');
            launchApp(appId);
        });
    });

    function launchApp(appId) {
        const userData = vmData[currentUser]; // Provient de data.js
        let contentContainer;

        switch(appId) {
            case 'explorer':
                contentContainer = createWindow('explorer', `${userData.rootFolder}`, 650, 400);
                if(contentContainer) renderSplitView(contentContainer, userData.explorer, 'name', 'type', 'content');
                break;
            case 'messages':
                contentContainer = createWindow('messages', `Messagerie Interne - ${currentUser}`, 600, 350);
                if(contentContainer) renderSplitView(contentContainer, userData.messages, 'from', 'date', 'content', true);
                break;
            case 'logs':
                contentContainer = createWindow('logs', `Journaux d'Activité`, 550, 350);
                if(contentContainer) renderSplitView(contentContainer, userData.logs, 'id', 'date', 'content');
                break;
            case 'synthesis':
                contentContainer = createWindow('synthesis', `Aperçu Document - ${userData.synthesis.title}`, 600, 500);
                if(contentContainer) renderDocument(contentContainer, userData.synthesis);
                break;
            case 'terminal':
                contentContainer = createWindow('terminal', `C:\\Windows\\System32\\cmd.exe - Interface Restreinte`, 550, 350);
                if(contentContainer) renderTerminal(contentContainer, userData);
                break;
        }
    }

    // Fonction générique pour Explorateur, Messages et Logs (Interface en 2 colonnes)
    function renderSplitView(container, dataArray, titleKey, metaKey, contentKey, isMessage = false) {
        container.innerHTML = `
            <div class="split-view">
                <div class="list-pane"></div>
                <div class="detail-pane">Sélectionnez une entrée pour afficher le contenu.</div>
            </div>
        `;
        
        const listPane = container.querySelector('.list-pane');
        const detailPane = container.querySelector('.detail-pane');

        dataArray.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            
            let displayTitle = item[titleKey];
            if (isMessage) displayTitle = `De: ${item[titleKey]}`;

            div.innerHTML = `
                <div>${displayTitle}</div>
                <div class="item-meta">${item[metaKey] || item.summary || ''}</div>
            `;
            
            div.addEventListener('click', () => {
                // Gestion de la classe 'active'
                container.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                
                // Formatage du contenu selon son état (corrompu ou non)
                let textToDisplay = item[contentKey];
                if (item.type === "corrupt" || item.type === "deleted") {
                    detailPane.innerHTML = `<span class="corrupt-text">[ERREUR SYSTÈME] ${textToDisplay}</span>`;
                } else if (isMessage) {
                    detailPane.innerHTML = `<strong>De :</strong> ${item.from}\n<strong>À :</strong> ${item.to}\n<strong>Date :</strong> ${item.date}\n\n-------------------\n\n${textToDisplay}`;
                } else {
                    detailPane.textContent = textToDisplay;
                }
            });
            listPane.appendChild(div);
        });
    }

    // Fonction pour l'affichage de la Synthèse
    function renderDocument(container, synthData) {
        container.innerHTML = `
            <div class="doc-view">
                <div class="doc-title">${synthData.title}</div>
                <div style="margin-bottom:20px; font-weight:bold;">Objet : ${synthData.subject}</div>
                <div class="doc-body">${synthData.content}</div>
            </div>
        `;
    }

    // Fonction pour le Terminal
    function renderTerminal(container, userData) {
        container.classList.add('terminal-window');
        container.innerHTML = `
            <div class="terminal-output">PROJET REGISTRE - OS v4.02
Droit d'accès : ADMINISTRATIF.
Tapez 'help' pour la liste des commandes.
</div>
            <div class="terminal-input-line">
                <span class="terminal-prompt">></span>
                <input type="text" class="terminal-input" autocomplete="off" spellcheck="false">
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
                
                // Afficher la commande tapée
                outputDiv.textContent += `\n> ${command}\n`;

                // Logique des commandes
                let response = "";
                if (command === "help") {
                    response = "Commandes disponibles : list, open [fichier], status, users, logs";
                } else if (command === "status") {
                    response = userData.terminal.status || "Statut non disponible.";
                } else if (command === "logs") {
                    response = userData.terminal.logs || "Aucune alerte critique.";
                } else if (command === "users") {
                    response = userData.terminal.users || "N.Bennett [Actif], O.Reynolds [Actif], M.Brooks [Actif], E.Carter [Actif]";
                } else if (command === "list") {
                    response = userData.terminal.list || "Utilisez l'Explorateur pour lister l'arborescence.";
                } else if (command.startsWith("open")) {
                    response = "Erreur : Ouverture de fichier via terminal restreinte. Veuillez utiliser le module graphique Explorateur.";
                } else if (command !== "") {
                    response = "Commande non reconnue. Cette tentative a été consignée au profil.";
                }

                if (response) {
                    outputDiv.textContent += `${response}\n`;
                }
                
                // Auto-scroll vers le bas
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
        });
    }
});