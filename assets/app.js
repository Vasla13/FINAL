const users = {
  'bennett|noah': {
    name: 'Noah Bennett',
    role: 'Cellule analytique / architecture du protocole',
    status: 'Session restaurée partiellement',
    focus: 'Structure, filtrage, mise en scène du Registre',
    overview: [
      {
        title: 'État de session',
        code: 'NB-SESSION-01',
        date: '02.11.2009',
        body: `Session fondatrice reconnue. Une partie des journaux personnels a été supprimée avant transfert. Les éléments encore présents montrent une implication directe dans la construction de la surface publique du Projet Registre.`
      },
      {
        title: 'Position interne',
        code: 'NB-ROLE-02',
        date: '13.01.2010',
        body: `Le titulaire de cette session semble avoir travaillé sur la logique de diffusion des archives. Plusieurs notes indiquent que l'information ne devait jamais être cachée complètement, seulement répartie de manière à sélectionner les profils qui accepteraient de la suivre jusqu'au bout.`
      }
    ],
    register: [
      {
        title: 'NOTE_SURFACE_03.pdf',
        meta: ['miroir public', 'filtrage'],
        text: `La couche dite « Registre » n'a pas été conçue comme une fiction totale. Les entrées de surface proviennent d'événements réels, mais leur ordre, leur densité et leur proximité ont été ajustés afin d'augmenter le taux d'engagement volontaire.`
      },
      {
        title: 'PROTOCOLE_DE_DISPERSION.txt',
        meta: ['procédure', 'archive'],
        text: `La cohérence apparente doit rester suffisante pour retenir les sujets curieux. Les contradictions contrôlées ne doivent apparaître qu'après exposition répétée.`
      }
    ],
    observation: [
      {
        title: 'Matrice de progression',
        meta: ['analyse comportementale'],
        text: `Indicateurs suivis : persistance sans validation, initiative autonome, volonté de corrélation, tolérance au manque d'information, dérive interprétative.`,
      },
      {
        title: 'Commentaire interne',
        meta: ['annotation'],
        text: `Le sujet qui poursuit malgré l'absence de réponse directe fournit davantage de valeur que le sujet convaincu trop vite.`
      }
    ],
    incidents: [
      {
        title: 'INCIDENT_NB-14.log',
        meta: ['suppression', 'archive'],
        text: `Segment retiré avant sauvegarde.
Motif de retrait : corrélation devenue trop explicite.
Maintien des fragments recommandé afin de conserver la trajectoire du sujet.`
      }
    ],
    synthesis: [
      {
        title: 'SYNTHESE_NB_FINAL',
        text: `Le Registre n'a jamais constitué l'objet principal du protocole. Il a servi de surface stable, assez crédible pour accueillir l'observation de ceux qui choisissaient d'y entrer. Les anomalies n'ont pas été supprimées ; elles ont été ordonnées. Les sujets n'ont pas été forcés ; ils ont été attirés.`
      }
    ],
    terminal: `NOAH.BENNETT / CONSULTATION ANALYTIQUE

> ouvrir journal_structure
Le registre public n'était pas un mensonge complet.
Il était une architecture d'entrée.

> ouvrir note_finale
Tout sujet ayant atteint C17-C18 a démontré :
- persistance
- engagement autonome
- capacité à accepter une vérité fragmentée

> statut
CONSULTATION ACCORDÉE`
  },
  'reynolds|olivia': {
    name: 'Olivia Reynolds',
    role: 'Coordination interne / validation administrative',
    status: 'Session restaurée partiellement',
    focus: 'Suivi, classement, continuité opérationnelle',
    overview: [
      {
        title: 'État de session',
        code: 'OR-SESSION-01',
        date: '17.02.2011',
        body: `Les journaux de cette session montrent une fonction de coordination. Plusieurs fichiers mentionnent la nécessité de maintenir une façade suffisamment sérieuse pour que les observateurs ne la perçoivent jamais comme un jeu.`
      },
      {
        title: 'Validation continue',
        code: 'OR-ROLE-03',
        date: '26.04.2011',
        body: `Les cycles d'archivage et de réapparition ont été suivis ici. Le but n'était pas seulement de conserver l'information, mais de gérer sa réintroduction de manière sélective.`
      }
    ],
    register: [
      {
        title: 'NOTICE_DE_COHERENCE.pdf',
        meta: ['administration', 'façade'],
        text: `La crédibilité repose sur la répétition des formes administratives : notes, tableaux, protocoles, renvois, versions, sigles. Une anomalie sans cadre perd sa valeur. Une anomalie classée devient suivie.`
      },
      {
        title: 'DISTRIBUTION_ARCHIVE_03.msg',
        meta: ['interne', 'suivi'],
        text: `Ne pas densifier davantage la couche publique. La saturation réduit l'investissement. Le manque contrôlé demeure plus efficace que l'excès.`
      }
    ],
    observation: [
      {
        title: 'Grille de rétention',
        meta: ['mesure'],
        text: `La progression prolongée dépend moins du mystère lui-même que du sentiment de proximité avec une structure invisible.`
      },
      {
        title: 'Suivi des retours',
        meta: ['résumé'],
        text: `Les sujets qui reviennent plusieurs fois sur les mêmes entrées sans réponse claire présentent une disposition favorable à l'intégration structurelle.`
      }
    ],
    incidents: [
      {
        title: 'ALERTE_OR-07.log',
        meta: ['corruption', 'restauration'],
        text: `Suppression volontaire détectée sur correspondances internes. Les chaînes nominatives ont été effacées avant fermeture. Conservation d'une copie partielle impossible.`
      }
    ],
    synthesis: [
      {
        title: 'SYNTHESE_OR_FINAL',
        text: `Le Projet Registre a servi à maintenir une relation durable entre une structure invisible et des sujets libres de poursuivre ou non. La réussite du protocole tenait à cette impression essentielle : personne n'était convoqué, chacun se présentait de lui-même.`
      }
    ],
    terminal: `OLIVIA.REYNOLDS / COORDINATION INTERNE

> ouvrir validation_continue
L'autorité la plus efficace n'est pas celle qui ordonne.
C'est celle que le sujet reconstruit seul.

> ouvrir note_distribution
La trajectoire volontaire vaut davantage qu'une désignation directe.

> statut
SECTIONS ADMINISTRATIVES PARTIELLES`
  },
  'brooks|madison': {
    name: 'Madison Brooks',
    role: 'Observation humaine / lecture des comportements',
    status: 'Session restaurée partiellement',
    focus: 'Réactions, profils, seuils de persistance',
    overview: [
      {
        title: 'État de session',
        code: 'MB-SESSION-01',
        date: '08.08.2012',
        body: `Cette session contient les notes les plus directes sur la nature comportementale du protocole. Plusieurs annotations confirment que l'intérêt principal du projet n'était pas l'anomalie, mais le sujet qui accepte de la suivre malgré son incomplétude.`
      },
      {
        title: 'Profilage progressif',
        code: 'MB-ROLE-04',
        date: '14.08.2012',
        body: `Le classement des individus se faisait par traces indirectes : rythme de progression, manière de relier les fragments, degré d'investissement sans validation externe, capacité à supporter l'incertitude.`
      }
    ],
    register: [
      {
        title: 'ANNOTATION_COUCHE_PUBLIQUE.pdf',
        meta: ['surface', 'sujet'],
        text: `La surface publique n'est utile que si elle reste assez ouverte pour permettre la projection du sujet. Une réponse trop nette referme trop vite le comportement observé.`
      }
    ],
    observation: [
      {
        title: 'Niveaux d'engagement',
        meta: ['observation', 'profils'],
        text: `Curiosité initiale / retour volontaire / corrélation active / investissement personnel / passage de seuil. Le passage de seuil est atteint lorsque le sujet continue sans garantie de récompense.`
      },
      {
        title: 'Note interne',
        meta: ['commentaire'],
        text: `À partir d'un certain point, le sujet ne suit plus les anomalies : il suit la structure qui les distribue. C'est à ce moment que l'observation devient la plus fiable.`
      }
    ],
    incidents: [
      {
        title: 'RUPTURE_MBX-03.log',
        meta: ['effacement', 'sujet'],
        text: `Plusieurs évaluations individuelles supprimées avant archivage. Les conclusions globales demeurent cependant intactes : le protocole produit ses meilleurs résultats lorsque le sujet croit se rapprocher d'un secret, non lorsqu'il le possède.`
      }
    ],
    synthesis: [
      {
        title: 'SYNTHESE_MB_FINAL',
        text: `Les anomalies n'ont jamais suffi à expliquer la continuité du projet. Ce sont les sujets eux-mêmes qui ont donné sens au système. En poursuivant, ils ont créé la valeur du protocole. Le Registre ne les a pas simplement retenus : il les a révélés.`
      }
    ],
    terminal: `MADISON.BROOKS / LECTURE COMPORTEMENTALE

> ouvrir seuils
Un sujet devient lisible lorsqu'il poursuit au-delà du raisonnable.

> ouvrir conclusion
Le protocole n'observe pas la peur.
Il observe la persistance.

> statut
DONNÉES DE PROFIL RESTAURÉES PARTIELLEMENT`
  },
  'carter|emily': {
    name: 'Emily Carter',
    role: 'Projection / modélisation / synthèse finale',
    status: 'Session restaurée partiellement',
    focus: 'Projection des trajectoires et finalisation du protocole',
    overview: [
      {
        title: 'État de session',
        code: 'EC-SESSION-01',
        date: '21.05.2014',
        body: `Cette session contient les pièces les plus perturbantes. Plusieurs documents indiquent que certaines trajectoires internes avaient été modélisées avant de se produire effectivement. Les noms détaillés ont été retirés du présent environnement.`
      },
      {
        title: 'Projection structurelle',
        code: 'EC-ROLE-05',
        date: '30.05.2014',
        body: `L'objectif n'était pas de prédire chaque action, mais d'identifier des formes de progression suffisamment stables pour anticiper certaines intégrations futures.`
      }
    ],
    register: [
      {
        title: 'SCHEMA_DE_TRANSITION.pdf',
        meta: ['transition', 'fin'],
        text: `Le Registre public fonctionne comme première lecture. L'archive restaurée fonctionne comme seconde lecture. La conclusion n'est pas un secret révélé, mais un renversement : le sujet comprend tardivement qu'il était lui-même l'objet stable du système.`
      }
    ],
    observation: [
      {
        title: 'Projection de trajectoire',
        meta: ['modélisation'],
        text: `Certaines progressions individuelles peuvent être estimées à partir d'indices faibles : persistance, capacité d'interprétation, intégration du doute, acceptation des couches contradictoires.`
      }
    ],
    incidents: [
      {
        title: 'EC-LAST-11.log',
        meta: ['fermeture', 'final'],
        text: `Avant transfert sur C17-C18, plusieurs blocs nominaux ont été volontairement neutralisés. Maintenir uniquement la structure suffisante pour que la conclusion demeure intelligible.`
      }
    ],
    synthesis: [
      {
        title: 'SYNTHESE_EC_FINAL',
        text: `Conclusion opérationnelle : le Projet Registre n'avait pas pour finalité première la compréhension des anomalies. Il visait la compréhension de ceux qui acceptaient d'entrer dans un système incomplet et de s'y maintenir. Toute personne ayant atteint cette archive doit être considérée comme une entrée active du protocole.`
      },
      {
        title: 'NOTE FINALE',
        text: `Les intégrations observées n'ont pas toujours constitué des surprises. Certaines trajectoires avaient été estimées avant leur réalisation effective. Le simple fait d'être arrivé jusqu'ici confirme la validité du modèle.`
      }
    ],
    terminal: `EMILY.CARTER / MODÉLISATION FINALE

> ouvrir note_finale
Le sujet venu chercher la vérité fournit déjà sa réponse.

> ouvrir conclusion
Le Registre n'a jamais servi à comprendre les anomalies.
Il a servi à comprendre ceux qui choisissaient de les suivre.

> statut
ARCHIVE FINALE ACTIVE`
  }
};

