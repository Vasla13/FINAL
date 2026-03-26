document.addEventListener("DOMContentLoaded", () => {
    
    const appButtons = document.querySelectorAll('.app-link');
    
    appButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const appId = e.target.getAttribute('data-app');
            launchApp(appId);
        });
    });

    function launchApp(appId) {
        const userData = vmData[currentUser]; 
        let contentContainer;

        switch(appId) {
            case 'explorer':
                contentContainer = createWindow('explorer', `${userData.rootFolder}`, 700, 450);
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
                contentContainer = createWindow('synthesis', `Aperçu Document - ${userData.synthesis.title}`, 650, 500);
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
        
        const listPane = container.querySelector('.list-pane');
        const detailPane = container.querySelector('.detail-pane');

        dataArray.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            let displayTitle = item[titleKey];
            if (isMessage) displayTitle = `De: ${item[titleKey]}`;

            div.innerHTML = `
                <div>${displayTitle}</div>
                <div class="item-meta">${item[metaKey] || item.summary || ''}</div>
            `;
            
            div.addEventListener('click', () => {
                container.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                
                // Si c'est le diaporama terrifiant
                if (item.type === "slideshow") {
                    let currentSlide = 0;
                    const renderSlide = () => {
                        const slide = item.slides[currentSlide];
                        detailPane.innerHTML = `
                            <div class="slideshow-container">
                                <div class="slide-target">CIBLE ${currentSlide + 1} / ${item.slides.length}</div>
                                <div class="slide-name">${slide.name}</div>
                                <div class="slide-status" style="color: ${slide.color}; border-color: ${slide.color};">${slide.status}</div>
                                <div class="slide-desc">${slide.desc}</div>
                                <div class="slide-controls">
                                    <button class="slide-btn" id="prevSlide">◀ PRÉCÉDENT</button>
                                    <button class="slide-btn" id="nextSlide">SUIVANT ▶</button>
                                </div>
                            </div>
                        `;
                        document.getElementById('prevSlide').addEventListener('click', () => {
                            currentSlide = (currentSlide > 0) ? currentSlide - 1 : item.slides.length - 1;
                            renderSlide();
                        });
                        document.getElementById('nextSlide').addEventListener('click', () => {
                            currentSlide = (currentSlide < item.slides.length - 1) ? currentSlide + 1 : 0;
                            renderSlide();
                        });
                    };
                    renderSlide();
                } 
                // Affichage standard
                else {
                    let textToDisplay = item[contentKey];
                    if (item.type === "corrupt" || item.type === "deleted") {
                        detailPane.innerHTML = `<span class="corrupt-text">[ERREUR SYSTÈME] ${textToDisplay}</span>`;
                    } else if (isMessage) {
                        detailPane.innerHTML = `<strong>De :</strong> ${item.from}<br><strong>À :</strong> ${item.to}<br><strong>Date :</strong> ${item.date}<br><br>-------------------<br><br>${textToDisplay}`;
                    } else {
                        detailPane.textContent = textToDisplay;
                    }
                }
            });
            listPane.appendChild(div);
        });
    }

    function renderDocument(container, synthData) {
        container.innerHTML = `
            <div class="doc-view">
                <div class="doc-title">${synthData.title}</div>
                <div style="margin-bottom:20px; font-weight:bold;">Objet : ${synthData.subject}</div>
                <div class="doc-body">${synthData.content}</div>
            </div>
        `;
    }

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
                outputDiv.textContent += `\n> ${command}\n`;

                let response = "";
                if (command === "help") response = "Commandes disponibles : list, open [fichier], status, users, logs";
                else if (command === "status") response = userData.terminal.status || "Statut non disponible.";
                else if (command === "logs") response = userData.terminal.logs || "Aucune alerte critique.";
                else if (command === "users") response = userData.terminal.users || "Accès restreint.";
                else if (command === "list") response = userData.terminal.list || "Utilisez l'Explorateur pour lister l'arborescence.";
                else if (command.startsWith("open")) response = "Erreur : Ouverture via terminal restreinte. Utilisez l'Explorateur.";
                else if (command !== "") response = "Commande non reconnue. Tentative consignée.";

                if (response) outputDiv.textContent += `${response}\n`;
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
        });
    }
});