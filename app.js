/* ==========================================================================
   EkklesiaManager — Moteur de Données & Logique SPA
   Contexte : APF Lomé, Togo
   ========================================================================== */

// --- Variables d'État Globale ---
let db = null;
let activeView = 'dashboard';
let currentMembersViewMode = 'grid';
let activeMemberId = null;
let activeCultId = null;
let activeProfileTab = 'general';
let charts = {};

// --- Palette de Couleurs HSL pour Chart.js ---
const chartColors = {
  primary: '#6366f1',
  primaryAlpha: 'rgba(99, 102, 241, 0.2)',
  success: '#10b981',
  successAlpha: 'rgba(16, 185, 129, 0.2)',
  warning: '#f59e0b',
  warningAlpha: 'rgba(245, 158, 11, 0.2)',
  danger: '#ef4444',
  dangerAlpha: 'rgba(239, 68, 68, 0.2)',
  info: '#06b6d4',
  infoAlpha: 'rgba(6, 182, 212, 0.2)',
  text: '#f3f4f6',
  grid: 'rgba(255, 255, 255, 0.08)'
};

// --- Générateur d'Avatars SVG en Base64 (Ultra-premium, Offline-safe) ---
function generatePremiumSvgAvatar(initials, gender, index = 0) {
  const gradients = [
    ['#4f46e5', '#818cf8'], // Indigo
    ['#7c3aed', '#a78bfa'], // Violet
    ['#059669', '#34d399'], // Émeraude
    ['#db2777', '#f472b6'], // Rose
    ['#d97706', '#fbbf24']  // Ambre
  ];
  const selectedGradient = gradients[index % gradients.length];
  const bgGradId = `bg-grad-${initials}-${index}`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="${bgGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${selectedGradient[0]}" />
        <stop offset="100%" stop-color="${selectedGradient[1]}" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#${bgGradId})" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', sans-serif" font-weight="700" font-size="38" fill="#ffffff" letter-spacing="-1">${initials}</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// --- JEU DE DONNÉES DE SEEDING INITIAL ---
const initialSeedData = {
  utilisateurs: [
    { id: "usr_1", membre_id: "mbr_1", identifiant: "pasteur", mot_de_passe: "apf2026", role: "Administrateur" },
    { id: "usr_2", membre_id: "mbr_2", identifiant: "assistant", mot_de_passe: "apf2026", role: "Secrétaire" }
  ],
  cellules: [
    { id: "cell_1", nom: "Adidogomé A" },
    { id: "cell_2", nom: "Adidogomé B" },
    { id: "cell_3", nom: "Hedzranawoé" },
    { id: "cell_4", nom: "Agoè-Assiyéye" },
    { id: "cell_5", nom: "Bè-Plage" }
  ],
  departements: ["Louange", "Intercession", "Diaconie", "Jeunesse", "Enfants", "Évangélisation", "Enseignement"],
  formations: ["Cours d'intégration", "École des Disciples", "Séminaire de Leadership", "Formation de Diacres"],
  
  membres: [
    {
      id: "mbr_1",
      nom: "TETTEGAH",
      prenoms: "Gershon",
      photo: "",
      date_naissance: "1978-04-12",
      sexe: "H",
      situation_matrimoniale: "Marié(e)",
      adresse: "Adidogomé, Lomé",
      telephone: "+228 90 12 34 56",
      whatsapp: "+228 90 12 34 56",
      email: "gershon.tettegah@apf.tg",
      profession: "Pasteur Principal",
      date_integration: "2010-01-15",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "1994-08-20",
        lieu_conversion: "Lomé",
        date_bapteme_eau: "1995-02-10",
        celebrant_bapteme_eau: "Pasteur KOFFI",
        date_bapteme_esprit: "1996-05-24",
        formations: ["Cours d'intégration", "École des Disciples", "Séminaire de Leadership"],
        notes_pastorales: "Conducteur spirituel mature, visionnaire de la communauté APF Lomé."
      },
      appartenance: {
        cellule_id: "cell_1",
        departements: ["Enseignement"],
        fonction: "Responsable",
        historique_responsabilites: [
          { poste: "Pasteur Auxiliaire", periode: "2010 - 2015" },
          { poste: "Pasteur Principal", periode: "2015 - Présent" }
        ]
      },
      relations: { conjoint_id: "mbr_2", enfants_ids: ["mbr_5", "mbr_6"] }
    },
    {
      id: "mbr_2",
      nom: "TETTEGAH",
      prenoms: "Grace",
      photo: "",
      date_naissance: "1983-09-18",
      sexe: "F",
      situation_matrimoniale: "Marié(e)",
      adresse: "Adidogomé, Lomé",
      telephone: "+228 91 23 45 67",
      whatsapp: "+228 91 23 45 67",
      email: "grace.tettegah@apf.tg",
      profession: "Enseignante",
      date_integration: "2010-01-15",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "1999-11-05",
        lieu_conversion: "Kpalimé",
        date_bapteme_eau: "2000-04-20",
        celebrant_bapteme_eau: "Pasteur AMEDEE",
        date_bapteme_esprit: "2001-08-12",
        formations: ["Cours d'intégration", "École des Disciples"],
        notes_pastorales: "Épouse du pasteur, investie auprès du département des Femmes et de la Diaconie."
      },
      appartenance: {
        cellule_id: "cell_1",
        departements: ["Diaconie", "Enfants"],
        fonction: "Responsable",
        historique_responsabilites: [
          { poste: "Monitrice des enfants", periode: "2011 - 2018" },
          { poste: "Responsable Diaconie", periode: "2018 - Présent" }
        ]
      },
      relations: { conjoint_id: "mbr_1", enfants_ids: ["mbr_5", "mbr_6"] }
    },
    {
      id: "mbr_3",
      nom: "AMENYAGLO",
      prenoms: "Koffi Mawuli",
      photo: "",
      date_naissance: "1985-02-28",
      sexe: "H",
      situation_matrimoniale: "Marié(e)",
      adresse: "Hedzranawoé, Lomé",
      telephone: "+228 93 45 67 89",
      whatsapp: "+228 93 45 67 89",
      email: "koffi.amenyaglo@apf.tg",
      profession: "Comptable",
      date_integration: "2012-05-10",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "2002-03-12",
        lieu_conversion: "Lomé",
        date_bapteme_eau: "2002-12-25",
        celebrant_bapteme_eau: "Pasteur TETTEGAH",
        date_bapteme_esprit: "2003-06-15",
        formations: ["Cours d'intégration", "École des Disciples", "Formation de Diacres"],
        notes_pastorales: "Fidèle et rigoureux. Gère le secrétariat administratif et les contributions financières."
      },
      appartenance: {
        cellule_id: "cell_3",
        departements: ["Diaconie", "Intercession"],
        fonction: "Responsable",
        historique_responsabilites: [
          { poste: "Trésorier adjoint", periode: "2013 - 2018" },
          { poste: "Secrétaire d'église", periode: "2018 - Présent" }
        ]
      },
      relations: { conjoint_id: "", enfants_ids: [] }
    },
    {
      id: "mbr_4",
      nom: "ADZO",
      prenoms: "Abla Delali",
      photo: "",
      date_naissance: "1994-05-24",
      sexe: "F",
      situation_matrimoniale: "Célibataire",
      adresse: "Agoè, Lomé",
      telephone: "+228 99 88 77 66",
      whatsapp: "+228 99 88 77 66",
      email: "delali.adzo@apf.tg",
      profession: "Chantre & Étudiante",
      date_integration: "2018-09-01",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "2010-06-15",
        lieu_conversion: "Atakpamé",
        date_bapteme_eau: "2011-08-10",
        celebrant_bapteme_eau: "Pasteur KANGA",
        date_bapteme_esprit: "2012-09-02",
        formations: ["Cours d'intégration"],
        notes_pastorales: "Talentueuse et fervente. Dirige le groupe de Louange."
      },
      appartenance: {
        cellule_id: "cell_4",
        departements: ["Louange", "Jeunesse"],
        fonction: "Responsable",
        historique_responsabilites: [
          { poste: "Chantre simple", periode: "2018 - 2021" },
          { poste: "Conductrice de Louange", periode: "2021 - Présent" }
        ]
      },
      relations: { conjoint_id: "", enfants_ids: [] }
    },
    {
      id: "mbr_5",
      nom: "TETTEGAH",
      prenoms: "David",
      photo: "",
      date_naissance: "2012-07-05",
      sexe: "H",
      situation_matrimoniale: "Célibataire",
      adresse: "Adidogomé, Lomé",
      telephone: "",
      whatsapp: "",
      email: "",
      profession: "Élève (Collège)",
      date_integration: "2012-07-05",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "2022-04-10",
        lieu_conversion: "Lomé",
        date_bapteme_eau: "2024-08-18",
        celebrant_bapteme_eau: "Pasteur TETTEGAH",
        date_bapteme_esprit: "",
        formations: ["École des Enfants"],
        notes_pastorales: "Fils aîné du Pasteur, participe activement à la classe des ados."
      },
      appartenance: {
        cellule_id: "cell_1",
        departements: ["Enfants", "Jeunesse"],
        fonction: "Membre simple",
        historique_responsabilites: []
      },
      relations: { conjoint_id: "", enfants_ids: [] }
    },
    {
      id: "mbr_6",
      nom: "TETTEGAH",
      prenoms: "Joy",
      photo: "",
      date_naissance: "2016-11-20",
      sexe: "F",
      situation_matrimoniale: "Célibataire",
      adresse: "Adidogomé, Lomé",
      telephone: "",
      whatsapp: "",
      email: "",
      profession: "Élève (Primaire)",
      date_integration: "2016-11-20",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "",
        lieu_conversion: "",
        date_bapteme_eau: "",
        celebrant_bapteme_eau: "",
        date_bapteme_esprit: "",
        formations: [],
        notes_pastorales: "Cadette de la famille pastorale."
      },
      appartenance: {
        cellule_id: "cell_1",
        departements: ["Enfants"],
        fonction: "Membre simple",
        historique_responsabilites: []
      },
      relations: { conjoint_id: "", enfants_ids: [] }
    },
    {
      id: "mbr_7",
      nom: "KPADENOU",
      prenoms: "Komi Agbégnigan",
      photo: "",
      date_naissance: "1965-03-14",
      sexe: "H",
      situation_matrimoniale: "Marié(e)",
      adresse: "Bè, Lomé",
      telephone: "+228 92 34 56 78",
      whatsapp: "",
      email: "",
      profession: "Artisan menuisier",
      date_integration: "2014-06-20",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "1990-05-18",
        lieu_conversion: "Aného",
        date_bapteme_eau: "1990-11-04",
        celebrant_bapteme_eau: "Pasteur LAWSON",
        date_bapteme_esprit: "1992-04-12",
        formations: ["École des Disciples"],
        notes_pastorales: "Membre d'âge mûr, toujours fidèle aux travaux d'aménagement de l'église."
      },
      appartenance: {
        cellule_id: "cell_5",
        departements: ["Diaconie"],
        fonction: "Membre simple",
        historique_responsabilites: []
      },
      relations: { conjoint_id: "", enfants_ids: [] }
    },
    {
      id: "mbr_8",
      nom: "ASSOUMA",
      prenoms: "Fatima",
      photo: "",
      date_naissance: "2000-10-12",
      sexe: "F",
      situation_matrimoniale: "Célibataire",
      adresse: "Agoè, Lomé",
      telephone: "+228 98 76 54 32",
      whatsapp: "+228 98 76 54 32",
      email: "fatima.assouma@apf.tg",
      profession: "Couturière",
      date_integration: "2024-01-10",
      statut: "Actif",
      parcours_spirituel: {
        date_conversion: "2023-08-15",
        lieu_conversion: "Lomé",
        date_bapteme_eau: "2024-03-24",
        celebrant_bapteme_eau: "Pasteur TETTEGAH",
        date_bapteme_esprit: "",
        formations: ["Cours d'intégration"],
        notes_pastorales: "Nouvelle convertie dynamique, en cours de formation pour rejoindre l'Intercession."
      },
      appartenance: {
        cellule_id: "cell_4",
        departements: ["Évangélisation"],
        fonction: "Membre simple",
        historique_responsabilites: []
      },
      relations: { conjoint_id: "", enfants_ids: [] }
    },
    {
      id: "mbr_9",
      nom: "SOGLO",
      prenoms: "Messan Yawo",
      photo: "",
      date_naissance: "1988-12-05",
      sexe: "H",
      situation_matrimoniale: "Célibataire",
      adresse: "Bè, Lomé",
      telephone: "+228 90 88 22 11",
      whatsapp: "",
      email: "",
      profession: "Chauffeur",
      date_integration: "2021-02-14",
      statut: "Inactif",
      parcours_spirituel: {
        date_conversion: "2015-11-20",
        lieu_conversion: "Tsevié",
        date_bapteme_eau: "",
        celebrant_bapteme_eau: "",
        date_bapteme_esprit: "",
        formations: [],
        notes_pastorales: "Absent répété aux réunions. Nécessite une visite de relance par la cellule locale."
      },
      appartenance: {
        cellule_id: "cell_5",
        departements: [],
        fonction: "Membre simple",
        historique_responsabilites: []
      },
      relations: { conjoint_id: "", enfants_ids: [] }
    }
  ],
  
  visiteurs: [
    {
      id: "vis_1",
      nom: "KOFFI",
      prenoms: "Kwami Emmanuel",
      telephone: "+228 92 88 77 66",
      date_visite: "2026-05-03",
      statut: "Nouveau Converti",
      visite_pastorale: true,
      cours_base: true,
      bapteme: false,
      engagement: false,
      observations: "Réagit très positivement aux appels pastoraux. S'est inscrit à la cellule Adidogomé."
    },
    {
      id: "vis_2",
      nom: "ADANKPO",
      prenoms: "Eya Akofa",
      telephone: "+228 99 11 22 33",
      date_visite: "2026-05-10",
      statut: "Visiteur",
      visite_pastorale: true,
      cours_base: false,
      bapteme: false,
      engagement: false,
      observations: "Invitée par la soeur Delali. A apprécié l'accueil du groupe de Diaconie."
    },
    {
      id: "vis_3",
      nom: "LAWSON",
      prenoms: "Tété Folly",
      telephone: "+228 90 55 66 77",
      date_visite: "2026-05-17",
      statut: "Nouveau Converti",
      visite_pastorale: false,
      cours_base: false,
      bapteme: false,
      engagement: false,
      observations: "S'est avancé lors de l'appel à la fin du culte du dimanche 17 Mai."
    }
  ],
  
  cults: [
    {
      id: "clt_1",
      date: "2026-05-03",
      heure: "08:00",
      type: "Culte du dimanche",
      statut: "Terminé",
      theme: "La fidélité de Dieu dans l'épreuve",
      predicateur_id: "mbr_1",
      verset_cle: "1 Corinthiens 10:13",
      programme: [
        { segment: "Accueil & Prière d'ouverture", duree: 10, intervenant_id: "mbr_3" },
        { segment: "Louange & Adoration", duree: 45, intervenant_id: "mbr_4" },
        { segment: "Dîmes & Offrandes", duree: 15, intervenant_id: "mbr_2" },
        { segment: "Prédication", duree: 40, intervenant_id: "mbr_1" },
        { segment: "Annonces & Bénédiction", duree: 10, intervenant_id: "mbr_3" }
      ],
      intervenants_affectes: {
        precheur: "mbr_1",
        conducteur_louange: "mbr_4",
        moderateur: "mbr_3"
      },
      presences: ["mbr_1", "mbr_2", "mbr_3", "mbr_4", "mbr_5", "mbr_6", "mbr_7", "mbr_8"]
    },
    {
      id: "clt_2",
      date: "2026-05-10",
      heure: "08:00",
      type: "Culte du dimanche",
      statut: "Terminé",
      theme: "Porter du fruit digne de la repentance",
      predicateur_id: "mbr_3",
      verset_cle: "Luc 3:8",
      programme: [
        { segment: "Accueil & Prière d'ouverture", duree: 10, intervenant_id: "mbr_1" },
        { segment: "Louange & Adoration", duree: 40, intervenant_id: "mbr_4" },
        { segment: "Dîmes & Offrandes", duree: 15, intervenant_id: "mbr_2" },
        { segment: "Prédication", duree: 45, intervenant_id: "mbr_3" },
        { segment: "Bénédiction finale", duree: 10, intervenant_id: "mbr_1" }
      ],
      intervenants_affectes: {
        precheur: "mbr_3",
        conducteur_louange: "mbr_4",
        moderateur: "mbr_1"
      },
      presences: ["mbr_1", "mbr_2", "mbr_3", "mbr_4", "mbr_5", "mbr_6", "mbr_8"]
    },
    {
      id: "clt_3",
      date: "2026-05-17",
      heure: "08:00",
      type: "Culte du dimanche",
      statut: "Terminé",
      theme: "Le pouvoir de l'intercession commune",
      predicateur_id: "mbr_1",
      verset_cle: "Actes 12:5",
      programme: [
        { segment: "Accueil & Prière", duree: 10, intervenant_id: "mbr_3" },
        { segment: "Louange", duree: 40, intervenant_id: "mbr_4" },
        { segment: "Prédication", duree: 50, intervenant_id: "mbr_1" },
        { segment: "Prière d'impact & Bénédiction", duree: 20, intervenant_id: "mbr_1" }
      ],
      intervenants_affectes: {
        precheur: "mbr_1",
        conducteur_louange: "mbr_4",
        moderateur: "mbr_3"
      },
      presences: ["mbr_1", "mbr_2", "mbr_3", "mbr_4", "mbr_5", "mbr_6", "mbr_7"]
    },
    {
      id: "clt_4",
      date: "2026-05-24",
      heure: "08:00",
      type: "Culte du dimanche",
      statut: "Confirmé",
      theme: "La foi agissante par l'amour",
      predicateur_id: "mbr_1",
      verset_cle: "Galates 5:6",
      programme: [
        { segment: "Ouverture & Prière", duree: 10, intervenant_id: "mbr_3" },
        { segment: "Adoration & Louange", duree: 45, intervenant_id: "mbr_4" },
        { segment: "Parole de Foi (Message)", duree: 45, intervenant_id: "mbr_1" },
        { segment: "Appel & Communion", duree: 15, intervenant_id: "mbr_1" }
      ],
      intervenants_affectes: {
        precheur: "mbr_1",
        conducteur_louange: "mbr_4",
        moderateur: "mbr_3"
      },
      presences: []
    }
  ],
  
  contributions: [
    { id: "cnt_1", membre_id: "mbr_1", type: "Dîme", montant: 25000, date: "2026-05-03", details: "Dîme Mai 2026" },
    { id: "cnt_2", membre_id: "mbr_2", type: "Offrande Spéciale", montant: 15000, date: "2026-05-03", details: "Projet Climatisation" },
    { id: "cnt_3", membre_id: "mbr_3", type: "Dîme", montant: 35000, date: "2026-05-10", details: "Dîme Mai 2026" },
    { id: "cnt_4", membre_id: "mbr_4", type: "Offrande Ordinaire", montant: 5000, date: "2026-05-10", details: "Culte Ordinaire" },
    { id: "cnt_5", membre_id: "mbr_7", type: "Dîme", montant: 10000, date: "2026-05-17", details: "Dîme Mai 2026" },
    { id: "cnt_6", membre_id: "mbr_8", type: "Offrande Ordinaire", montant: 3000, date: "2026-05-17", details: "Offrande Culte" }
  ],
  
  resources: [
    { id: "res_1", nom: "Microphone Sans fil Shure", categorie: "Sonorisation", quantite_totale: 4, quantite_dispo: 4, etat: "Excellent" },
    { id: "res_2", nom: "Guitare Basse Yamaha", categorie: "Instruments", quantite_totale: 1, quantite_dispo: 1, etat: "Excellent" },
    { id: "res_3", nom: "Chaises en Plastique Bleues", categorie: "Mobilier", quantite_totale: 150, quantite_dispo: 150, etat: "Bon" },
    { id: "res_4", nom: "Vidéoprojecteur Epson", categorie: "Vidéo & Éclairage", quantite_totale: 1, quantite_dispo: 1, etat: "Excellent" }
  ],
  
  reservations: [
    { id: "rev_1", cult_id: "clt_1", resource_id: "res_1", quantite: 2, details: "Chantre Delali + Prêcheur Gershon" },
    { id: "rev_2", cult_id: "clt_1", resource_id: "res_2", quantite: 1, details: "Bassiste Louange" }
  ]
};