const bootScreen = document.getElementById('boot-screen');
const loginScreen = document.getElementById('login-screen');
const workspaceScreen = document.getElementById('workspace-screen');
const enterSystem = document.getElementById('enter-system');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const userCard = document.getElementById('user-card');
const topbarTitle = document.getElementById('topbar-title');
const logoutBtn = document.getElementById('logout-btn');

const tabMap = {
  overview: document.getElementById('tab-overview'),
  register: document.getElementById('tab-register'),
  observation: document.getElementById('tab-observation'),
  incidents: document.getElementById('tab-incidents'),
  synthesis: document.getElementById('tab-synthesis'),
  terminal: document.getElementById('tab-terminal')
};

enterSystem.addEventListener('click', () => {
  bootScreen.classList.remove('active');
  bootScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginScreen.classList.add('active');
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const lastName = document.getElementById('lastName').value.trim().toLowerCase();
  const firstName = document.getElementById('firstName').value.trim().toLowerCase();
  const key = `${lastName}|${firstName}`;
  const user = users[key];

  if (!user) {
    loginMessage.textContent = 'SESSION INCONNUE / identifiant non restauré';
    return;
  }

  loginMessage.textContent = '';
  renderWorkspace(user);
  loginScreen.classList.remove('active');
  loginScreen.classList.add('hidden');
  workspaceScreen.classList.remove('hidden');
  workspaceScreen.classList.add('active');
});

