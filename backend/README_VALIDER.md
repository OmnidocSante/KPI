# Champ VALIDER dans la table Globales

## Description

Le champ `valider` permet de distinguer les globales selon leur origine :

- **valider = 0** : Globales importées via `importGlobalesFromJson` (non validées, nécessitent une vérification)
- **valider = 1** : Globales créées manuellement via le formulaire (validées automatiquement)

## Migration

Pour ajouter le champ `valider` à votre base de données existante, exécutez :

```bash
cd backend
node migrations/addValiderToGlobales.js
```

Cette migration :
1. Ajoute la colonne `valider` de type TINYINT(1) avec une valeur par défaut de 1
2. Met à jour tous les enregistrements existants avec `valider = 1` (considérés comme validés)

## Impact sur les fonctions

### createGlobale
Les globales créées via le formulaire auront automatiquement `valider = 1` (validées)

### importGlobalesFromJson
Les globales importées depuis un fichier JSON auront automatiquement `valider = 0` (non validées)

### updateGlobale
La mise à jour d'une globale ne modifie pas le statut de validation

## Utilisation future

Ce champ peut être utilisé pour :
- Filtrer les globales validées/non validées dans le dashboard
- Créer un workflow de validation des imports
- Générer des rapports sur les données importées vs manuelles
- Ajouter un bouton de validation manuelle pour les imports

## Structure de la colonne

```sql
valider TINYINT(1) DEFAULT 1 COMMENT 'Validation status: 0 = imported (not validated), 1 = manually created (validated)'
```