// --- MOTEUR DE PERSISTANCE LOCAL STORAGE & FIREBASE CLOUD ---
let firebaseDB = null;
let isFirebaseSyncActive = false;
let isSyncingFromRemote = false;

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 1500 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

let uiReloadTimeout = null;
function triggerUIReload() {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ekklesia_auth') && activeView) {
    if (uiReloadTimeout) clearTimeout(uiReloadTimeout);
    uiReloadTimeout = setTimeout(() => {
      loadViewData(activeView);
    }, 150);
  }
}

const DBEngine = {
  init: async function() {
    let localData = localStorage.getItem('EkklesiaManagerDB');
    if (!localData) {
      // Premier lancement : Génération des avatars premium SVG pour le seed initial
      initialSeedData.membres.forEach((mbr, idx) => {
        const initials = (mbr.prenoms[0] + mbr.nom[0]).toUpperCase();
        mbr.photo = generatePremiumSvgAvatar(initials, mbr.sexe, idx);
      });
      
      localStorage.setItem('EkklesiaManagerDB', JSON.stringify(initialSeedData));
      db = initialSeedData;
      console.log("Base seedée avec succès.");
    } else {
      db = JSON.parse(localData);
      console.log("Base chargée depuis le stockage local.");
      
      // Patch pour ajouter la table utilisateurs aux bases existantes
      if (!db.utilisateurs) {
        db.utilisateurs = initialSeedData.utilisateurs;
        this.save();
      }
    }
    
    // Initialiser la synchronisation Firebase
    await this.initFirebase();
  },
  
  initFirebase: async function() {
    let configString = null;
    let enabled = false;

    // 1. Tenter de charger le fichier firebase-config.json hébergé sur le serveur
    try {
      const response = await fetchWithTimeout('./firebase-config.json');
      if (response.ok) {
        const configJson = await response.json();
        configString = JSON.stringify(configJson);
        enabled = true;
        console.log("Configuration Firebase détectée via firebase-config.json.");
      }
    } catch (err) {
      console.log("Fichier firebase-config.json non disponible ou erreur réseau. Utilisation des paramètres locaux.");
    }

    // 2. Si le fichier n'est pas présent/inaccessible, utiliser le localStorage local
    if (!configString) {
      const syncConfig = db.firebase_sync || {};
      if (syncConfig.config_string) {
        enabled = syncConfig.enabled;
        configString = syncConfig.config_string;
      } else {
        // Fallback de secours pour garantir la synchronisation si fetch() échoue (ex: fichiers locaux sur mobile)
        const fallbackConfig = {
          apiKey: "AIzaSyCt6z4oF7ckHgnRUCAyod9KCurxPqtrWDU",
          authDomain: "ekklesia-apf.firebaseapp.com",
          projectId: "ekklesia-apf",
          storageBucket: "ekklesia-apf.firebasestorage.app",
          messagingSenderId: "276206343871",
          appId: "1:276206343871:web:30260aff5880b173c1180a"
        };
        configString = JSON.stringify(fallbackConfig);
        enabled = true;
        console.log("Configuration de secours injectée.");
      }
    }
    
    if (!enabled || !configString) {
      console.log("Synchronisation Cloud désactivée.");
      return;
    }
    
    try {
      const config = JSON.parse(configString);
      if (firebase.apps.length === 0) {
        firebase.initializeApp(config);
      }
      firebaseDB = firebase.firestore();
      isFirebaseSyncActive = true;
      console.log("Firebase initialisé avec succès !");
      
      // Enregistrer automatiquement la configuration lue du serveur dans localStorage pour assurer la persistance
      if (!db.firebase_sync) db.firebase_sync = {};
      if (db.firebase_sync.config_string !== configString || !db.firebase_sync.enabled) {
        db.firebase_sync.enabled = true;
        db.firebase_sync.config_string = configString;
        this.save();
      }
      
      this.setupFirebaseListeners();
    } catch (err) {
      console.error("Échec de l'initialisation de Firebase Sync :", err);
      showToast("Erreur de connexion Firebase. Vérifiez votre configuration JSON.", "error");
    }
  },
  
  setupFirebaseListeners: function() {
    const collectionsToSync = ['membres', 'cults', 'visiteurs', 'contributions', 'resources', 'reservations', 'utilisateurs', 'cellules'];
    
    // 1. Écouter la configuration globale (préférences, départements, formations)
    firebaseDB.collection('config').doc('global').onSnapshot(doc => {
      if (!doc.exists) {
        this.uploadGlobalConfigToFirebase();
        return;
      }
      
      const data = doc.data();
      isSyncingFromRemote = true;
      db.preferences = data.preferences || db.preferences || {};
      db.departements = data.departements || db.departements || [];
      db.formations = data.formations || db.formations || [];
      localStorage.setItem('EkklesiaManagerDB', JSON.stringify(db));
      isSyncingFromRemote = false;
      
      if (sessionStorage.getItem('ekklesia_auth') && activeView === 'dashboard') {
        initDashboardView();
      }
    }, err => console.error("Erreur d'écoute de la configuration globale :", err));
    
    // 2. Écouter chaque collection
    collectionsToSync.forEach(colName => {
      let isInitial = true;
      firebaseDB.collection(colName).onSnapshot(snapshot => {
        let changesDetected = false;
        
        if (isInitial) {
          // Premier snapshot complet : charger les données distantes du serveur
          const remoteItems = [];
          snapshot.forEach(doc => {
            remoteItems.push({ id: doc.id, ...doc.data() });
          });
          
          // On écrase systématiquement les données locales par celles de Firestore.
          // Si la collection distante est vide, on s'assure que la collection locale l'est aussi,
          // ce qui évite la réapparition des membres génériques ou supprimés.
          db[colName] = remoteItems;
          changesDetected = true;
          isInitial = false;
        } else {
          // Écoutes incrémentales suivantes
          snapshot.docChanges().forEach(change => {
            const id = change.doc.id;
            const data = change.doc.data();
            
            if (!db[colName]) db[colName] = [];
            
            if (change.type === 'added' || change.type === 'modified') {
              let idx = db[colName].findIndex(x => x.id === id);
              const remoteItem = { id, ...data };
              
              if (idx !== -1) {
                if (JSON.stringify(db[colName][idx]) !== JSON.stringify(remoteItem)) {
                  db[colName][idx] = remoteItem;
                  changesDetected = true;
                }
              } else {
                db[colName].push(remoteItem);
                changesDetected = true;
              }
            } else if (change.type === 'removed') {
              let idx = db[colName].findIndex(x => x.id === id);
              if (idx !== -1) {
                db[colName].splice(idx, 1);
                changesDetected = true;
              }
            }
          });
        }
        
        if (changesDetected) {
          isSyncingFromRemote = true;
          localStorage.setItem('EkklesiaManagerDB', JSON.stringify(db));
          isSyncingFromRemote = false;
          
          console.log(`Données Cloud mises à jour pour : ${colName}. Rechargement UI.`);
          triggerUIReload();
        }
      }, err => console.error(`Erreur d'écoute Firestore [${colName}] :`, err));
    });
    
    // 3. Télécharger les données locales vers le cloud si Firestore est vide
    this.seedCloudIfEmpty(collectionsToSync);
  },
  
  uploadGlobalConfigToFirebase: function() {
    if (!isFirebaseSyncActive || !firebaseDB) return;
    firebaseDB.collection('config').doc('global').set({
      preferences: db.preferences || {},
      departements: db.departements || [],
      formations: db.formations || []
    }).catch(err => console.error("Erreur d'envoi de la config globale :", err));
  },
  
  seedCloudIfEmpty: async function(collections) {
    try {
      // Vérifier via la configuration globale si la base a déjà été initialisée
      const configDoc = await firebaseDB.collection('config').doc('global').get();
      if (!configDoc.exists) {
        console.log("Nouvelle instance Firestore. Synchronisation initiale partielle en cours...");
        showToast("Initialisation des données de base sur le Cloud...", "info");
        
        this.uploadGlobalConfigToFirebase();
        
        // On ne téléverse que les utilisateurs et les cellules pour éviter
        // d'injecter des membres ou données génériques par erreur.
        const collectionsToSeed = ['utilisateurs', 'cellules'];
        
        for (const colName of collectionsToSeed) {
          const items = initialSeedData[colName] || [];
          for (const item of items) {
            const { id, ...data } = item;
            await firebaseDB.collection(colName).doc(id).set(data);
          }
        }
        
        showToast("Initialisation Cloud terminée avec succès !", "success");
      }
    } catch (err) {
      console.error("Erreur lors du seeding initial Cloud :", err);
    }
  },
  
  save: function() {
    localStorage.setItem('EkklesiaManagerDB', JSON.stringify(db));
  },
  
  // CRUD Helpers
  getCollection: function(name) {
    return db[name] || [];
  },
  
  insert: function(collection, item) {
    if (!db[collection]) db[collection] = [];
    db[collection].push(item);
    this.save();
    
    // Envoi asynchrone vers Firestore
    if (isFirebaseSyncActive && firebaseDB && !isSyncingFromRemote) {
      const { id, ...data } = item;
      firebaseDB.collection(collection).doc(id).set(data).catch(err => {
        console.error(`Erreur insertion Firebase [${collection}] :`, err);
      });
    }
    
    triggerUIReload();
    return item;
  },
  
  update: function(collection, id, updatedFields) {
    let idx = db[collection].findIndex(x => x.id === id);
    if (idx !== -1) {
      db[collection][idx] = { ...db[collection][idx], ...updatedFields };
      this.save();
      
      // Envoi asynchrone vers Firestore
      if (isFirebaseSyncActive && firebaseDB && !isSyncingFromRemote) {
        const { id: _, ...data } = db[collection][idx];
        firebaseDB.collection(collection).doc(id).set(data).catch(err => {
          console.error(`Erreur modification Firebase [${collection}] :`, err);
        });
      }
      
      triggerUIReload();
      return db[collection][idx];
    }
    return null;
  },
  
  delete: function(collection, id) {
    let idx = db[collection].findIndex(x => x.id === id);
    if (idx !== -1) {
      db[collection].splice(idx, 1);
      this.save();
      
      // Suppression asynchrone sur Firestore
      if (isFirebaseSyncActive && firebaseDB && !isSyncingFromRemote) {
        firebaseDB.collection(collection).doc(id).delete().catch(err => {
          console.error(`Erreur suppression Firebase [${collection}] :`, err);
        });
      }
      
      triggerUIReload();
      return true;
    }
    return false;
  }
};

// --- ROUTAGE INTERNE ET CONTROLEUR DE VUES ---
function switchView(viewName) {
  const activeUserId = sessionStorage.getItem('ekklesia_auth');
  if (activeUserId && viewName === 'finances') {
    const user = DBEngine.getCollection('utilisateurs').find(u => u.id === activeUserId);
    if (user && user.role === 'Responsable') {
      showToast("Accès refusé : Les Responsables n'ont pas accès aux contributions financières.", "danger");
      return;
    }
  }

  // Masquer l'ancienne vue active
  document.querySelector('.view-section.active').classList.remove('active');
  // Désactiver l'ancien onglet de menu
  document.querySelector('.nav-item.active').classList.remove('active');
  
  // Activer la nouvelle vue
  const newViewSection = document.getElementById(`view-section-${viewName}`) || document.getElementById(`view-${viewName}`);
  if (newViewSection) {
    newViewSection.classList.add('active');
  }
  
  // Activer le nouvel onglet du menu
  const menuItems = document.querySelectorAll('.nav-item');
  menuItems.forEach(item => {
    const clickAttr = item.getAttribute('onclick');
    if (clickAttr && clickAttr.includes(viewName)) {
      item.classList.add('active');
    }
  });

  activeView = viewName;
  
  // Fermer la fiche détail des membres si on change de page
  if (viewName !== 'members') {
    closeMemberDetails();
  }
  if (viewName !== 'cults') {
    closeCultBuilder();
  }

  // Mettre à jour l'en-tête dynamique
  updateHeaderTitle(viewName);
  
  // Charger les données de la vue
  loadViewData(viewName);
}

function updateHeaderTitle(viewName) {
  const titleEl = document.getElementById('view-title');
  const subtitleEl = document.getElementById('view-subtitle');
  const searchBar = document.getElementById('global-search-bar');
  
  searchBar.style.display = 'flex'; // Affiché par défaut

  switch (viewName) {
    case 'dashboard':
      titleEl.innerText = "Tableau de Bord";
      subtitleEl.innerText = "Résumé analytique et alertes prioritaires";
      break;
    case 'members':
      titleEl.innerText = "Fichier des Membres";
      subtitleEl.innerText = "Annuaire, fiches personnelles et structures familiales";
      break;
    case 'visitors':
      titleEl.innerText = "Pipeline Nouveaux Convertis";
      subtitleEl.innerText = "Intégration, suivi spirituel et accueil";
      searchBar.style.display = 'none';
      break;
    case 'cults':
      titleEl.innerText = "Calendrier Liturgique";
      subtitleEl.innerText = "Gestion des services, ordonnancements et présences";
      break;
    case 'finances':
      titleEl.innerText = "Contributions & Dîmes";
      subtitleEl.innerText = "Trésorerie confidentielle de la congrégation";
      break;
    case 'resources':
      titleEl.innerText = "Ressources & Matériel";
      subtitleEl.innerText = "Inventaire et réservations d'équipements";
      break;
    case 'reports':
      titleEl.innerText = "Analyses & Rapports";
      subtitleEl.innerText = "Indicateurs de croissance, démographie et assiduité";
      searchBar.style.display = 'none';
      break;
  }
}