logoutBtn.addEventListener('click', () => {
  workspaceScreen.classList.remove('active');
  workspaceScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginScreen.classList.add('active');
  document.getElementById('lastName').value = '';
  document.getElementById('firstName').value = '';
  loginMessage.textContent = '';
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

function cardHTML(item) {
  return `
    <article class="doc-card">
      <h3>${item.title}</h3>
      <div class="doc-meta">
        ${(item.code ? `<span class="meta-pill">${item.code}</span>` : '')}
        ${(item.date ? `<span class="meta-pill">${item.date}</span>` : '')}
        ${(item.meta || []).map(m => `<span class="meta-pill">${m}</span>`).join('')}
      </div>
      <p>${item.body || item.text}</p>
    </article>
  `;
}

function renderWorkspace(user) {
  userCard.innerHTML = `
    <h2>${user.name}</h2>
    <p>${user.role}</p>
    <p>${user.status}</p>
    <p>${user.focus}</p>
  `;

  topbarTitle.textContent = `CONSULTATION / ${user.name.toUpperCase()}`;

  tabMap.overview.innerHTML = `
    <div class="grid">${user.overview.map(cardHTML).join('')}</div>
    <div class="doc-card">
      <h3>Lecture globale</h3>
      <p>L'environnement consulté n'est pas un poste employé complet mais une reconstruction locale des sections internes du projet. La restauration à partir de C17-C18 conserve la logique centrale : surface publique, observation, incidents, synthèse.</p>
      <div class="note">Chaque session éclaire le projet sous un angle différent. La vérité complète apparaît par croisement des quatre accès fondatifs.</div>
    </div>
  `;

  tabMap.register.innerHTML = `<div class="grid">${user.register.map(cardHTML).join('')}</div>`;
  tabMap.observation.innerHTML = `<div class="grid">${user.observation.map(cardHTML).join('')}</div>`;
  tabMap.incidents.innerHTML = `<div class="grid">${user.incidents.map(cardHTML).join('')}</div>`;
  tabMap.synthesis.innerHTML = `
    <div class="grid">${user.synthesis.map(cardHTML).join('')}</div>
    <article class="doc-card">
      <h3>Conclusion transversale</h3>
      <p class="reveal">Le Registre n'a jamais servi à comprendre les anomalies. Il a servi à comprendre ceux qui choisissaient de les suivre.</p>
      <p>Cette archive clôt la logique du disque. Les noms projetés et les profils prédits ne sont pas affichés ici ; seules subsistent les structures qui prouvent que le système les anticipait déjà.</p>
      <div class="footer-line">Toute personne ayant poursuivi jusqu'à cette archive doit désormais être considérée comme une entrée active.</div>
    </article>
  `;
  tabMap.terminal.innerHTML = `
    <article class="terminal-card">
      <h3>Console restaurée</h3>
      <div class="terminal-window">${user.terminal}</div>
      <div class="note">La console ne donne pas accès à d'autres noms. Les blocs nominaux associés aux projections ont été retirés avant transfert.</div>
    </article>
  `;

  document.querySelectorAll('.nav-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-view').forEach((view, i) => view.classList.toggle('active', i === 0));
}
