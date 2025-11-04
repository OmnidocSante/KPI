# Module Client KPI

## Description

Le module Client KPI permet de gérer et d'analyser les informations des clients dans la section KPI de la plateforme. Il offre une vision structurée et analytique du portefeuille client avec des statistiques, graphiques et outils d'export.

## Fonctionnalités

### ✅ Gestion des clients
- **Ajout** : Création de nouveaux clients avec tous les champs requis
- **Modification** : Mise à jour des informations client
- **Suppression** : Suppression douce (soft delete) des clients

### 📊 Indicateurs KPI
- **Nombre total de clients** : Affichage du total
- **Répartition par type de structure** : Graphique en secteurs
- **Répartition par secteur d'activité** : Graphique en barres
- **Répartition par type de contrat** : Graphique en barres
- **Évolution du portefeuille client** : Graphique linéaire par mois/trimestre/année

### 🔍 Recherche et filtres
- Recherche par nom, email, secteur d'activité
- Filtre par type de structure
- Filtre par secteur d'activité
- Filtre par type de contrat
- Filtre par prestation incluse

### 📈 Export des données
- **Export Excel** : Export au format .xlsx avec toutes les données filtrées
- **Export PDF** : Export au format PDF via la fonction d'impression du navigateur

## Champs du module

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Nom / Dénomination | Texte | Oui | Nom de l'entreprise, école ou institution |
| Type de structure | Liste déroulante | Oui | Entreprise, Assurance, École, Clinique, Institution |
| Secteur d'activité | Texte | Oui | Domaine d'activité (Santé, Éducation, BTP, etc.) |
| Adresse | Texte | Oui | Adresse complète du siège |
| Téléphone | Numérique | Oui | Numéro de contact principal |
| Email | Texte | Oui | Adresse email de contact |
| Date de création du compte | Automatique | Oui | Date d'ajout dans la plateforme |
| Type de contrat | Liste déroulante | Oui | B2B, B2C, B2B2C |
| Nombre de collaborateurs | Numérique | Oui | Nombre total de collaborateurs |
| Prestations incluses | Cases à cocher multiples | Oui | Assistance médicale, Médecine du travail, Téléconsultation, Caution d'hospitalisation, Actes infirmiers |

## Installation

### Backend

1. Exécuter la migration pour ajouter les nouveaux champs à la table Clients :
```bash
cd backend
node migrations/addClientKPIFields.js
```

2. Les routes sont déjà configurées dans `backend/routes/clientRoutes.js`

### Frontend

1. La page est accessible via `/clients-kpi` dans l'application
2. Le lien est ajouté dans la Sidebar sous "Clients KPI"

## Utilisation

### Accès au module
1. Se connecter à l'application
2. Cliquer sur "Clients KPI" dans la sidebar
3. Le module affiche automatiquement les statistiques KPI

### Ajouter un client
1. Cliquer sur "Ajouter un client"
2. Remplir tous les champs obligatoires (marqués avec *)
3. Sélectionner les prestations incluses (au moins une)
4. Cliquer sur "Ajouter"

### Modifier un client
1. Cliquer sur "✏️ Modifier" dans la ligne du client
2. Modifier les informations souhaitées
3. Cliquer sur "Enregistrer"

### Filtrer et rechercher
1. Utiliser le champ de recherche pour rechercher par nom, email ou secteur
2. Utiliser les filtres déroulants pour filtrer par type, secteur, contrat ou prestation
3. Les résultats se mettent à jour automatiquement

### Exporter les données
1. Appliquer les filtres souhaités (optionnel)
2. Cliquer sur "📥 Export Excel" pour exporter en Excel
3. Cliquer sur "📄 Export PDF" pour exporter en PDF (ouvre la fenêtre d'impression)

## Structure de la base de données

Les nouveaux champs ajoutés à la table `Clients` :
- `typeStructure` : ENUM('Entreprise', 'Assurance', 'École', 'Clinique', 'Institution')
- `secteurActivite` : VARCHAR(255)
- `adresse` : TEXT
- `telephone` : VARCHAR(50)
- `typeContrat` : ENUM('B2B', 'B2C', 'B2B2C')
- `nombreCollaborateurs` : INT
- `prestationsIncluses` : JSON (tableau de chaînes)

## API Endpoints

### GET /api/clients/kpis
Récupère toutes les statistiques KPI des clients.

**Réponse :**
```json
{
  "totalClients": 50,
  "byTypeStructure": [
    { "typeStructure": "Entreprise", "count": 25 },
    { "typeStructure": "Assurance", "count": 15 }
  ],
  "bySecteur": [
    { "secteurActivite": "Santé", "count": 20 }
  ],
  "byContrat": [
    { "typeContrat": "B2B", "count": 30 }
  ],
  "evolutionByMonth": [
    { "month": "2024-01", "count": 5 }
  ],
  "evolutionByQuarter": [...],
  "evolutionByYear": [...]
}
```

### GET /api/clients/search
Recherche de clients avec filtres.

**Paramètres de requête :**
- `query` : Recherche textuelle
- `typeStructure` : Filtrer par type de structure
- `secteurActivite` : Filtrer par secteur
- `typeContrat` : Filtrer par type de contrat
- `prestation` : Filtrer par prestation

## Notes techniques

- Les prestations incluses sont stockées en JSON dans la base de données
- Le parsing JSON est géré automatiquement par le backend
- Les statistiques KPI sont calculées en temps réel
- Les exports Excel utilisent la bibliothèque `xlsx`
- Les exports PDF utilisent la fonction d'impression du navigateur

## Prochaines améliorations possibles

- Intégration avec le module Prospect pour conversion en Client
- Export PDF avec bibliothèque jsPDF (nécessite installation)
- Filtres avancés supplémentaires
- Graphiques interactifs avec drill-down
- Historique des modifications