// --- UTILS : TOASTS ET MODALES ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-xmark';
  if (type === 'info') icon = 'fa-circle-info';
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => { toast.remove(); }, 300);
  }, 4000);
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function openNewEntryMenu() {
  const menu = document.getElementById('quick-new-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function closeNewEntryMenu() {
  document.getElementById('quick-new-menu').style.display = 'none';
}

// Fermer le menu rapide au clic à l'extérieur
document.addEventListener('click', function(e) {
  const actionBtn = document.querySelector('.action-btn');
  const menu = document.getElementById('quick-new-menu');
  if (actionBtn && menu && !actionBtn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});

// --- CHARGEMENT DYNAMIQUE DES DONNÉES PAR VUE ---
function loadViewData(viewName) {
  switch (viewName) {
    case 'dashboard':
      initDashboardView();
      break;
    case 'members':
      initMembersView();
      break;
    case 'visitors':
      initVisitorsView();
      break;
    case 'cults':
      initCultsView();
      break;
    case 'finances':
      initFinancesView();
      break;
    case 'resources':
      initResourcesView();
      break;
    case 'reports':
      initReportsView();
      break;
  }
}

// --- CONTROLEUR : DASHBOARD ---
function initDashboardView() {
  const activeMembers = DBEngine.getCollection('membres').filter(x => x.statut === 'Actif');
  const allMembres = DBEngine.getCollection('membres');
  const cults = DBEngine.getCollection('cults');
  const visitors = DBEngine.getCollection('visiteurs');
  
  // KPI 1 : Effectif Actif avec répartition Adultes/Enfants et Sexe
  document.getElementById('stat-total-members').innerText = activeMembers.length;
  
  const adults = [];
  const children = [];
  
  activeMembers.forEach(m => {
    const age = calculateAge(m.date_naissance);
    if (age === '--' || age >= 16) {
      adults.push(m);
    } else {
      children.push(m);
    }
  });
  
  const adultMen = adults.filter(m => m.sexe === 'H').length;
  const adultWomen = adults.filter(m => m.sexe === 'F').length;
  const childBoys = children.filter(m => m.sexe === 'H').length;
  const childGirls = children.filter(m => m.sexe === 'F').length;
  
  document.getElementById('stat-adults-count').innerText = adults.length;
  document.getElementById('stat-adults-detail').innerText = `${adultMen} H / ${adultWomen} F`;
  document.getElementById('stat-children-count').innerText = children.length;
  document.getElementById('stat-children-detail').innerText = `${childBoys} G / ${childGirls} F`;
  
  // KPI 2 : Assiduité Moyenne
  const completedCults = cults.filter(c => c.statut === 'Terminé');
  if (completedCults.length > 0) {
    let sumRate = 0;
    completedCults.forEach(c => {
      // Taux d'assiduité = Présents / Effectif Actif à la date du culte (simplifié ici par rapport à l'actif global)
      const rate = (c.presences.length / activeMembers.length) * 100;
      sumRate += rate;
    });
    const avg = Math.round(sumRate / completedCults.length);
    document.getElementById('stat-avg-attendance').innerText = `${avg}%`;
  } else {
    document.getElementById('stat-avg-attendance').innerText = "0%";
  }
  
  // KPI 3 : Nouveaux Convertis ce mois
  const activeMonthVis = visitors.filter(v => v.statut === 'Nouveau Converti');
  document.getElementById('stat-new-convert').innerText = activeMonthVis.length;
  
  // 1. Alertes d'Absences consécutives (3 semaines+)
  renderAbsenceAlerts(allMembres, completedCults);
  
  // 2. Anniversaires de la semaine
  renderBirthdays();
  
  // 3. Rendu du Graphique d'Évolution de l'Église (Chart.js)
  renderGrowthChart();
}

function renderAbsenceAlerts(members, completedCults) {
  const container = document.getElementById('absent-alert-container');
  container.innerHTML = "";
  
  // Trier les cultes terminés par date décroissante pour prendre les 3 derniers
  const last3Cults = [...completedCults]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  
  let absentCount = 0;
  
  if (last3Cults.length >= 3) {
    members.filter(m => m.statut === 'Actif').forEach(mbr => {
      // Vérifier si le membre est absent lors des 3 derniers cultes
      const isAbsentAll = last3Cults.every(cult => !cult.presences.includes(mbr.id));
      
      if (isAbsentAll) {
        absentCount++;
        const item = document.createElement('div');
        item.className = 'alert-item';
        
        // Texte WhatsApp de relance pastoral pré-rempli
        const textMsg = encodeURIComponent(`Bonjour Bien-aimé(e) ${mbr.prenoms}, nous avons remarqué votre absence lors des derniers cultes. Nous espérons que vous vous portez bien. Soyez béni(e) ! - Équipe Pastorale APF Lomé`);
        const phoneClean = mbr.whatsapp ? mbr.whatsapp.replace(/\s+/g, '') : (mbr.telephone ? mbr.telephone.replace(/\s+/g, '') : '');
        
        const actionHtml = phoneClean 
          ? `<a href="https://wa.me/${phoneClean}?text=${textMsg}" target="_blank" class="whatsapp-action-btn" title="Contacter par WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>`
          : `<span class="absent-badge" style="background:var(--border-color); color:var(--text-muted);">Sans Tél</span>`;
        
        item.innerHTML = `
          <div class="item-avatar-group">
            <div class="user-avatar" style="width:34px; height:34px; font-size:12px;">${mbr.prenoms[0]}${mbr.nom[0]}</div>
            <div class="item-text">
              <h4>${mbr.nom.toUpperCase()} ${mbr.prenoms}</h4>
              <p>${mbr.telephone || 'Aucun contact'}</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="absent-badge">Absence 3 sem.</span>
            ${actionHtml}
          </div>
        `;
        container.appendChild(item);
      }
    });
  }
  
  document.getElementById('absences-alert-count').innerText = `${absentCount} membre(s) alerté(s)`;
  if (absentCount === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 0; color:var(--text-muted);">
        <i class="fa-solid fa-circle-check" style="font-size:32px; color:var(--success-color); margin-bottom:12px;"></i>
        <p style="font-size:13px;">Aucun membre actif n'est absent depuis 3 semaines consécutives.</p>
      </div>
    `;
  }
}

function renderBirthdays() {
  const container = document.getElementById('anniversary-list-container');
  container.innerHTML = "";
  
  const members = DBEngine.getCollection('membres');
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Déterminer le début et la fin de la semaine courante
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() - today.getDay() + 6);
  
  let bdayCount = 0;
  
  members.forEach(mbr => {
    if (!mbr.date_naissance) return;
    const bdate = new Date(mbr.date_naissance);
    // Remplacer l'année de naissance par l'année en cours pour comparer le jour/mois dans la semaine
    const thisYearBday = new Date(currentYear, bdate.getMonth(), bdate.getDate());
    
    if (thisYearBday >= startOfWeek && thisYearBday <= endOfWeek) {
      bdayCount++;
      const age = currentYear - bdate.getFullYear();
      
      const item = document.createElement('div');
      item.className = 'anniversary-item';
      
      const textMsg = encodeURIComponent(`Joyeux Anniversaire Bien-aimé(e) ${mbr.nom.toUpperCase()} ${mbr.prenoms} ! Que le Seigneur vous comble de Ses grâces à l'occasion de vos ${age} ans. Demeurez béni(e) ! - APF Lomé`);
      const phoneClean = mbr.whatsapp ? mbr.whatsapp.replace(/\s+/g, '') : (mbr.telephone ? mbr.telephone.replace(/\s+/g, '') : '');
      
      const actionHtml = phoneClean 
        ? `<a href="https://wa.me/${phoneClean}?text=${textMsg}" target="_blank" class="whatsapp-action-btn" title="Souhaiter par WhatsApp"><i class="fa-brands fa-whatsapp"></i> Souhaiter</a>`
        : `<span class="absent-badge" style="background:var(--border-color); color:var(--text-muted); padding: 6px 12px;">Pas de Tél</span>`;
      
      item.innerHTML = `
        <div class="item-avatar-group">
          <div class="user-avatar" style="width:38px; height:38px; font-size:13px; font-weight:700;">${mbr.prenoms[0]}${mbr.nom[0]}</div>
          <div class="item-text">
            <h4>${mbr.nom.toUpperCase()} ${mbr.prenoms}</h4>
            <p><i class="fa-solid fa-cake-candles" style="color:var(--warning-color);"></i> ${thisYearBday.toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})} (${age} ans)</p>
          </div>
        </div>
        ${actionHtml}
      `;
      container.appendChild(item);
    }
  });
  
  document.getElementById('anniversary-week-count').innerText = `${bdayCount} cette semaine`;
  if (bdayCount === 0) {
    container.innerHTML = `
      <div style="grid-column: span 3; text-align:center; padding:24px 0; color:var(--text-muted); width: 100%;">
        <p style="font-size:13px;">Aucun anniversaire à célébrer dans la congrégation cette semaine.</p>
      </div>
    `;
  }
}

function renderGrowthChart() {
  const ctx = document.getElementById('growthChart').getContext('2d');
  
  if (charts['growth']) {
    charts['growth'].destroy();
  }
  
  // Simulation de données sur les 12 derniers mois
  const labels = ["Juin 25", "Juil 25", "Août 25", "Sept 25", "Oct 25", "Nov 25", "Déc 25", "Jan 26", "Fév 26", "Mar 26", "Avr 26", "Mai 26"];
  const datasetGrowth = [5, 6, 8, 8, 10, 11, 12, 12, 13, 14, 15, 15]; // Effectif cumulé d'intégration
  
  // Gradient de remplissage
  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
  
  charts['growth'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Membres Enregistrés',
        data: datasetGrowth,
        borderColor: chartColors.primary,
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: chartColors.grid },
          ticks: { color: 'rgba(255,255,255,0.6)', font: { family: 'Plus Jakarta Sans' } }
        },
        y: {
          grid: { color: chartColors.grid },
          ticks: { color: 'rgba(255,255,255,0.6)', font: { family: 'Plus Jakarta Sans' } },
          min: 0
        }
      }
    }
  });
}

// --- CONTROLEUR : MEMBRES ---
function initMembersView() {
  // Charger les filtres dynamiques (cellules et départements)
  loadMembersFilterOptions();
  
  // Appliquer les filtres par défaut
  applyMembersFilters();
}

function loadMembersFilterOptions() {
  const cells = DBEngine.getCollection('cellules');
  const depts = DBEngine.getCollection('departements');
  
  const cellSelect = document.getElementById('filter-cellule');
  const deptSelect = document.getElementById('filter-departement');
  
  // Sauvegarder les valeurs actives avant rechargement
  const selectedCell = cellSelect.value;
  const selectedDept = deptSelect.value;
  
  cellSelect.innerHTML = `<option value="">-- Cellule (Toutes) --</option>`;
  cells.forEach(c => {
    cellSelect.innerHTML += `<option value="${c.id}">${c.nom}</option>`;
  });
  
  deptSelect.innerHTML = `<option value="">-- Département (Tous) --</option>`;
  depts.forEach(d => {
    deptSelect.innerHTML += `<option value="${d}">${d}</option>`;
  });
  
  cellSelect.value = selectedCell;
  deptSelect.value = selectedDept;
}

function changeViewMode(mode) {
  currentMembersViewMode = mode;
  
  // Mettre à jour l'état visuel des boutons
  document.getElementById('btn-view-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('btn-view-list').classList.toggle('active', mode === 'list');
  
  // Rafraîchir la vue avec les filtres et le tri actuels
  applyMembersFilters();
}

function applyMembersFilters() {
  const allMembers = DBEngine.getCollection('membres');
  const cells = DBEngine.getCollection('cellules');
  
  const statFilter = document.getElementById('filter-status').value;
  const genderFilter = document.getElementById('filter-sexe').value;
  const deptFilter = document.getElementById('filter-departement').value;
  const cellFilter = document.getElementById('filter-cellule').value;
  const baptFilter = document.getElementById('filter-bapteme').value;
  const searchQuery = document.getElementById('quick-search-input').value.toLowerCase().trim();
  
  let filtered = allMembers.filter(mbr => {
    if (statFilter && mbr.statut !== statFilter) return false;
    if (genderFilter && mbr.sexe !== genderFilter) return false;
    if (deptFilter && (!mbr.appartenance.departements || !mbr.appartenance.departements.includes(deptFilter))) return false;
    if (cellFilter && mbr.appartenance.cellule_id !== cellFilter) return false;
    if (baptFilter === 'oui' && !mbr.parcours_spirituel.date_bapteme_eau) return false;
    if (baptFilter === 'non' && mbr.parcours_spirituel.date_bapteme_eau) return false;
    
    if (searchQuery) {
      const matchSearch = mbr.nom.toLowerCase().includes(searchQuery) || 
                          mbr.prenoms.toLowerCase().includes(searchQuery) || 
                          (mbr.telephone && mbr.telephone.includes(searchQuery)) ||
                          (mbr.adresse && mbr.adresse.toLowerCase().includes(searchQuery));
      if (!matchSearch) return false;
    }
    
    return true;
  });
  
  const sortFilter = document.getElementById('filter-sort').value;
  
  filtered.sort((a, b) => {
    switch (sortFilter) {
      case 'name_asc':
        return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }) || a.prenoms.localeCompare(b.prenoms, 'fr', { sensitivity: 'base' });
      case 'name_desc':
        return b.nom.localeCompare(a.nom, 'fr', { sensitivity: 'base' }) || b.prenoms.localeCompare(a.prenoms, 'fr', { sensitivity: 'base' });
      case 'age_asc': {
        const ageA = a.date_naissance ? calculateAge(a.date_naissance) : 999;
        const ageB = b.date_naissance ? calculateAge(b.date_naissance) : 999;
        return ageA - ageB;
      }
      case 'age_desc': {
        const ageA = a.date_naissance ? calculateAge(a.date_naissance) : -1;
        const ageB = b.date_naissance ? calculateAge(b.date_naissance) : -1;
        return ageB - ageA;
      }
      case 'recent': {
        const dateA = a.date_integration ? new Date(a.date_integration).getTime() : 0;
        const dateB = b.date_integration ? new Date(b.date_integration).getTime() : 0;
        return dateB - dateA;
      }
      default:
        return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }) || a.prenoms.localeCompare(b.prenoms, 'fr', { sensitivity: 'base' });
    }
  });
  
  renderMembersDirectory(filtered, cells);
}

function renderMembersDirectory(members, cells) {
  const container = document.getElementById('members-list-container');
  container.className = currentMembersViewMode === 'grid' ? 'members-grid' : 'members-list';
  container.innerHTML = "";
  
  if (members.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 4; text-align:center; padding:64px 0; color:var(--text-muted);">
        <i class="fa-solid fa-users-slash" style="font-size:48px; margin-bottom:16px;"></i>
        <p style="font-size:15px; font-weight:600;">Aucun membre ne correspond aux critères de filtrage actuels.</p>
      </div>
    `;
    return;
  }
  
  members.forEach(mbr => {
    const age = calculateAge(mbr.date_naissance);
    const cellObj = cells.find(c => c.id === mbr.appartenance.cellule_id);
    const cellName = cellObj ? cellObj.nom : 'Aucune cellule';
    const initials = (mbr.prenoms[0] + mbr.nom[0]).toUpperCase();
    
    // Déterminer la classe couleur du badge statut
    let statusClass = "status-actif";
    if (mbr.statut === 'Inactif') statusClass = "status-inactif";
    if (mbr.statut === 'Transféré') statusClass = "status-transfere";
    if (mbr.statut === 'Décédé') statusClass = "status-decede";
    
    const card = document.createElement('div');
    card.className = 'member-grid-card';
    card.setAttribute('onclick', `openMemberDetails('${mbr.id}')`);
    
    card.innerHTML = `
      <input type="checkbox" class="member-select-checkbox" value="${mbr.id}" onclick="event.stopPropagation(); toggleBulkDeleteBtn()" style="position: absolute; top: 12px; left: 12px; transform: scale(1.3); cursor: pointer; z-index: 10;">
      <span class="card-status-badge ${statusClass}">${mbr.statut}</span>
      <div class="card-avatar-xl">
        <img src="${mbr.photo || generatePremiumSvgAvatar(initials, mbr.sexe, 1)}" alt="${mbr.nom.toUpperCase()} ${mbr.prenoms}">
      </div>
      <div class="card-member-info">
        <h4>${mbr.nom.toUpperCase()} ${mbr.prenoms}</h4>
        <p>${mbr.profession || 'Sans profession'}</p>
        <p style="font-size:11px; margin-top:2px;"><i class="fa-solid fa-house-chimney"></i> Cellule : ${cellName}</p>
      </div>
      <div class="card-tags">
        <span class="tag-badge">${mbr.sexe === 'H' ? 'Homme' : 'Femme'} (${age} ans)</span>
        ${mbr.appartenance.departements ? mbr.appartenance.departements.map(d => `<span class="tag-badge">${d}</span>`).join('') : ''}
      </div>
      <div class="card-action-bar">
        <button class="card-btn" onclick="event.stopPropagation(); openMemberDetails('${mbr.id}')"><i class="fa-solid fa-eye"></i> Profil</button>
        <button class="card-btn" onclick="event.stopPropagation(); openMemberFormModal('${mbr.id}')"><i class="fa-solid fa-pen-to-square"></i> Éditer</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  toggleBulkDeleteBtn(); // Reset the button state
}

function calculateAge(dobString) {
  if (!dobString) return "--";
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function formatDateFriendly(dateString) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "--";
  return date.toLocaleDateString('fr-FR');
}

function compressImage(base64Str, maxWidth, maxHeight, quality, callback) {
  const img = new Image();
  img.src = base64Str;
  img.onload = function() {
    let width = img.width;
    let height = img.height;
    
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
    callback(compressedBase64);
  };
}

// --- FICHE DETALLÉE MEMBRE ---
function openMemberDetails(memberId) {
  activeMemberId = memberId;
  const mbr = DBEngine.getCollection('membres').find(x => x.id === memberId);
  const cells = DBEngine.getCollection('cellules');
  
  if (!mbr) return;
  
  // Masquer la grille principale et afficher le volet de détail
  document.getElementById('members-list-container').style.display = 'none';
  document.getElementById('members-list-container').previousElementSibling.style.display = 'none'; // filters
  document.getElementById('member-detail-container').style.display = 'block';
  
  // Remplir les informations de l'encart Profil gauche
  const avatarBox = document.getElementById('detail-avatar');
  const initials = (mbr.prenoms[0] + mbr.nom[0]).toUpperCase();
  avatarBox.innerHTML = `<img src="${mbr.photo || generatePremiumSvgAvatar(initials, mbr.sexe, 1)}" style="width:100%; height:100%; object-fit:cover;">`;
  
  document.getElementById('detail-full-name').innerText = `${mbr.nom.toUpperCase()} ${mbr.prenoms}`;
  
  const statusBadge = document.getElementById('detail-status');
  statusBadge.innerText = mbr.statut;
  statusBadge.className = `card-status-badge status-actif`; // Reset classes
  if (mbr.statut === 'Inactif') statusBadge.classList.add('status-inactif');
  if (mbr.statut === 'Transféré') statusBadge.classList.add('status-transfere');
  if (mbr.statut === 'Décédé') statusBadge.classList.add('status-decede');
  
  document.getElementById('detail-age').innerText = `${calculateAge(mbr.date_naissance)} ans`;
  document.getElementById('detail-gender').innerText = mbr.sexe === 'H' ? 'Homme' : 'Femme';
  document.getElementById('detail-phone').innerText = mbr.telephone || 'Aucun';
  document.getElementById('detail-whatsapp').innerText = mbr.whatsapp || 'Aucun';
  document.getElementById('detail-address').innerText = mbr.adresse || 'Aucune';
  
  // Remplir l'onglet 1 : Général & Relations
  document.getElementById('detail-marital').innerText = mbr.situation_matrimoniale || 'Célibataire';
  document.getElementById('detail-profession').innerText = mbr.profession || 'Sans profession';
  document.getElementById('detail-dob').innerText = formatDateFriendly(mbr.date_naissance);
  document.getElementById('detail-date-integration').innerText = formatDateFriendly(mbr.date_integration);
  
  // Générer l'arbre familial visuel
  renderFamilyTree(mbr);
  
  // Remplir l'onglet 2 : Parcours Spirituel
  document.getElementById('detail-conversion').innerText = mbr.parcours_spirituel.date_conversion 
    ? `Le ${formatDateFriendly(mbr.parcours_spirituel.date_conversion)} à ${mbr.parcours_spirituel.lieu_conversion || '--'}`
    : 'Non communiquée';
    
  document.getElementById('detail-bapteme-eau').innerText = mbr.parcours_spirituel.date_bapteme_eau 
    ? `Le ${formatDateFriendly(mbr.parcours_spirituel.date_bapteme_eau)} par ${mbr.parcours_spirituel.celebrant_bapteme_eau || 'un célébrant'}`
    : 'Non baptisé(e) d\'eau';
    
  document.getElementById('detail-bapteme-esprit').innerText = mbr.parcours_spirituel.date_bapteme_esprit 
    ? `Le ${formatDateFriendly(mbr.parcours_spirituel.date_bapteme_esprit)}`
    : 'Non baptisé(e) du Saint-Esprit';
    
  const cellObj = cells.find(c => c.id === mbr.appartenance.cellule_id);
  document.getElementById('detail-cellule').innerText = cellObj ? cellObj.nom : 'Aucune cellule rattachée';
  
  // Tags départements
  const deptTagsContainer = document.getElementById('detail-departments-tags');
  deptTagsContainer.innerHTML = "";
  if (mbr.appartenance.departements && mbr.appartenance.departements.length > 0) {
    mbr.appartenance.departements.forEach(dept => {
      deptTagsContainer.innerHTML += `<span class="tag-badge" style="font-size:12px; padding:6px 12px; background:var(--primary-gradient); color:#fff; border:none;">${dept}</span>`;
    });
  } else {
    deptTagsContainer.innerHTML = `<span style="font-size:13px; font-style:italic; color:var(--text-muted);">Aucun département d'activité</span>`;
  }
  
  // Formations Chrétiennes
  const formationsContainer = document.getElementById('detail-formations-list');
  formationsContainer.innerHTML = "";
  if (mbr.parcours_spirituel.formations && mbr.parcours_spirituel.formations.length > 0) {
    mbr.parcours_spirituel.formations.forEach(f => {
      formationsContainer.innerHTML += `
        <div class="formation-item">
          <i class="fa-solid fa-certificate"></i>
          <span>${f}</span>
        </div>
      `;
    });
  } else {
    formationsContainer.innerHTML = `<p style="font-size:13px; font-style:italic; color:var(--text-muted);">Aucune formation validée dans notre répertoire.</p>`;
  }
  
  // Notes Pastorales Confidentielles
  document.getElementById('detail-notes-pastorales').innerText = mbr.parcours_spirituel.notes_pastorales || "Aucune observation confidentielle enregistrée par le Pasteur.";
  document.getElementById('detail-notes-pastorales').style.display = 'none'; // Masqué par défaut
  
  // Remplir l'onglet 3 : Assiduité & Historique des cultes
  renderMemberAttendanceHistory(mbr);

  // Remplir l'onglet 4 : Finances
  renderMemberFinancesHistory(mbr);

  // Forcer l'affichage sur l'onglet général par défaut
  switchProfileTab('general');
}

function closeMemberDetails() {
  activeMemberId = null;
  document.getElementById('members-list-container').style.display = 'grid';
  document.getElementById('members-list-container').previousElementSibling.style.display = 'flex'; // filters
  document.getElementById('member-detail-container').style.display = 'none';
}

// --- SUPPRESSION DE MEMBRES ---
function toggleBulkDeleteBtn() {
  const checkboxes = document.querySelectorAll('.member-select-checkbox:checked');
  const btn = document.getElementById('btn-bulk-delete');
  const countSpan = document.getElementById('bulk-delete-count');
  
  if (btn) {
    if (checkboxes.length > 0) {
      btn.style.display = 'inline-flex';
      countSpan.innerText = checkboxes.length;
    } else {
      btn.style.display = 'none';
    }
  }
}

function deleteSelectedMembers() {
  const checkboxes = document.querySelectorAll('.member-select-checkbox:checked');
  if (checkboxes.length === 0) return;
  
  if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ces ${checkboxes.length} membre(s) ? Cette action est irréversible.`)) {
    let deletedCount = 0;
    checkboxes.forEach(cb => {
      const success = DBEngine.delete('membres', cb.value);
      if (success) deletedCount++;
    });
    showToast(`${deletedCount} membre(s) supprimé(s) avec succès.`, "success");
    document.getElementById('btn-bulk-delete').style.display = 'none';
    
    // Refresh view
    loadMembersFilterOptions();
    applyMembersFilters();
    initDashboardView();
  }
}

function deleteCurrentMember() {
  if (!activeMemberId) return;
  
  const mbr = DBEngine.getCollection('membres').find(x => x.id === activeMemberId);
  if (!mbr) return;
  
  if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${mbr.nom.toUpperCase()} ${mbr.prenoms} ? Cette action est irréversible.`)) {
    const success = DBEngine.delete('membres', activeMemberId);
    if (success) {
      showToast(`Le membre a été supprimé avec succès.`, "success");
      closeMemberDetails();
      
      // Refresh view
      loadMembersFilterOptions();
      applyMembersFilters();
      initDashboardView();
    }
  }
}

function switchProfileTab(tabName) {
  // Désactiver l'ancienne vue d'onglet
  document.querySelector('.tab-btn.active').classList.remove('active');
  document.querySelector('.profile-tab-content.active').classList.remove('active');
  
  // Activer le bouton de l'onglet
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick').includes(tabName)) btn.classList.add('active');
  });
  
  // Activer la section d'onglet
  document.getElementById(`tab-${tabName}`).classList.add('active');
  activeProfileTab = tabName;
}

function toggleNotesPastoralesVisibility() {
  const notesEl = document.getElementById('detail-notes-pastorales');
  notesEl.style.display = notesEl.style.display === 'none' ? 'block' : 'none';
}

function renderFamilyTree(member) {
  const container = document.getElementById('family-tree-container');
  container.innerHTML = "";
  
  const allMembers = DBEngine.getCollection('membres');
  
  // 1. Recherche Conjoint
  let spouseNodeHtml = "";
  if (member.relations && member.relations.conjoint_id) {
    const spouse = allMembers.find(m => m.id === member.relations.conjoint_id);
    if (spouse) {
      spouseNodeHtml = `
        <div class="family-node spouse" onclick="openMemberDetails('${spouse.id}')" style="cursor:pointer;" title="Voir le profil du conjoint">
          <div class="family-node-avatar">${spouse.prenoms[0]}${spouse.nom[0]}</div>
          <div class="family-node-info">
            <h5>${spouse.nom.toUpperCase()} ${spouse.prenoms}</h5>
            <p>Époux / Épouse</p>
          </div>
        </div>
      `;
    }
  }
  
  // 2. Recherche Enfants
  let childrenNodesHtml = "";
  if (member.relations && member.relations.enfants_ids && member.relations.enfants_ids.length > 0) {
    member.relations.enfants_ids.forEach(childId => {
      const child = allMembers.find(m => m.id === childId);
      if (child) {
        childrenNodesHtml += `
          <div class="family-node child" onclick="openMemberDetails('${child.id}')" style="cursor:pointer;" title="Voir le profil de l'enfant">
            <div class="family-node-avatar">${child.prenoms[0]}${child.nom[0]}</div>
            <div class="family-node-info">
              <h5>${child.nom.toUpperCase()} ${child.prenoms}</h5>
              <p>Enfant (${calculateAge(child.date_naissance)} ans)</p>
            </div>
          </div>
        `;
      }
    });
  }
  
  if (!spouseNodeHtml && !childrenNodesHtml) {
    container.innerHTML = `<p style="font-size:13px; font-style:italic; color:var(--text-muted);">Aucune relation familiale enregistrée dans le fichier de ce membre.</p>`;
    return;
  }
  
  container.innerHTML = `
    <!-- Ligne Parents -->
    <div class="family-row">
      <div class="family-node" style="border-color: var(--primary-color);">
        <div class="family-node-avatar">${member.prenoms[0]}${member.nom[0]}</div>
        <div class="family-node-info">
          <h5>${member.nom.toUpperCase()} ${member.prenoms}</h5>
          <p>Membre Actif</p>
        </div>
      </div>
      ${spouseNodeHtml ? `<div class="family-connector"><i class="fa-solid fa-link" style="color:var(--text-muted);"></i></div>` : ''}
      ${spouseNodeHtml}
    </div>
    
    <!-- Ligne Connecteur verticale si enfants -->
    ${childrenNodesHtml ? `
      <div style="height:20px; width:2px; background:var(--border-color); margin: -12px 0;"></div>
      
      <!-- Ligne Enfants -->
      <div class="family-row" style="flex-wrap: wrap; gap: 20px; margin-top: 10px;">
        ${childrenNodesHtml}
      </div>
    ` : ''}
  `;
}

function renderMemberAttendanceHistory(member) {
  const cults = DBEngine.getCollection('cults').filter(c => c.statut === 'Terminé');
  const tbody = document.getElementById('member-attendance-history-table');
  tbody.innerHTML = "";
  
  let countPresent = 0;
  
  // Trier par date décroissante
  const sortedCults = [...cults].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  sortedCults.forEach(c => {
    const isPresent = c.presences.includes(member.id);
    if (isPresent) countPresent++;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateFriendly(c.date)}</td>
      <td><strong>${c.type}</strong></td>
      <td>${c.theme}</td>
      <td>
        <span class="absent-badge" style="background: ${isPresent ? 'var(--success-bg)' : 'var(--danger-bg)'}; color: ${isPresent ? 'var(--success-color)' : 'var(--danger-color)'};">
          ${isPresent ? 'Présent(e)' : 'Absent(e)'}
        </span>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  if (sortedCults.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Aucune donnée de présence enregistrée pour l'instant.</td></tr>`;
  }
  
  // Mettre à jour le graphique d'assiduité du membre
  renderMemberAttendanceChart(sortedCults, member.id);
}

function renderMemberAttendanceChart(completedCults, memberId) {
  const canvas = document.getElementById('memberAttendanceChart');
  const ctx = canvas.getContext('2d');
  
  if (charts['memberAttendance']) {
    charts['memberAttendance'].destroy();
  }
  
  // Prendre les 6 derniers cultes
  const recent6 = [...completedCults].reverse().slice(-6);
  const labels = recent6.map(c => new Date(c.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}));
  const presenceValues = recent6.map(c => c.presences.includes(memberId) ? 1 : 0); // 1 = Présent, 0 = Absent
  
  charts['memberAttendance'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Assiduité',
        data: presenceValues,
        backgroundColor: presenceValues.map(v => v === 1 ? chartColors.success : chartColors.danger),
        borderRadius: 6,
        barThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) { return context.raw === 1 ? "Présent(e)" : "Absent(e)"; }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)' } },
        y: {
          grid: { display: false },
          min: 0, max: 1,
          ticks: {
            stepSize: 1,
            callback: function(value) { return value === 1 ? "Présent" : (value === 0 ? "Absent" : ""); },
            color: 'rgba(255,255,255,0.6)'
          }
        }
      }
    }
  });
}

function renderMemberFinancesHistory(member) {
  const contributions = DBEngine.getCollection('contributions').filter(c => c.membre_id === member.id);
  const tbody = document.getElementById('member-contributions-table');
  tbody.innerHTML = "";
  
  // Trier par date décroissante
  const sorted = [...contributions].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  sorted.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateFriendly(c.date)}</td>
      <td><span class="absent-badge" style="background:var(--success-bg); color:var(--success-color);">${c.type}</span></td>
      <td><strong>${c.montant.toLocaleString('fr-FR')} FCFA</strong></td>
      <td>${c.details || '--'}</td>
    `;
    tbody.appendChild(row);
  });
  
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Aucune contribution financière enregistrée dans le grand livre.</td></tr>`;
  }
}

// --- CONFIGURATION FORMULAIRE MEMBRE MODAL ---
function openMemberFormModal(memberId = null) {
  const cells = DBEngine.getCollection('cellules');
  const depts = DBEngine.getCollection('departements');
  const formsList = DBEngine.getCollection('formations');
  const allMembers = DBEngine.getCollection('membres');
  
  // Préparer les selects
  const cellSelect = document.getElementById('form-cellule');
  cellSelect.innerHTML = `<option value="">-- Sélectionner Cellule --</option>`;
  cells.forEach(c => { cellSelect.innerHTML += `<option value="${c.id}">${c.nom}</option>`; });
  
  const conjointSelect = document.getElementById('form-conjoint');
  conjointSelect.innerHTML = `<option value="">-- Aucun --</option>`;
  allMembers.filter(m => m.id !== memberId).forEach(m => {
    conjointSelect.innerHTML += `<option value="${m.id}">${m.nom.toUpperCase()} ${m.prenoms}</option>`;
  });
  
  const enfantsSelect = document.getElementById('form-enfants');
  enfantsSelect.innerHTML = "";
  allMembers.filter(m => m.id !== memberId).forEach(m => {
    enfantsSelect.innerHTML += `<option value="${m.id}">${m.nom.toUpperCase()} ${m.prenoms} (${calculateAge(m.date_naissance)} ans)</option>`;
  });
  
  // Générer les checkboxes de départements
  const deptContainer = document.getElementById('form-departments-checkboxes');
  deptContainer.innerHTML = "";
  depts.forEach(d => {
    deptContainer.innerHTML += `
      <label style="display:flex; align-items:center; gap:8px; font-weight:normal; font-size:12px; cursor:pointer;">
        <input type="checkbox" name="form-depts" value="${d}"> <span>${d}</span>
      </label>
    `;
  });
  
  // Générer les checkboxes de formations
  const formContainer = document.getElementById('form-formations-checkboxes');
  formContainer.innerHTML = "";
  formsList.forEach(f => {
    formContainer.innerHTML += `
      <label style="display:flex; align-items:center; gap:8px; font-weight:normal; font-size:12px; cursor:pointer;">
        <input type="checkbox" name="form-forms" value="${f}"> <span>${f}</span>
      </label>
    `;
  });
  
  // Reset Formulaire
  document.getElementById('member-form').reset();
  document.getElementById('form-member-id').value = "";
  document.getElementById('form-avatar-preview-container').innerHTML = `<i class="fa-solid fa-user-tie" style="font-size:24px; color:var(--text-muted);" id="form-avatar-placeholder"></i>`;
  document.getElementById('form-avatar-preview-container').removeAttribute('data-photo-url');
  if (document.getElementById('btn-remove-photo')) document.getElementById('btn-remove-photo').style.display = 'none';
  
  if (memberId) {
    // Mode Édition : Pré-remplir les données
    const mbr = allMembers.find(m => m.id === memberId);
    if (mbr) {
      document.getElementById('member-modal-title').innerText = `Modifier la fiche de ${mbr.nom.toUpperCase()} ${mbr.prenoms}`;
      document.getElementById('form-member-id').value = mbr.id;
      
      if (mbr.photo && !mbr.photo.includes('removed')) {
        document.getElementById('form-avatar-preview-container').innerHTML = `<img src="${mbr.photo}" style="width:100%; height:100%; object-fit:cover;">`;
        if (document.getElementById('btn-remove-photo')) document.getElementById('btn-remove-photo').style.display = 'inline-flex';
      }
      
      document.getElementById('form-nom').value = mbr.nom;
      document.getElementById('form-prenoms').value = mbr.prenoms;
      document.getElementById('form-sexe').value = mbr.sexe;
      document.getElementById('form-dob').value = mbr.date_naissance || "";
      document.getElementById('form-marital').value = mbr.situation_matrimoniale || "Célibataire";
      document.getElementById('form-phone').value = mbr.telephone || "";
      document.getElementById('form-whatsapp').value = mbr.whatsapp || "";
      document.getElementById('form-email').value = mbr.email || "";
      document.getElementById('form-profession').value = mbr.profession || "";
      document.getElementById('form-address').value = mbr.adresse || "";
      document.getElementById('form-date-integration').value = mbr.date_integration || "";
      document.getElementById('form-statut').value = mbr.statut || "Actif";
      
      // Spirituel
      document.getElementById('form-conversion-date').value = mbr.parcours_spirituel.date_conversion || "";
      document.getElementById('form-conversion-lieu').value = mbr.parcours_spirituel.lieu_conversion || "";
      document.getElementById('form-bapteme-eau-date').value = mbr.parcours_spirituel.date_bapteme_eau || "";
      document.getElementById('form-bapteme-eau-celebrant').value = mbr.parcours_spirituel.celebrant_bapteme_eau || "";
      document.getElementById('form-bapteme-esprit-date').value = mbr.parcours_spirituel.date_bapteme_esprit || "";
      document.getElementById('form-cellule').value = mbr.appartenance.cellule_id || "";
      
      // Cocher Départements
      if (mbr.appartenance.departements) {
        mbr.appartenance.departements.forEach(dept => {
          const chk = document.querySelector(`input[name="form-depts"][value="${dept}"]`);
          if (chk) chk.checked = true;
        });
      }
      
      // Cocher Formations
      if (mbr.parcours_spirituel.formations) {
        mbr.parcours_spirituel.formations.forEach(f => {
          const chk = document.querySelector(`input[name="form-forms"][value="${f}"]`);
          if (chk) chk.checked = true;
        });
      }
      
      // Relations
      document.getElementById('form-conjoint').value = mbr.relations.conjoint_id || "";
      
      // Cocher Enfants (Multi-select)
      if (mbr.relations.enfants_ids) {
        mbr.relations.enfants_ids.forEach(childId => {
          const opt = enfantsSelect.querySelector(`option[value="${childId}"]`);
          if (opt) opt.selected = true;
        });
      }
      
      document.getElementById('form-notes-pastorales').value = mbr.parcours_spirituel.notes_pastorales || "";
    }
  } else {
    document.getElementById('member-modal-title').innerText = "Ajouter un Nouveau Membre d'Église";
  }
  
  openModal('modal-member');
}

function removePhotoUpload() {
  const previewContainer = document.getElementById('form-avatar-preview-container');
  previewContainer.innerHTML = `<i class="fa-solid fa-user-tie" style="font-size:24px; color:var(--text-muted);" id="form-avatar-placeholder"></i>`;
  previewContainer.setAttribute('data-photo-url', 'removed');
  document.getElementById('form-member-photo').value = "";
  if (document.getElementById('btn-remove-photo')) document.getElementById('btn-remove-photo').style.display = 'none';
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const previewContainer = document.getElementById('form-avatar-preview-container');
    previewContainer.setAttribute('data-photo-url', 'loading');
    previewContainer.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:24px; color:var(--primary-color); display:flex; justify-content:center; align-items:center; height:100%;"></i>';
    
    const reader = new FileReader();
    reader.onload = function(e) {
      // Compresser l'image pour éviter les dépassements de taille Firestore (max 1Mo) et optimiser la bande passante
      compressImage(e.target.result, 160, 160, 0.75, function(compressedData) {
        document.getElementById('form-avatar-preview-container').innerHTML = `<img src="${compressedData}" style="width:100%; height:100%; object-fit:cover;">`;
        document.getElementById('form-avatar-preview-container').setAttribute('data-photo-url', compressedData);
        if (document.getElementById('btn-remove-photo')) document.getElementById('btn-remove-photo').style.display = 'inline-flex';
      });
    };
    reader.readAsDataURL(file);
  }
}

function saveMemberForm(event) {
  event.preventDefault();
  
  const memberId = document.getElementById('form-member-id').value;
  const isNew = !memberId;
  
  const photo = document.getElementById('form-avatar-preview-container').getAttribute('data-photo-url') || "";
  
  if (photo === 'loading') {
    showToast("Veuillez patienter pendant le traitement de la photo.", "warning");
    return;
  }
  
  // Rassembler Départements cochés
  const deptsChecked = [];
  document.querySelectorAll('input[name="form-depts"]:checked').forEach(chk => {
    deptsChecked.push(chk.value);
  });
  
  // Rassembler Formations cochées
  const formsChecked = [];
  document.querySelectorAll('input[name="form-forms"]:checked').forEach(chk => {
    formsChecked.push(chk.value);
  });
  
  // Rassembler Enfants
  const enfantsSelect = document.getElementById('form-enfants');
  const enfantsIds = Array.from(enfantsSelect.selectedOptions).map(opt => opt.value);
  
  const payload = {
    nom: document.getElementById('form-nom').value.toUpperCase(),
    prenoms: document.getElementById('form-prenoms').value,
    sexe: document.getElementById('form-sexe').value,
    date_naissance: document.getElementById('form-dob').value,
    situation_matrimoniale: document.getElementById('form-marital').value,
    telephone: document.getElementById('form-phone').value,
    whatsapp: document.getElementById('form-whatsapp').value,
    email: document.getElementById('form-email').value,
    profession: document.getElementById('form-profession').value,
    adresse: document.getElementById('form-address').value,
    date_integration: document.getElementById('form-date-integration').value,
    statut: document.getElementById('form-statut').value,
    
    parcours_spirituel: {
      date_conversion: document.getElementById('form-conversion-date').value,
      lieu_conversion: document.getElementById('form-conversion-lieu').value,
      date_bapteme_eau: document.getElementById('form-bapteme-eau-date').value,
      celebrant_bapteme_eau: document.getElementById('form-bapteme-eau-celebrant').value,
      date_bapteme_esprit: document.getElementById('form-bapteme-esprit-date').value,
      formations: formsChecked,
      notes_pastorales: document.getElementById('form-notes-pastorales').value
    },
    
    appartenance: {
      cellule_id: document.getElementById('form-cellule').value,
      departements: deptsChecked,
      fonction: "Membre simple", // Valeur par défaut modifiable
      historique_responsabilites: []
    },
    
    relations: {
      conjoint_id: document.getElementById('form-conjoint').value,
      enfants_ids: enfantsIds
    }
  };
  
  if (photo) {
    payload.photo = photo;
  }
  
  if (isNew) {
    payload.id = `mbr_${Date.now()}`;
    if (!payload.photo || payload.photo === 'removed') {
      const initials = (payload.prenoms[0] + payload.nom[0]).toUpperCase();
      payload.photo = generatePremiumSvgAvatar(initials, payload.sexe, DBEngine.getCollection('membres').length);
    }
    DBEngine.insert('membres', payload);
    showToast(`Membre ${payload.nom.toUpperCase()} ${payload.prenoms} inséré avec succès !`);
  } else {
    // Si pas de photo chargée mais qu'il y en avait déjà une, conserver l'ancienne
    const oldMbr = DBEngine.getCollection('membres').find(x => x.id === memberId);
    if (!photo && oldMbr) {
      payload.photo = oldMbr.photo;
    }
    if (photo === 'removed') {
      const initials = (payload.prenoms[0] + payload.nom[0]).toUpperCase();
      payload.photo = generatePremiumSvgAvatar(initials, payload.sexe, DBEngine.getCollection('membres').length);
    }
    DBEngine.update('membres', memberId, payload);
    showToast(`Fiche de ${payload.nom.toUpperCase()} ${payload.prenoms} mise à jour !`);
  }
  
  closeModal('modal-member');
  
  // Recharger l'affichage membres ou fermer profil et revenir à l'annuaire
  if (!isNew && activeMemberId === memberId) {
    openMemberDetails(memberId);
  } else {
    applyMembersFilters();
  }
}

function editCurrentMember() {
  if (activeMemberId) {
    openMemberFormModal(activeMemberId);
  }
}

// --- IMPRESSION FICHE MEMBRE A4/A5 ---
function printMemberFiche() {
  // Configurer le document pour l'impression en ciblant uniquement le conteneur actif
  window.print();
}

function printMembersAnnuary() {
  // Impose le layout de liste à l'impression
  window.print();
}

// --- CONTROLEUR : NOUVEAUX CONVERTIS (VISITEURS) ---
function initVisitorsView() {
  const visitors = DBEngine.getCollection('visiteurs');
  
  // Vider les colonnes
  const col1 = document.getElementById('stage-1-container');
  const col2 = document.getElementById('stage-2-container');
  const col3 = document.getElementById('stage-3-container');
  const col4 = document.getElementById('stage-4-container');
  
  col1.innerHTML = "";
  col2.innerHTML = "";
  col3.innerHTML = "";
  col4.innerHTML = "";
  
  let c1 = 0, c2 = 0, c3 = 0, c4 = 0;
  
  visitors.forEach(v => {
    const card = document.createElement('div');
    card.className = 'visitor-card';
    
    // Déterminer son étape active
    let stage = 1;
    if (v.visite_pastorale) stage = 2;
    if (v.visite_pastorale && v.cours_base) stage = 3;
    if (v.visite_pastorale && v.cours_base && v.bapteme) stage = 4;
    
    // Checkbox active steps mapping HTML
    const stepsCheckboxesHtml = `
      <div style="display:flex; gap:6px; margin-top:8px;">
        <span class="tag-badge" style="background:${v.visite_pastorale ? 'var(--success-bg)' : 'transparent'}; color:${v.visite_pastorale ? 'var(--success-color)' : 'var(--text-muted)'};" onclick="toggleVisitorStep('${v.id}', 'visite_pastorale')"><i class="fa-solid fa-phone"></i> Visite</span>
        <span class="tag-badge" style="background:${v.cours_base ? 'var(--success-bg)' : 'transparent'}; color:${v.cours_base ? 'var(--success-color)' : 'var(--text-muted)'};" onclick="toggleVisitorStep('${v.id}', 'cours_base')"><i class="fa-solid fa-book-open"></i> Cours</span>
        <span class="tag-badge" style="background:${v.bapteme ? 'var(--success-bg)' : 'transparent'}; color:${v.bapteme ? 'var(--success-color)' : 'var(--text-muted)'};" onclick="toggleVisitorStep('${v.id}', 'bapteme')"><i class="fa-solid fa-droplet"></i> Baptême</span>
        <span class="tag-badge" style="background:${v.engagement ? 'var(--success-bg)' : 'transparent'}; color:${v.engagement ? 'var(--success-color)' : 'var(--text-muted)'};" onclick="toggleVisitorStep('${v.id}', 'engagement')"><i class="fa-solid fa-signature"></i> Engagé</span>
      </div>
    `;
    
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h5>${v.nom.toUpperCase()} ${v.prenoms}</h5>
          <p style="font-size:11px;"><i class="fa-solid fa-phone"></i> ${v.telephone}</p>
        </div>
        <span class="absent-badge" style="background:rgba(255,255,255,0.05); color:var(--text-secondary);">${v.statut}</span>
      </div>
      <p style="font-size:11px; font-style:italic; color:var(--text-muted); margin-top:4px;">"${v.observations || 'Aucune observation'}"</p>
      ${stepsCheckboxesHtml}
      <div class="visitor-actions">
        <span style="font-size:10px; color:var(--text-muted);">Depuis le ${formatDateFriendly(v.date_visite)}</span>
        <div style="display:flex; gap:6px;">
          <button class="action-icon-btn" onclick="promoteVisitorToMember('${v.id}')" title="Intégrer comme membre complet"><i class="fa-solid fa-user-check"></i> Intégrer</button>
          <button class="action-icon-btn" onclick="deleteVisitor('${v.id}')" style="background:var(--danger-bg); color:var(--danger-color); border:none;" title="Supprimer la fiche"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    
    if (stage === 1) { col1.appendChild(card); c1++; }
    else if (stage === 2) { col2.appendChild(card); c2++; }
    else if (stage === 3) { col3.appendChild(card); c3++; }
    else if (stage === 4) { col4.appendChild(card); c4++; }
  });
  
  document.getElementById('count-stage-1').innerText = c1;
  document.getElementById('count-stage-2').innerText = c2;
  document.getElementById('count-stage-3').innerText = c3;
  document.getElementById('count-stage-4').innerText = c4;
}

function openVisitorModal() {
  document.getElementById('visitor-form').reset();
  document.getElementById('form-visitor-id').value = "";
  document.getElementById('visitor-modal-title').innerText = "Ajouter un Visiteur / Nouveau Converti";
  
  openModal('modal-visitor');
}

function saveVisitorForm(event) {
  event.preventDefault();
  
  const id = document.getElementById('form-visitor-id').value;
  const isNew = !id;
  
  const payload = {
    nom: document.getElementById('form-visitor-nom').value.toUpperCase(),
    prenoms: document.getElementById('form-visitor-prenoms').value,
    telephone: document.getElementById('form-visitor-phone').value,
    statut: document.getElementById('form-visitor-statut').value,
    observations: document.getElementById('form-visitor-observations').value,
    visite_pastorale: document.getElementById('form-visitor-step1').checked,
    cours_base: document.getElementById('form-visitor-step2').checked,
    bapteme: document.getElementById('form-visitor-step3').checked,
    engagement: document.getElementById('form-visitor-step4').checked,
    date_visite: isNew ? new Date().toISOString().split('T')[0] : undefined
  };
  
  if (isNew) {
    payload.id = `vis_${Date.now()}`;
    DBEngine.insert('visiteurs', payload);
    showToast(`Visiteur ${payload.nom.toUpperCase()} ${payload.prenoms} enregistré !`);
  } else {
    DBEngine.update('visiteurs', id, payload);
    showToast("Suivi mis à jour !");
  }
  
  closeModal('modal-visitor');
  initVisitorsView();
}

function toggleVisitorStep(visitorId, stepName) {
  const visitor = DBEngine.getCollection('visiteurs').find(x => x.id === visitorId);
  if (visitor) {
    const updated = {};
    updated[stepName] = !visitor[stepName];
    DBEngine.update('visiteurs', visitorId, updated);
    initVisitorsView();
  }
}

function deleteVisitor(visitorId) {
  if (confirm("Voulez-vous vraiment retirer ce visiteur de la liste ?")) {
    DBEngine.delete('visiteurs', visitorId);
    showToast("Fiche visiteur supprimée.");
    initVisitorsView();
  }
}

function promoteVisitorToMember(visitorId) {
  const visitor = DBEngine.getCollection('visiteurs').find(x => x.id === visitorId);
  if (!visitor) return;
  
  // Ouvrir le formulaire de membre en y pré-remplissant les données du visiteur
  openMemberFormModal();
  
  // Pré-remplir
  document.getElementById('form-nom').value = visitor.nom;
  document.getElementById('form-prenoms').value = visitor.prenoms;
  document.getElementById('form-phone').value = visitor.telephone;
  document.getElementById('form-whatsapp').value = visitor.telephone;
  
  document.getElementById('form-conversion-date').value = visitor.date_visite;
  document.getElementById('form-date-integration').value = new Date().toISOString().split('T')[0];
  
  // Cochez les formations reçues
  if (visitor.cours_base) {
    const chk = document.querySelector(`input[name="form-forms"][value="Cours d'intégration"]`);
    if (chk) chk.checked = true;
  }
  
  document.getElementById('form-notes-pastorales').value = `Converti(e) promu(e) depuis le pipeline des visiteurs. Observations initiales : ${visitor.observations || 'Aucune'}`;
  
  // Archiver / Supprimer le visiteur du pipeline une fois converti
  DBEngine.delete('visiteurs', visitorId);
}

// --- CONTROLEUR : CULTES & CALENDRIER ---
function initCultsView() {
  renderCultsList();
  
  // Charger les prédicateurs et intervenants potentiels
  const members = DBEngine.getCollection('membres').filter(m => m.statut === 'Actif');
  
  const predSelect = document.getElementById('form-cult-predicateur');
  const modSelect = document.getElementById('form-cult-moderateur');
  const louangeSelect = document.getElementById('form-cult-louange');
  
  predSelect.innerHTML = `<option value="">-- Sélectionner --</option>`;
  modSelect.innerHTML = `<option value="">-- Sélectionner --</option>`;
  louangeSelect.innerHTML = `<option value="">-- Sélectionner --</option>`;
  
  members.forEach(m => {
    const opt = `<option value="${m.id}">${m.nom.toUpperCase()} ${m.prenoms}</option>`;
    predSelect.innerHTML += opt;
    modSelect.innerHTML += opt;
    louangeSelect.innerHTML += opt;
  });
}

function renderCultsList() {
  const cults = DBEngine.getCollection('cults');
  const members = DBEngine.getCollection('membres');
  const tbody = document.getElementById('cults-list-table-body');
  
  const typeFilter = document.getElementById('filter-cults-type').value;
  const statusFilter = document.getElementById('filter-cults-status').value;
  
  tbody.innerHTML = "";
  
  // Trier par date décroissante
  const sorted = [...cults].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  sorted.forEach(c => {
    if (typeFilter && c.type !== typeFilter) return;
    if (statusFilter && c.statut !== statusFilter) return;
    
    const pred = members.find(m => m.id === c.predicateur_id);
    const predName = pred ? `${pred.nom.toUpperCase()} ${pred.prenoms}` : (c.predicateur_id || '--');
    
    let badgeClass = "status-actif"; // Vert pour Terminé / Confirmé
    if (c.statut === 'Planifié') badgeClass = "status-info";
    if (c.statut === 'Annulé') badgeClass = "status-decede";
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${formatDateFriendly(c.date)} à ${c.heure}</strong></td>
      <td>${c.type}</td>
      <td>${c.theme}</td>
      <td>${predName}</td>
      <td><span class="card-status-badge ${badgeClass}" style="position:relative; top:0; right:0;">${c.statut}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="action-icon-btn" style="background: rgba(99,102,241, 0.1); color: var(--primary-color); border: none;" onclick="openCultBuilder('${c.id}')" title="Ordonner le culte (Liturgie)"><i class="fa-solid fa-list-check"></i></button>
          <button class="action-icon-btn" style="background: rgba(16,185,129, 0.1); color: #10b981; border: none;" onclick="openAttendanceModal('${c.id}')" title="Prendre les présences (Émargement)"><i class="fa-solid fa-clipboard-user"></i></button>
          <button class="action-icon-btn" style="background: rgba(245,158,11, 0.1); color: #f59e0b; border: none;" onclick="openCultModal('${c.id}')" title="Modifier l'événement"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="action-icon-btn" style="background: rgba(239,68,68, 0.1); color: #ef4444; border: none;" onclick="deleteCult('${c.id}')" title="Supprimer l'événement"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Aucun événement ne correspond aux filtres.</td></tr>`;
  }
}

function openCultModal(cultId = null) {
  document.getElementById('cult-form').reset();
  document.getElementById('form-cult-id').value = "";
  document.getElementById('cult-modal-title').innerText = "Planifier un Culte";
  
  if (cultId) {
    const cult = DBEngine.getCollection('cults').find(x => x.id === cultId);
    if (cult) {
      document.getElementById('cult-modal-title').innerText = "Modifier l'Événement";
      document.getElementById('form-cult-id').value = cult.id;
      document.getElementById('form-cult-type').value = cult.type;
      document.getElementById('form-cult-status').value = cult.statut;
      document.getElementById('form-cult-date').value = cult.date;
      document.getElementById('form-cult-time').value = cult.heure;
      document.getElementById('form-cult-theme').value = cult.theme;
      document.getElementById('form-cult-verset').value = cult.verset_cle || "";
      document.getElementById('form-cult-predicateur').value = cult.predicateur_id || "";
      document.getElementById('form-cult-moderateur').value = cult.intervenants_affectes?.moderateur || "";
      document.getElementById('form-cult-louange').value = cult.intervenants_affectes?.conducteur_louange || "";
    }
  }
  
  openModal('modal-cult');
}

function saveCultForm(event) {
  event.preventDefault();
  
  const id = document.getElementById('form-cult-id').value;
  const isNew = !id;
  
  const payload = {
    type: document.getElementById('form-cult-type').value,
    statut: document.getElementById('form-cult-status').value,
    date: document.getElementById('form-cult-date').value,
    heure: document.getElementById('form-cult-time').value,
    theme: document.getElementById('form-cult-theme').value,
    verset_cle: document.getElementById('form-cult-verset').value,
    predicateur_id: document.getElementById('form-cult-predicateur').value,
    intervenants_affectes: {
      precheur: document.getElementById('form-cult-predicateur').value,
      moderateur: document.getElementById('form-cult-moderateur').value,
      conducteur_louange: document.getElementById('form-cult-louange').value
    }
  };
  
  if (isNew) {
    payload.id = `clt_${Date.now()}`;
    payload.programme = [
      { segment: "Accueil & Prière d'ouverture", duree: 10, intervenant_id: payload.intervenants_affectes.moderateur },
      { segment: "Louange & Adoration", duree: 40, intervenant_id: payload.intervenants_affectes.conducteur_louange },
      { segment: "Annonces & Offrandes", duree: 15, intervenant_id: payload.intervenants_affectes.moderateur },
      { segment: "Prédication", duree: 45, intervenant_id: payload.predicateur_id },
      { segment: "Bénédiction finale", duree: 10, intervenant_id: payload.predicateur_id }
    ];
    payload.presences = [];
    DBEngine.insert('cults', payload);
    showToast("Culte planifié avec succès !");
  } else {
    DBEngine.update('cults', id, payload);
    showToast("Événement mis à jour !");
  }
  
  closeModal('modal-cult');
  renderCultsList();
}

function deleteCult(cultId) {
  if (confirm("Supprimer ce culte annulera également son programme détaillé. Confirmer ?")) {
    DBEngine.delete('cults', cultId);
    showToast("Événement supprimé.");
    renderCultsList();
  }
}

// --- DETAILED LITURGICAL PROGRAM BUILDER ---
function openCultBuilder(cultId) {
  activeCultId = cultId;
  const cult = DBEngine.getCollection('cults').find(x => x.id === cultId);
  const members = DBEngine.getCollection('membres');
  
  if (!cult) return;
  
  // Basculer l'affichage
  document.getElementById('cults-list-table-body').closest('.card-panel').style.display = 'none';
  document.getElementById('cults-list-table-body').closest('.card-panel').previousElementSibling.style.display = 'none'; // filters
  document.getElementById('cult-details-builder-container').style.display = 'block';
  
  document.getElementById('builder-service-title').innerText = `${cult.type} — ${formatDateFriendly(cult.date)}`;
  document.getElementById('builder-service-theme').innerText = `Thème : ${cult.theme} (${cult.verset_cle || 'Sans verset clé'})`;
  
  // 1. Remplir le tableau des segments de liturgie
  renderProgramSegments(cult, members);
  
  // 2. Remplir la checklist des membres pour les présences
  renderAttendanceChecklist(cult, members);
}

function closeCultBuilder() {
  activeCultId = null;
  document.getElementById('cults-list-table-body').closest('.card-panel').style.display = 'flex';
  document.getElementById('cults-list-table-body').closest('.card-panel').previousElementSibling.style.display = 'flex'; // filters
  document.getElementById('cult-details-builder-container').style.display = 'none';
}

function renderProgramSegments(cult, members) {
  const tbody = document.getElementById('builder-program-tbody');
  tbody.innerHTML = "";
  
  let startHour = cult.heure; // Format "08:00"
  
  cult.programme.forEach((item, index) => {
    // Calcul de l'heure séquentielle
    const calcHour = calculateNextHour(startHour, item.duree);
    
    // Générer select intervenants
    let options = `<option value="">-- Aucun --</option>`;
    members.filter(m => m.statut === 'Actif').forEach(m => {
      options += `<option value="${m.id}" ${m.id === item.intervenant_id ? 'selected' : ''}>${m.nom.toUpperCase()} ${m.prenoms}</option>`;
    });
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span style="font-weight:700; color:var(--primary-light);">${startHour}</span></td>
      <td><input type="text" value="${item.segment}" class="filter-select" style="width:100%; border:none; background:rgba(255,255,255,0.02); padding:6px 10px;" id="seg-name-${index}"></td>
      <td><input type="number" value="${item.duree}" class="filter-select" style="width:80px; border:none; background:rgba(255,255,255,0.02); padding:6px 10px;" id="seg-dur-${index}" onchange="recalculateLiturgicalHours()"></td>
      <td>
        <select class="filter-select" style="width:100%; border:none; background:rgba(255,255,255,0.02); padding:6px 10px;" id="seg-int-${index}">
          ${options}
        </select>
      </td>
      <td>
        <button class="action-icon-btn" onclick="deleteSegmentRow(${index})" style="background:var(--danger-bg); color:var(--danger-color); border:none;"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
    
    startHour = calcHour;
  });
}

function calculateNextHour(timeString, durationMinutes) {
  const [h, m] = timeString.split(':').map(Number);
  const totalMin = h * 60 + m + Number(durationMinutes);
  const nextH = Math.floor(totalMin / 60) % 24;
  const nextM = totalMin % 60;
  return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
}

function recalculateLiturgicalHours() {
  const cult = DBEngine.getCollection('cults').find(x => x.id === activeCultId);
  if (!cult) return;
  
  // Lire les durées actuelles à l'écran
  const rows = document.querySelectorAll('#builder-program-tbody tr');
  let startHour = cult.heure;
  
  rows.forEach((row, index) => {
    const durInput = document.getElementById(`seg-dur-${index}`);
    if (durInput) {
      const dur = Number(durInput.value);
      row.cells[0].querySelector('span').innerText = startHour;
      startHour = calculateNextHour(startHour, dur);
    }
  });
}

function addSegmentRow() {
  const cult = DBEngine.getCollection('cults').find(x => x.id === activeCultId);
  if (cult) {
    // Ajouter un segment vide
    cult.programme.push({ segment: "Nouveau Segment", duree: 15, intervenant_id: "" });
    DBEngine.update('cults', activeCultId, { programme: cult.programme });
    
    // Re-rendre
    renderProgramSegments(cult, DBEngine.getCollection('membres'));
  }
}

function deleteSegmentRow(index) {
  const cult = DBEngine.getCollection('cults').find(x => x.id === activeCultId);
  if (cult) {
    cult.programme.splice(index, 1);
    DBEngine.update('cults', activeCultId, { programme: cult.programme });
    
    renderProgramSegments(cult, DBEngine.getCollection('membres'));
  }
}

function saveActiveServiceOrder() {
  const cult = DBEngine.getCollection('cults').find(x => x.id === activeCultId);
  if (!cult) return;
  
  // Recomposer l'array programme à partir de l'écran
  const newProgram = [];
  const rows = document.querySelectorAll('#builder-program-tbody tr');
  
  rows.forEach((row, index) => {
    const segName = document.getElementById(`seg-name-${index}`).value;
    const segDur = Number(document.getElementById(`seg-dur-${index}`).value);
    const segInt = document.getElementById(`seg-int-${index}`).value;
    
    newProgram.push({
      segment: segName,
      duree: segDur,
      intervenant_id: segInt
    });
  });
  
  // Enregistrer également la checklist des présences cochées
  const checkedBoxes = document.querySelectorAll('#attendance-members-checklist input[type="checkbox"]:checked');
  const presencesIds = Array.from(checkedBoxes).map(chk => chk.value);
  
  DBEngine.update('cults', activeCultId, {
    programme: newProgram,
    presences: presencesIds,
    statut: 'Terminé' // Le culte passe automatiquement en Terminé après prise des présences
  });
  
  showToast("Feuille de liturgie & présences enregistrées avec succès !");
  closeCultBuilder();
  renderCultsList();
}

function renderAttendanceChecklist(cult, members) {
  const container = document.getElementById('attendance-members-checklist');
  container.innerHTML = "";
  
  members.filter(m => m.statut === 'Actif').forEach(m => {
    const isPresent = cult.presences.includes(m.id);
    const label = document.createElement('label');
    label.style = "display:flex; align-items:center; justify-content:space-between; padding:10px; border-radius:var(--radius-md); background:var(--bg-surface-hover); cursor:pointer; font-weight:500; font-size:13px;";
    
    label.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <input type="checkbox" value="${m.id}" ${isPresent ? 'checked' : ''} style="width:16px; height:16px;">
        <span>${m.nom.toUpperCase()} ${m.prenoms}</span>
      </div>
      <span class="tag-badge" style="font-size:9px;">${m.appartenance.departements[0] || 'Actif'}</span>
    `;
    container.appendChild(label);
  });
}

function markAllMembersAsPresent() {
  const checkboxes = document.querySelectorAll('#attendance-members-checklist input[type="checkbox"]');
  checkboxes.forEach(chk => chk.checked = true);
  showToast("Tous les membres cochés comme présents.");
}

function printFeuilleDeCulte() {
  window.print();
}

// --- CONTROLEUR : CONTRIBUTIONS FINANCIÈRES ---
function initFinancesView() {
  const contributions = DBEngine.getCollection('contributions');
  const members = DBEngine.getCollection('membres');
  
  // Remplir le formulaire select avec les membres actifs
  const memberSelect = document.getElementById('form-finance-member');
  memberSelect.innerHTML = `<option value="">-- Sélectionner un Membre --</option>`;
  members.filter(m => m.statut === 'Actif').forEach(m => {
    memberSelect.innerHTML += `<option value="${m.id}">${m.nom.toUpperCase()} ${m.prenoms}</option>`;
  });
  
  // Calculer les statistiques du mois en cours (Mai 2026)
  let totalDimes = 0;
  let totalOffrandes = 0;
  let totalSpecials = 0;
  
  contributions.forEach(c => {
    const date = new Date(c.date);
    // Vérifier si c'est Mai 2026
    if (date.getMonth() === 4 && date.getFullYear() === 2026) {
      if (c.type === 'Dîme') totalDimes += c.montant;
      if (c.type === 'Offrande Ordinaire') totalOffrandes += c.montant;
      if (c.type === 'Offrande Spéciale') totalSpecials += c.montant;
    }
  });
  
  document.getElementById('finance-total-dimes').innerText = `${totalDimes.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('finance-total-offrandes').innerText = `${totalOffrandes.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('finance-total-specials').innerText = `${totalSpecials.toLocaleString('fr-FR')} FCFA`;
  
  renderFinancesLedger();
}

function renderFinancesLedger() {
  const contributions = DBEngine.getCollection('contributions');
  const members = DBEngine.getCollection('membres');
  const tbody = document.getElementById('finances-ledger-table-body');
  
  const typeFilter = document.getElementById('filter-finance-type').value;
  
  tbody.innerHTML = "";
  
  // Trier par date décroissante
  const sorted = [...contributions].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  sorted.forEach(c => {
    if (typeFilter && c.type !== typeFilter) return;
    
    const donor = members.find(m => m.id === c.membre_id);
    const donorName = donor ? `${donor.nom.toUpperCase()} ${donor.prenoms}` : 'Anonyme / Inconnu';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateFriendly(c.date)}</td>
      <td><strong>${donorName}</strong></td>
      <td><span class="absent-badge" style="background:var(--success-bg); color:var(--success-color);">${c.type}</span></td>
      <td><strong>${c.montant.toLocaleString('fr-FR')} FCFA</strong></td>
      <td>${c.details || '--'}</td>
      <td>
        <button class="action-icon-btn" onclick="deleteContribution('${c.id}')" style="background:var(--danger-bg); color:var(--danger-color); border:none;"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Aucune transaction dans le grand livre financier.</td></tr>`;
  }
}

function openFinanceModal() {
  document.getElementById('finance-form').reset();
  document.getElementById('form-finance-date').value = new Date().toISOString().split('T')[0];
  openModal('modal-finance');
}

function saveFinanceForm(event) {
  event.preventDefault();
  
  const payload = {
    id: `cnt_${Date.now()}`,
    membre_id: document.getElementById('form-finance-member').value,
    type: document.getElementById('form-finance-type').value,
    montant: Number(document.getElementById('form-finance-montant').value),
    date: document.getElementById('form-finance-date').value,
    details: document.getElementById('form-finance-details').value
  };
  
  DBEngine.insert('contributions', payload);
  showToast("Contribution insérée avec succès !");
  
  closeModal('modal-finance');
  initFinancesView();
}

function deleteContribution(id) {
  if (confirm("Voulez-vous vraiment annuler cette écriture financière ?")) {
    DBEngine.delete('contributions', id);
    showToast("Écriture supprimée.");
    initFinancesView();
  }
}

function exportFinancesCSV() {
  const contributions = DBEngine.getCollection('contributions');
  const members = DBEngine.getCollection('membres');
  
  let csv = "Date;Donateur;Type de Don;Montant (FCFA);Details\n";
  contributions.forEach(c => {
    const donor = members.find(m => m.id === c.membre_id);
    const donorName = donor ? `${donor.nom.toUpperCase()} ${donor.prenoms}` : 'Inconnu';
    csv += `${c.date};${donorName};${c.type};${c.montant};${c.details || ''}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Finances_APF_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("Grand livre financier exporté en CSV !");
}

// --- CONTROLEUR : RESSOURCES ---
function initResourcesView() {
  const resources = DBEngine.getCollection('resources');
  const cults = DBEngine.getCollection('cults');
  const reservations = DBEngine.getCollection('reservations');
  
  // Remplir la liste d'inventaire
  const tbody = document.getElementById('resources-inventory-tbody');
  tbody.innerHTML = "";
  resources.forEach(res => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${res.nom}</strong></td>
      <td>${res.categorie}</td>
      <td>${res.quantite_totale}</td>
      <td>${res.quantite_dispo}</td>
      <td><span class="absent-badge" style="background:var(--success-bg); color:var(--success-color);">${res.etat}</span></td>
      <td>
        <button class="action-icon-btn" onclick="deleteResource('${res.id}')" style="background:var(--danger-bg); color:var(--danger-color); border:none;"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Charger les listes déroulantes pour réservation
  const cultSelect = document.getElementById('form-rev-cult');
  cultSelect.innerHTML = "";
  cults.filter(c => c.statut !== 'Terminé').forEach(c => {
    cultSelect.innerHTML += `<option value="${c.id}">${c.type} du ${formatDateFriendly(c.date)}</option>`;
  });
  
  const resSelect = document.getElementById('form-rev-res');
  resSelect.innerHTML = "";
  resources.forEach(r => {
    resSelect.innerHTML += `<option value="${r.id}">${r.nom} (Dispo: ${r.quantite_dispo})</option>`;
  });
  
  // Remplir les réservations actives
  const resList = document.getElementById('resources-reservations-list');
  resList.innerHTML = "";
  
  reservations.forEach(rev => {
    const cObj = cults.find(c => c.id === rev.cult_id);
    const rObj = resources.find(r => r.id === rev.resource_id);
    
    if (cObj && rObj) {
      const item = document.createElement('div');
      item.className = 'alert-item';
      item.innerHTML = `
        <div class="item-avatar-group">
          <div class="user-avatar" style="background:var(--info-bg); color:var(--info-color);"><i class="fa-solid fa-bookmark"></i></div>
          <div class="item-text">
            <h4>${rObj.nom} (x${rev.quantite})</h4>
            <p>${cObj.type} du ${formatDateFriendly(cObj.date)}</p>
            <p style="font-size:10px; color:var(--text-muted);">${rev.details || ''}</p>
          </div>
        </div>
        <button class="action-icon-btn" onclick="deleteReservation('${rev.id}')" style="background:var(--danger-bg); color:var(--danger-color); border:none;"><i class="fa-solid fa-trash"></i></button>
      `;
      resList.appendChild(item);
    }
  });
  
  if (reservations.length === 0) {
    resList.innerHTML = `<p style="font-size:13px; font-style:italic; color:var(--text-muted); text-align:center; padding:16px;">Aucune réservation en cours.</p>`;
  }
}

function openResourceModal() {
  document.getElementById('resource-form').reset();
  openModal('modal-resource');
}

function saveResourceForm(event) {
  event.preventDefault();
  
  const payload = {
    id: `res_${Date.now()}`,
    nom: document.getElementById('form-res-name').value,
    categorie: document.getElementById('form-res-cat').value,
    quantite_totale: Number(document.getElementById('form-res-qty').value),
    quantite_dispo: Number(document.getElementById('form-res-qty').value),
    etat: document.getElementById('form-res-state').value
  };
  
  DBEngine.insert('resources', payload);
  showToast("Matériel répertorié dans l'inventaire !");
  
  closeModal('modal-resource');
  initResourcesView();
}

function deleteResource(id) {
  if (confirm("Supprimer cette ressource de l'inventaire ?")) {
    DBEngine.delete('resources', id);
    showToast("Ressource retirée.");
    initResourcesView();
  }
}

function openReservationModal() {
  document.getElementById('reservation-form').reset();
  openModal('modal-reservation');
}

function saveReservationForm(event) {
  event.preventDefault();
  
  const resId = document.getElementById('form-rev-res').value;
  const qty = Number(document.getElementById('form-rev-qty').value);
  
  // Vérifier la disponibilité
  const res = DBEngine.getCollection('resources').find(r => r.id === resId);
  if (res && res.quantite_dispo < qty) {
    showToast(`Quantité insuffisante disponible (${res.quantite_dispo} restante(s)).`, "error");
    return;
  }
  
  const payload = {
    id: `rev_${Date.now()}`,
    cult_id: document.getElementById('form-rev-cult').value,
    resource_id: resId,
    quantite: qty,
    details: document.getElementById('form-rev-details').value
  };
  
  // Déduire du disponible
  DBEngine.update('resources', resId, { quantite_dispo: res.quantite_dispo - qty });
  DBEngine.insert('reservations', payload);
  
  showToast("Matériel réservé pour l'événement.");
  closeModal('modal-reservation');
  initResourcesView();
}

function deleteReservation(id) {
  const rev = DBEngine.getCollection('reservations').find(r => r.id === id);
  if (rev) {
    // Restaurer le disponible
    const res = DBEngine.getCollection('resources').find(r => r.id === rev.resource_id);
    if (res) {
      DBEngine.update('resources', rev.resource_id, { quantite_dispo: res.quantite_dispo + rev.quantite });
    }
    DBEngine.delete('reservations', id);
    showToast("Réservation annulée.");
    initResourcesView();
  }
}

// --- CONTROLEUR : ANALYSES & RAPPORTS ---
function initReportsView() {
  const members = DBEngine.getCollection('membres');
  const visitors = DBEngine.getCollection('visiteurs');
  
  // 1. Graphique répartition par Sexe (Doughnut)
  renderGenderChart(members);
  
  // 2. Graphique répartition par Tranches d'Âge (Bar)
  renderAgeChart(members);
  
  // 3. Graphique Pipeline Conversion Visiteurs (Pie)
  renderConversionChart(visitors);
  
  // 4. Charger la liste des membres non baptisés d'eau
  renderUnbaptizedMembers(members);
  
  // 5. Charger le rapport de croissance mensuel simulé
  renderGrowthTable();
}

function renderGenderChart(members) {
  const ctx = document.getElementById('genderChart').getContext('2d');
  
  if (charts['gender']) charts['gender'].destroy();
  
  const mCount = members.filter(x => x.sexe === 'H' && x.statut === 'Actif').length;
  const fCount = members.filter(x => x.sexe === 'F' && x.statut === 'Actif').length;
  
  charts['gender'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Hommes', 'Femmes'],
      datasets: [{
        data: [mCount, fCount],
        backgroundColor: [chartColors.primary, chartColors.info],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.8)' } },
        title: { display: true, text: 'Répartition par Sexe', color: '#ffffff', font: { family: 'Outfit', size: 14 } }
      }
    }
  });
}

function renderAgeChart(members) {
  const ctx = document.getElementById('ageChart').getContext('2d');
  
  if (charts['age']) charts['age'].destroy();
  
  // Calculer par tranches
  let enfants = 0; // 0-15 ans
  let jeunes = 0;  // 16-30 ans
  let adultes = 0; // 31-55 ans
  let aines = 0;   // 56 ans et +
  
  members.filter(x => x.statut === 'Actif').forEach(m => {
    const age = calculateAge(m.date_naissance);
    if (age === '--') return;
    if (age <= 15) enfants++;
    else if (age <= 30) jeunes++;
    else if (age <= 55) adultes++;
    else aines++;
  });
  
  charts['age'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Enfants (0-15)', 'Jeunes (16-30)', 'Adultes (31-55)', 'Aînés (56+)'],
      datasets: [{
        data: [enfants, jeunes, adultes, aines],
        backgroundColor: chartColors.primary,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Tranches d\'Âge Actives', color: '#ffffff', font: { family: 'Outfit', size: 14 } }
      },
      scales: {
        x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
        y: { ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 }, grid: { color: chartColors.grid } }
      }
    }
  });
}

function renderConversionChart(visitors) {
  const ctx = document.getElementById('conversionChart').getContext('2d');
  
  if (charts['conversion']) charts['conversion'].destroy();
  
  const step1 = visitors.filter(v => v.visite_pastorale && !v.cours_base).length;
  const step2 = visitors.filter(v => v.visite_pastorale && v.cours_base && !v.bapteme).length;
  const step3 = visitors.filter(v => v.visite_pastorale && v.cours_base && v.bapteme && !v.engagement).length;
  const step4 = visitors.filter(v => v.visite_pastorale && v.cours_base && v.bapteme && v.engagement).length;
  
  charts['conversion'] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Visite pastorale', 'Cours de base', 'Baptême', 'Engagement final'],
      datasets: [{
        data: [step1, step2, step3, step4],
        backgroundColor: [chartColors.danger, chartColors.warning, chartColors.info, chartColors.success],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.8)' } },
        title: { display: true, text: 'Progression de l\'Intégration', color: '#ffffff', font: { family: 'Outfit', size: 14 } }
      }
    }
  });
}

function renderUnbaptizedMembers(members) {
  const tbody = document.getElementById('unbaptized-members-table-body');
  tbody.innerHTML = "";
  
  const unbaptized = members.filter(m => m.statut === 'Actif' && !m.parcours_spirituel.date_bapteme_eau);
  
  document.getElementById('unbaptized-members-count').innerText = unbaptized.length;
  
  unbaptized.forEach(m => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${m.nom.toUpperCase()} ${m.prenoms}</strong></td>
      <td>${m.sexe === 'H' ? 'Homme' : 'Femme'}</td>
      <td>${m.telephone || '--'}</td>
      <td>${formatDateFriendly(m.date_integration)}</td>
    `;
    tbody.appendChild(row);
  });
  
  if (unbaptized.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Excellent ! Tous les membres actifs de l'église sont baptisés d'eau.</td></tr>`;
  }
}

function renderGrowthTable() {
  const tbody = document.getElementById('church-monthly-growth-table');
  tbody.innerHTML = `
    <tr>
      <td><strong>Mai 2026</strong></td>
      <td>9 membres</td>
      <td>3 convertis</td>
      <td><span class="absent-badge" style="background:var(--success-bg); color:var(--success-color);">+33% Croissance</span></td>
    </tr>
    <tr>
      <td><strong>Avril 2026</strong></td>
      <td>8 membres</td>
      <td>1 converti</td>
      <td><span class="absent-badge" style="background:var(--success-bg); color:var(--success-color);">+12% Croissance</span></td>
    </tr>
    <tr>
      <td><strong>Mars 2026</strong></td>
      <td>7 membres</td>
      <td>1 converti</td>
      <td><span class="absent-badge" style="background:var(--success-bg); color:var(--success-color);">+14% Croissance</span></td>
    </tr>
  `;
}

// --- UTILS : RECHERCHE GLOBALE ---
function handleQuickSearch(event) {
  const query = event.target.value;
  
  if (activeView !== 'members') {
    switchView('members');
    document.getElementById('quick-search-input').value = query; // Restorer la valeur après switchView
  }
  
  applyMembersFilters();
}

// --- COMMUTATION DE THEME (SOMBRE / CLAIR) ---
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  
  // Basculer l'icône
  const icon = document.getElementById('theme-icon');
  if (newTheme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
  
  showToast(`Thème ${newTheme === 'dark' ? 'Sombre' : 'Clair'} activé.`);
  
  // Recréer les graphiques pour adapter les couleurs si nécessaire
  setTimeout(() => {
    if (activeView === 'dashboard') {
      renderGrowthChart();
    } else if (activeView === 'reports') {
      initReportsView();
    }
  }, 100);
}

// --- GESTION DE L'AGE DANS LE FORMULAIRE ---
function calculateFormAge() {
  const dobInput = document.getElementById('form-dob').value;
  if (dobInput) {
    const age = calculateAge(dobInput);
    showToast(`Âge calculé automatiquement : ${age} ans.`, "info");
  }
}

// --- IMPORTATION ET PARSING CSV ---

// Télécharger un modèle CSV pré-rempli avec exemples
function downloadCsvTemplate() {
  const headers = 'nom;prenoms;sexe;date_naissance;situation_matrimoniale;telephone;whatsapp;email;profession;adresse;date_integration;statut;cellule;departements';
  const example1 = 'KOGO;Afiwa Gertrude;F;1992-07-15;Marié(e);+228 90 99 88 77;+228 90 99 88 77;gertrude@email.com;Couturière;Bè, Lomé;2026-01-10;Actif;Bè-Plage;Louange,Diaconie';
  const example2 = 'MENSAH;Kossi Éric;H;1985-03-22;Célibataire;+228 91 23 45 67;;eric.mensah@email.com;Enseignant;Agoè, Lomé;2025-09-15;Actif;Agoè-Assiyéye;Jeunesse,Évangélisation';
  
  const csvContent = '\uFEFF' + [headers, example1, example2].join('\r\n') + '\r\n';
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modele_import_membres_ekklesia.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Modèle CSV téléchargé !', 'info');
}

function openCsvImportModal() {
  document.getElementById('csv-import-form').reset();
  const resultsEl = document.getElementById('csv-import-results');
  resultsEl.style.display = 'none';
  resultsEl.innerHTML = "";
  openModal('modal-csv-import');
}

function handleCsvImport(event) {
  event.preventDefault();
  const fileInput = document.getElementById('form-csv-file');
  const file = fileInput.files[0];
  const resultsEl = document.getElementById('csv-import-results');
  
  if (!file) {
    showToast("Veuillez sélectionner un fichier CSV.", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/);
    
    if (lines.length <= 1) {
      resultsEl.style.display = 'block';
      resultsEl.style.background = 'var(--danger-bg)';
      resultsEl.style.color = 'var(--danger-color)';
      resultsEl.innerHTML = "Le fichier CSV semble vide ou ne contient pas de données.";
      return;
    }
    
    // Lire la première ligne d'en-tête (détecter séparateur point-virgule ou virgule)
    let separator = ';';
    let headers = lines[0].toLowerCase().split(';');
    if (headers.length <= 1) {
      headers = lines[0].toLowerCase().split(',');
      separator = ',';
    }
    
    // Nettoyer les en-têtes (enlever les éventuels guillemets ou espaces)
    headers = headers.map(h => h.replace(/['"]+/g, '').trim());
    
    // Vérifier les en-têtes requis
    const nomIdx = headers.indexOf('nom');
    const prenomsIdx = headers.indexOf('prenoms');
    
    if (nomIdx === -1 || prenomsIdx === -1) {
      resultsEl.style.display = 'block';
      resultsEl.style.background = 'var(--danger-bg)';
      resultsEl.style.color = 'var(--danger-color)';
      resultsEl.innerHTML = "Format invalide. Les en-têtes 'nom' et 'prenoms' sont obligatoires.";
      return;
    }
    
    // Index des autres colonnes
    const sexeIdx = headers.indexOf('sexe');
    const dobIdx = headers.indexOf('date_naissance');
    const maritalIdx = headers.indexOf('situation_matrimoniale');
    const telIdx = headers.indexOf('telephone');
    const whatsappIdx = headers.indexOf('whatsapp');
    const emailIdx = headers.indexOf('email');
    const profIdx = headers.indexOf('profession');
    const addrIdx = headers.indexOf('adresse');
    const integIdx = headers.indexOf('date_integration');
    const statutIdx = headers.indexOf('statut');
    const cellIdx = headers.indexOf('cellule');
    const deptIdx = headers.indexOf('departements');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    const existingMembres = DBEngine.getCollection('membres');
    const cells = DBEngine.getCollection('cellules');
    
    // Parcourir les lignes de données
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Ignorer les lignes vides
      
      // Gérer simple split prenant en compte d'éventuels guillemets
      let values = [];
      if (line.includes('"')) {
        // Parsing naïf mais robuste pour valeurs entourées de guillemets
        let inQuotes = false;
        let token = "";
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === separator && !inQuotes) {
            values.push(token);
            token = "";
          } else {
            token += char;
          }
        }
        values.push(token);
      } else {
        values = line.split(separator);
      }
      
      // S'assurer qu'on a le nom et prénom minimum
      const nom = values[nomIdx]?.replace(/['"]+/g, '').trim().toUpperCase();
      const prenoms = values[prenomsIdx]?.replace(/['"]+/g, '').trim();
      
      if (!nom || !prenoms) {
        errorCount++;
        errors.push(`Ligne ${i + 1}: Nom ou Prénoms manquants.`);
        continue;
      }
      
      // Parser la cellule (nom de cellule -> id de cellule)
      let cellId = "";
      const cellName = values[cellIdx]?.replace(/['"]+/g, '').trim();
      if (cellName) {
        let foundCell = cells.find(c => c.nom.toLowerCase() === cellName.toLowerCase());
        if (!foundCell) {
          // Créer la cellule si elle n'existe pas
          foundCell = { id: `cell_${Date.now()}_${successCount}`, nom: cellName };
          DBEngine.insert('cellules', foundCell);
          cells.push(foundCell);
        }
        cellId = foundCell.id;
      }
      
      // Parser les départements (séparés par des virgules)
      let depts = [];
      const deptStr = values[deptIdx]?.replace(/['"]+/g, '').trim();
      if (deptStr) {
        depts = deptStr.split(',').map(d => d.trim()).filter(Boolean);
        // Ajouter les nouveaux départements au référentiel global s'ils n'existent pas
        const existingDepts = DBEngine.getCollection('departements');
        depts.forEach(d => {
          if (!existingDepts.includes(d)) {
            existingDepts.push(d);
            db.departements = existingDepts;
            DBEngine.save();
          }
        });
      }
      
      const rawSexe = values[sexeIdx]?.replace(/['"]+/g, '').trim().toUpperCase() || 'H';
      const sexe = (rawSexe === 'F' || rawSexe === 'FEMME') ? 'F' : 'H';
      const initials = (prenoms[0] + nom[0]).toUpperCase();
      
      const newMember = {
        id: `mbr_${Date.now()}_${successCount}`,
        nom: nom,
        prenoms: prenoms,
        photo: generatePremiumSvgAvatar(initials, sexe, existingMembres.length + successCount),
        date_naissance: values[dobIdx]?.replace(/['"]+/g, '').trim() || "",
        sexe: sexe,
        situation_matrimoniale: values[maritalIdx]?.replace(/['"]+/g, '').trim() || "Célibataire",
        telephone: values[telIdx]?.replace(/['"]+/g, '').trim() || "",
        whatsapp: values[whatsappIdx]?.replace(/['"]+/g, '').trim() || "",
        email: values[emailIdx]?.replace(/['"]+/g, '').trim() || "",
        profession: values[profIdx]?.replace(/['"]+/g, '').trim() || "",
        adresse: values[addrIdx]?.replace(/['"]+/g, '').trim() || "",
        date_integration: values[integIdx]?.replace(/['"]+/g, '').trim() || new Date().toISOString().split('T')[0],
        statut: values[statutIdx]?.replace(/['"]+/g, '').trim() || "Actif",
        
        parcours_spirituel: {
          date_conversion: "",
          lieu_conversion: "",
          date_bapteme_eau: "",
          celebrant_bapteme_eau: "",
          date_bapteme_esprit: "",
          formations: [],
          notes_pastorales: "Membre importé en lot via fichier CSV."
        },
        
        appartenance: {
          cellule_id: cellId,
          departements: depts,
          fonction: "Membre simple",
          historique_responsabilites: []
        },
        
        relations: {
          conjoint_id: "",
          enfants_ids: []
        }
      };
      
      DBEngine.insert('membres', newMember);
      successCount++;
    }
    
    // Afficher les résultats
    resultsEl.style.display = 'block';
    if (successCount > 0) {
      resultsEl.style.background = 'var(--success-bg)';
      resultsEl.style.color = 'var(--success-color)';
      let resultText = `<strong>Importation complétée !</strong><br>${successCount} membre(s) ajouté(s) avec succès.`;
      if (errorCount > 0) {
        resultText += `<br><span style="color:var(--danger-color);">${errorCount} ligne(s) ignorée(s) :<br>${errors.slice(0, 3).join('<br>')}${errors.length > 3 ? '<br>...' : ''}</span>`;
      }
      resultsEl.innerHTML = resultText;
      showToast(`${successCount} membres importés !`);
      
      // Recharger les vues et filtres
      loadMembersFilterOptions();
      applyMembersFilters();
      initDashboardView();
    } else {
      resultsEl.style.background = 'var(--danger-bg)';
      resultsEl.style.color = 'var(--danger-color)';
      resultsEl.innerHTML = `<strong>Échec de l'importation.</strong><br>Aucun membre n'a pu être importé.<br><span style="font-size:11px;">${errors.join('<br>')}</span>`;
    }
  };
  
  reader.readAsText(file, 'UTF-8');
}

// --- AUTHENTIFICATION ---
async function handleLogin(event) {
  event.preventDefault();
  const identifiant = document.getElementById('login-id').value.trim();
  const mdp = document.getElementById('login-pwd').value;
  const errorEl = document.getElementById('login-error');
  
  try {
    const email = identifiant.includes('@') ? identifiant : `${identifiant}@apflome.org`;
    if (firebase.auth) {
      await firebase.auth().signInWithEmailAndPassword(email, mdp);
      window.location.reload();
    } else {
      errorEl.style.display = 'block';
      errorEl.innerText = "Erreur: Firebase Auth n'est pas initialisé.";
    }
  } catch (error) {
    errorEl.style.display = 'block';
    if (error.code === 'auth/invalid-credential') {
      errorEl.innerText = "Mot de passe ou identifiant incorrect.";
    } else if (error.code === 'auth/user-not-found') {
      errorEl.innerText = "Ce compte n'existe pas dans Firebase.";
    } else {
      errorEl.innerText = `Erreur: ${error.message}`;
    }
    console.error("Login error:", error);
  }
}

function logout() {
  if (firebase.auth) {
    firebase.auth().signOut().then(() => {
      sessionStorage.removeItem('ekklesia_auth');
      window.location.reload();
    });
  } else {
    sessionStorage.removeItem('ekklesia_auth');
    window.location.reload();
  }
}

// --- PARAMETRES DU COMPTE ---
function openAccountSettings() {
  const activeUserId = sessionStorage.getItem('ekklesia_auth');
  if (!activeUserId) return;
  
  const user = DBEngine.getCollection('utilisateurs').find(u => u.id === activeUserId);
  if (!user) return;
  
  const mbr = DBEngine.getCollection('membres').find(m => m.id === user.membre_id);
  
  // Profil tab
  document.getElementById('settings-username').value = user.identifiant;
  document.getElementById('settings-role').value = user.role;
  document.getElementById('settings-linked-member').value = mbr ? `${mbr.nom.toUpperCase()} ${mbr.prenoms}` : 'Aucun';
  document.getElementById('settings-fullname').innerText = mbr ? `${mbr.nom.toUpperCase()} ${mbr.prenoms}` : user.identifiant;
  document.getElementById('settings-role-display').innerText = user.role;
  document.getElementById('settings-avatar').innerText = mbr ? (mbr.prenoms[0] + mbr.nom[0]).toUpperCase() : '??';
  document.getElementById('settings-profile-error').style.display = 'none';
  
  // Security tab
  document.getElementById('settings-current-pwd').value = '';
  document.getElementById('settings-pwd').value = '';
  document.getElementById('settings-pwd-confirm').value = '';
  document.getElementById('settings-security-error').style.display = 'none';
  
  // Users tab
  renderUsersList();
  document.getElementById('new-user-form-area').style.display = 'none';
  
  // Preferences tab
  const prefs = db.preferences || {};
  document.getElementById('settings-church-name').value = prefs.church_name || 'APF Lomé — Togo';
  if (prefs.currency) document.getElementById('settings-currency').value = prefs.currency;
  if (prefs.csv_delimiter) document.getElementById('settings-csv-delimiter').value = prefs.csv_delimiter;
  
  // Firebase Sync Preferences
  const firebaseSync = db.firebase_sync || {};
  document.getElementById('settings-firebase-sync-enabled').checked = !!firebaseSync.enabled;
  document.getElementById('settings-firebase-config').value = firebaseSync.config_string || '';
  toggleFirebaseConfigVisibility();
  
  // Reset to first tab
  switchSettingsTab('profil');
  
  openModal('account-settings-modal');
}

function closeAccountSettings() {
  closeModal('account-settings-modal');
}

function switchSettingsTab(tabName) {
  document.querySelectorAll('.settings-tab').forEach(t => {
    t.classList.remove('active');
    t.style.borderBottomColor = 'transparent';
    t.style.color = 'var(--text-muted)';
    t.style.fontWeight = '500';
  });
  document.querySelectorAll('.settings-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  
  const activeTab = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.style.borderBottomColor = 'var(--primary-color)';
    activeTab.style.color = 'var(--text-main)';
    activeTab.style.fontWeight = '600';
  }
  
  const activePanel = document.getElementById(`settings-panel-${tabName}`);
  if (activePanel) {
    activePanel.classList.add('active');
    activePanel.style.display = 'block';
  }
}

// --- Profil ---
function saveAccountProfile(event) {
  event.preventDefault();
  const activeUserId = sessionStorage.getItem('ekklesia_auth');
  if (!activeUserId) return;
  
  const newUsername = document.getElementById('settings-username').value.trim();
  const errorEl = document.getElementById('settings-profile-error');
  
  if (!newUsername) {
    errorEl.style.display = 'block';
    errorEl.innerText = "L'identifiant ne peut pas être vide.";
    return;
  }
  
  const utilisateurs = DBEngine.getCollection('utilisateurs');
  const exists = utilisateurs.find(u => u.identifiant === newUsername && u.id !== activeUserId);
  if (exists) {
    errorEl.style.display = 'block';
    errorEl.innerText = "Cet identifiant est déjà utilisé par un autre compte.";
    return;
  }
  
  const userIdx = utilisateurs.findIndex(u => u.id === activeUserId);
  if (userIdx !== -1) {
    utilisateurs[userIdx].identifiant = newUsername;
    DBEngine.save();
    showToast("Identifiant mis à jour avec succès.", "success");
    errorEl.style.display = 'none';
  }
}

// --- Sécurité ---
function saveAccountSecurity(event) {
  event.preventDefault();
  const activeUserId = sessionStorage.getItem('ekklesia_auth');
  if (!activeUserId) return;
  
  const currentPwd = document.getElementById('settings-current-pwd').value;
  const newPwd = document.getElementById('settings-pwd').value;
  const confirmPwd = document.getElementById('settings-pwd-confirm').value;
  const errorEl = document.getElementById('settings-security-error');
  
  const utilisateurs = DBEngine.getCollection('utilisateurs');
  const user = utilisateurs.find(u => u.id === activeUserId);
  
  if (!user || user.mot_de_passe !== currentPwd) {
    errorEl.style.display = 'block';
    errorEl.innerText = "Le mot de passe actuel est incorrect.";
    return;
  }
  
  if (newPwd.length < 4) {
    errorEl.style.display = 'block';
    errorEl.innerText = "Le nouveau mot de passe doit contenir au moins 4 caractères.";
    return;
  }
  
  if (newPwd !== confirmPwd) {
    errorEl.style.display = 'block';
    errorEl.innerText = "Les mots de passe ne correspondent pas.";
    return;
  }
  
  const userIdx = utilisateurs.findIndex(u => u.id === activeUserId);
  utilisateurs[userIdx].mot_de_passe = newPwd;
  DBEngine.save();
  showToast("Mot de passe changé avec succès.", "success");
  errorEl.style.display = 'none';
  document.getElementById('settings-current-pwd').value = '';
  document.getElementById('settings-pwd').value = '';
  document.getElementById('settings-pwd-confirm').value = '';
}

// --- Gestion des utilisateurs ---
function renderUsersList() {
  const container = document.getElementById('users-list-container');
  const utilisateurs = DBEngine.getCollection('utilisateurs');
  const membres = DBEngine.getCollection('membres');
  const activeUserId = sessionStorage.getItem('ekklesia_auth');
  
  container.innerHTML = '';
  
  utilisateurs.forEach(u => {
    const mbr = membres.find(m => m.id === u.membre_id);
    const initials = mbr ? (mbr.prenoms[0] + mbr.nom[0]).toUpperCase() : '??';
    const fullName = mbr ? `${mbr.nom.toUpperCase()} ${mbr.prenoms}` : 'Inconnu';
    const isSelf = u.id === activeUserId;
    
    const card = document.createElement('div');
    card.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-color);';
    card.innerHTML = `
      <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-gradient); display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 14px; flex-shrink: 0;">${initials}</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px;">${fullName} ${isSelf ? '<span style="font-size: 11px; color: var(--primary-color);">(vous)</span>' : ''}</div>
        <div style="font-size: 12px; color: var(--text-muted);">@${u.identifiant} · ${u.role}</div>
      </div>
      ${!isSelf ? `<button onclick="deleteUser('${u.id}')" class="action-btn secondary" style="font-size: 11px; padding: 4px 8px; color: var(--danger-color);" title="Supprimer ce compte"><i class="fa-solid fa-trash"></i></button>` : ''}
    `;
    container.appendChild(card);
  });
}

function openNewUserForm() {
  const select = document.getElementById('new-user-member');
  const membres = DBEngine.getCollection('membres');
  const utilisateurs = DBEngine.getCollection('utilisateurs');
  const linkedMemberIds = utilisateurs.map(u => u.membre_id);
  
  select.innerHTML = '<option value="">-- Sélectionner un membre --</option>';
  membres.filter(m => !linkedMemberIds.includes(m.id)).forEach(m => {
    select.innerHTML += `<option value="${m.id}">${m.nom.toUpperCase()} ${m.prenoms}</option>`;
  });
  
  document.getElementById('new-user-id').value = '';
  document.getElementById('new-user-pwd').value = '';
  document.getElementById('new-user-error').style.display = 'none';
  document.getElementById('new-user-form-area').style.display = 'block';
}

function createNewUser(event) {
  event.preventDefault();
  const membreId = document.getElementById('new-user-member').value;
  const identifiant = document.getElementById('new-user-id').value.trim();
  const mdp = document.getElementById('new-user-pwd').value;
  const role = document.getElementById('new-user-role').value;
  const errorEl = document.getElementById('new-user-error');
  
  if (!membreId || !identifiant || !mdp) {
    errorEl.style.display = 'block';
    errorEl.innerText = "Tous les champs sont obligatoires.";
    return;
  }
  
  const utilisateurs = DBEngine.getCollection('utilisateurs');
  if (utilisateurs.find(u => u.identifiant === identifiant)) {
    errorEl.style.display = 'block';
    errorEl.innerText = "Cet identifiant existe déjà.";
    return;
  }
  
  const newUser = {
    id: 'usr_' + Date.now(),
    membre_id: membreId,
    identifiant: identifiant,
    mot_de_passe: mdp,
    role: role
  };
  
  DBEngine.insert('utilisateurs', newUser);
  showToast("Nouveau compte créé avec succès.", "success");
  document.getElementById('new-user-form-area').style.display = 'none';
  renderUsersList();
}

function deleteUser(userId) {
  const activeUserId = sessionStorage.getItem('ekklesia_auth');
  if (userId === activeUserId) return;
  
  if (confirm("Êtes-vous sûr de vouloir supprimer ce compte utilisateur ?")) {
    DBEngine.delete('utilisateurs', userId);
    showToast("Compte supprimé.", "success");
    renderUsersList();
  }
}

// --- Préférences ---
function savePreferences() {
  if (!db.preferences) db.preferences = {};
  db.preferences.church_name = document.getElementById('settings-church-name').value.trim();
  db.preferences.currency = document.getElementById('settings-currency').value;
  db.preferences.csv_delimiter = document.getElementById('settings-csv-delimiter').value;
  DBEngine.save();
  showToast("Préférences enregistrées.", "success");
}

function toggleFirebaseConfigVisibility() {
  const enabled = document.getElementById('settings-firebase-sync-enabled').checked;
  document.getElementById('firebase-config-area').style.display = enabled ? 'flex' : 'none';
}

function saveFirebaseConfiguration() {
  const enabled = document.getElementById('settings-firebase-sync-enabled').checked;
  const configString = document.getElementById('settings-firebase-config').value.trim();
  
  if (enabled && !configString) {
    showToast("Veuillez renseigner la configuration Firebase.", "error");
    return;
  }
  
  if (enabled) {
    try {
      JSON.parse(configString);
    } catch (e) {
      showToast("La configuration Firebase n'est pas un JSON valide.", "error");
      return;
    }
  }
  
  if (!db.firebase_sync) db.firebase_sync = {};
  db.firebase_sync.enabled = enabled;
  db.firebase_sync.config_string = configString;
  
  DBEngine.save();
  showToast("Configuration Firebase enregistrée. Rechargement de l'application...", "success");
  
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

function resetAllData() {
  if (confirm("⚠️ ATTENTION : Cette action supprimera TOUTES les données de l'application (membres, cultes, finances, etc.) et réinitialisera l'application à son état initial.\n\nÊtes-vous absolument sûr ?")) {
    if (confirm("Dernière confirmation : Tapez OK pour confirmer la réinitialisation complète.")) {
      localStorage.removeItem('EkklesiaManagerDB');
      sessionStorage.removeItem('ekklesia_auth');
      window.location.reload();
    }
  }
}

// --- Import / Export de la Base de Données ---
function exportDatabaseBackup() {
  const dataStr = localStorage.getItem('EkklesiaManagerDB');
  if (!dataStr) {
    showToast("Aucune donnée à sauvegarder.", "error");
    return;
  }
  
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `sauvegarde_ekklesia_apf_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast("Base de données exportée avec succès !");
}

function importDatabaseBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Simple validation structurelle
      if (!data.membres || !data.utilisateurs || !data.cellules) {
        showToast("Le fichier de sauvegarde semble invalide.", "error");
        return;
      }
      
      if (confirm("Êtes-vous sûr de vouloir restaurer cette base de données ? Toutes les données actuelles de cet appareil seront écrasées par celles du fichier de sauvegarde.")) {
        localStorage.setItem('EkklesiaManagerDB', JSON.stringify(data));
        showToast("Base de données restaurée ! Rechargement...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      showToast("Erreur lors de la lecture du fichier : " + err.message, "error");
    }
  };
  reader.readAsText(file);
}

// --- ATTENDANCE SYSTEM CONTROLLER ---
let activeAttendanceCultId = null;

function openAttendanceModal(cultId) {
  activeAttendanceCultId = cultId;
  const cult = DBEngine.getCollection('cults').find(x => x.id === cultId);
  const allMembres = DBEngine.getCollection('membres').filter(m => m.statut === 'Actif');
  
  if (!cult) {
    showToast("Impossible de trouver les informations de ce culte.", "danger");
    return;
  }
  
  // Set Subtitle: Service Type + Date
  const dateStr = new Date(cult.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('attendance-modal-subtitle').innerText = `${cult.type} · ${dateStr} ${cult.theme ? '· ' + cult.theme : ''}`;
  
  // Clear search and filter inputs
  document.getElementById('attendance-search').value = "";
  
  // Populate department filter select
  const deptSelect = document.getElementById('attendance-dept-filter');
  const depts = new Set();
  allMembres.forEach(m => {
    if (m.appartenance && m.appartenance.departements) {
      m.appartenance.departements.forEach(d => depts.add(d));
    }
  });
  deptSelect.innerHTML = '<option value="">Tous les dép.</option>';
  Array.from(depts).sort().forEach(d => {
    deptSelect.innerHTML += `<option value="${d}">${d}</option>`;
  });
  deptSelect.value = "";
  
  // Reset visitors section
  document.getElementById('attendance-visitors-count').value = cult.visiteurs_count || 0;
  document.getElementById('attendance-visitors-notes').value = cult.visiteurs_notes || "";
  
  // Render members list
  renderAttendanceMembersList(allMembres, cult.presences || []);
  
  // Open the modal
  openModal('modal-attendance');
}

function renderAttendanceMembersList(members, presences) {
  const container = document.getElementById('attendance-members-list');
  container.innerHTML = "";
  
  if (members.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">Aucun membre actif trouvé.</div>`;
    updateAttendanceStats();
    return;
  }
  
  members.forEach(m => {
    const isPresent = presences.includes(m.id);
    const initials = (m.prenoms[0] + m.nom[0]).toUpperCase();
    const dept = (m.appartenance && m.appartenance.departements && m.appartenance.departements[0]) || "Membre";
    
    const div = document.createElement('div');
    div.className = `attendance-item ${isPresent ? 'active' : ''}`;
    div.dataset.id = m.id;
    div.dataset.search = `${m.nom.toLowerCase()} ${m.prenoms.toLowerCase()}`;
    div.dataset.dept = (m.appartenance && m.appartenance.departements) ? m.appartenance.departements.join(',') : '';
    
    // Toggle logic on click of card
    div.onclick = () => {
      const active = div.classList.toggle('active');
      const badge = div.querySelector('.attendance-status-badge');
      if (active) {
        badge.innerText = "PRÉSENT";
        div.querySelector('.attendance-checkbox').checked = true;
      } else {
        badge.innerText = "ABSENT";
        div.querySelector('.attendance-checkbox').checked = false;
      }
      updateAttendanceStats();
    };
    
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <input type="checkbox" class="attendance-checkbox" style="display:none;" ${isPresent ? 'checked' : ''}>
        <div class="attendance-avatar">${initials}</div>
        <div>
          <div style="font-weight:600; font-size:14px; color:var(--text-main);">${m.nom.toUpperCase()} ${m.prenoms}</div>
          <div style="font-size:11px; color:var(--text-muted);">${dept}</div>
        </div>
      </div>
      <div class="attendance-status-badge">${isPresent ? 'PRÉSENT' : 'ABSENT'}</div>
    `;
    
    container.appendChild(div);
  });
  
  updateAttendanceStats();
}

function filterAttendanceList() {
  const query = document.getElementById('attendance-search').value.toLowerCase().trim();
  const deptFilter = document.getElementById('attendance-dept-filter').value;
  const items = document.querySelectorAll('#attendance-members-list .attendance-item');
  
  let visibleCount = 0;
  let totalCount = items.length;
  
  items.forEach(item => {
    const searchString = item.dataset.search;
    const depts = item.dataset.dept.split(',');
    
    const matchesSearch = !query || searchString.includes(query);
    const matchesDept = !deptFilter || depts.includes(deptFilter);
    
    if (matchesSearch && matchesDept) {
      item.style.display = 'flex';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });
  
  document.getElementById('attendance-filtered-count').innerText = `Affichage de ${visibleCount} / ${totalCount} membres`;
}

function bulkSetAttendance(isPresent) {
  const items = document.querySelectorAll('#attendance-members-list .attendance-item');
  items.forEach(item => {
    // Only apply to visible items in case user has filtered
    if (item.style.display !== 'none') {
      const checkbox = item.querySelector('.attendance-checkbox');
      const badge = item.querySelector('.attendance-status-badge');
      checkbox.checked = isPresent;
      if (isPresent) {
        item.classList.add('active');
        badge.innerText = "PRÉSENT";
      } else {
        item.classList.remove('active');
        badge.innerText = "ABSENT";
      }
    }
  });
  updateAttendanceStats();
}

function updateAttendanceStats() {
  const totalChecked = document.querySelectorAll('#attendance-members-list .attendance-checkbox:checked').length;
  const totalMembers = document.querySelectorAll('#attendance-members-list .attendance-checkbox').length;
  
  const presentCount = totalChecked;
  const absentCount = totalMembers - totalChecked;
  const rate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;
  
  document.getElementById('attendance-stat-present').innerText = presentCount;
  document.getElementById('attendance-stat-absent').innerText = absentCount;
  document.getElementById('attendance-stat-rate').innerText = `${rate}%`;
  
  // update displaying count
  const items = document.querySelectorAll('#attendance-members-list .attendance-item');
  let visibleCount = 0;
  items.forEach(item => {
    if (item.style.display !== 'none') visibleCount++;
  });
  document.getElementById('attendance-filtered-count').innerText = `Affichage de ${visibleCount} / ${totalMembers} membres`;
}

function saveAttendance() {
  if (!activeAttendanceCultId) return;
  
  const checkedBoxes = document.querySelectorAll('#attendance-members-list .attendance-checkbox:checked');
  const presencesIds = Array.from(checkedBoxes).map(chk => chk.closest('.attendance-item').dataset.id);
  
  const visitorsCount = parseInt(document.getElementById('attendance-visitors-count').value) || 0;
  const visitorsNotes = document.getElementById('attendance-visitors-notes').value.trim();
  
  // Find the current cult
  const cult = DBEngine.getCollection('cults').find(x => x.id === activeAttendanceCultId);
  if (!cult) return;
  
  // Automatically change status from "Planifié" or "Confirmé" to "Terminé"
  const newStatus = (cult.statut === 'Planifié' || cult.statut === 'Confirmé') ? 'Terminé' : cult.statut;
  
  DBEngine.update('cults', activeAttendanceCultId, {
    presences: presencesIds,
    visiteurs_count: visitorsCount,
    visiteurs_notes: visitorsNotes,
    statut: newStatus
  });
  
  showToast("Feuille de présence enregistrée avec succès !", "success");
  closeModal('modal-attendance');
  
  // Reload the view to update active rate, alerts, dashboards
  initCultsView();
  
  // Refresh dashboard if active
  if (typeof initDashboardView === 'function') {
    initDashboardView();
  }
}

// --- INITIALISATION APPLICATIVE GLOBALE ---
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialiser le moteur de persistance
  await DBEngine.init();
  
  // 2. Vérification de la session via Firebase Auth
  if (firebase.auth) {
    firebase.auth().onAuthStateChanged(firebaseUser => {
      const appLayout = document.getElementById('app-layout');
      const loginScreen = document.getElementById('login-screen');

      if (firebaseUser) {
        // Trouver l'utilisateur interne correspondant à cet email
        const identifiant = firebaseUser.email.split('@')[0];
        const user = DBEngine.getCollection('utilisateurs').find(u => u.identifiant.toLowerCase() === identifiant.toLowerCase());
        
        if (user) {
          sessionStorage.setItem('ekklesia_auth', user.id);
          
          if (loginScreen) loginScreen.style.display = 'none';
          if (appLayout) appLayout.style.display = 'flex';
          
          // Mettre à jour l'en-tête de profil utilisateur actuel
          const currentMember = DBEngine.getCollection('membres').find(m => m.id === user.membre_id);
          if (currentMember) {
            document.getElementById('current-user-name').innerText = `${currentMember.nom.toUpperCase()} ${currentMember.prenoms[0]}.`;
            const roleEl = document.getElementById('current-user-role');
            if (roleEl) roleEl.innerText = user.role;
            document.getElementById('current-user-avatar').innerText = (currentMember.prenoms[0] + currentMember.nom[0]).toUpperCase();
          }
          
          // Masquer la section Contributions pour les utilisateurs ayant le rôle "Responsable"
          if (user.role === 'Responsable') {
            const navFinances = document.getElementById('nav-item-finances');
            const quickFinance = document.getElementById('quick-new-finance');
            const tabContributions = document.getElementById('profile-tab-contributions');
            if (navFinances) navFinances.style.display = 'none';
            if (quickFinance) quickFinance.style.display = 'none';
            if (tabContributions) tabContributions.style.display = 'none';
          }
          
          // 3. Charger le tableau de bord
          switchView(activeView || 'dashboard');
        } else {
          // Utilisateur non trouvé dans la base locale
          firebase.auth().signOut();
        }
      } else {
        // Non connecté
        sessionStorage.removeItem('ekklesia_auth');
        if (appLayout) appLayout.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'flex';
      }
    });
  } else {
    // Fallback si Firebase Auth n'est pas chargé (mode hors ligne / sans sync)
    console.warn("Firebase Auth non disponible, fonctionnement hors-ligne basique non pris en charge pour la connexion.");
  }
});
