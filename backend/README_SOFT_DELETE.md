# 🗑️ **Système de Soft Delete - Globales**

## 📋 **Vue d'ensemble**

Le système de soft delete permet de "supprimer" des enregistrements sans les effacer physiquement de la base de données. Les enregistrements sont marqués comme supprimés en utilisant le champ `destroyTime`.

## 🔧 **Fonctionnement**

### **1. Suppression (Soft Delete)**
- **Route** : `DELETE /api/globales/:id`
- **Action** : Met à jour le champ `destroyTime` avec la date/heure actuelle
- **Résultat** : L'enregistrement n'apparaît plus dans les requêtes normales

### **2. Restauration**
- **Route** : `POST /api/globales/:id/restore`
- **Action** : Remet le champ `destroyTime` à `NULL`
- **Résultat** : L'enregistrement redevient visible

### **3. Suppression définitive (Hard Delete)**
- **Route** : `DELETE /api/globales/:id/hard`
- **Action** : Supprime physiquement l'enregistrement de la base
- **Résultat** : L'enregistrement est définitivement perdu

### **4. Liste des supprimés**
- **Route** : `GET /api/globales/deleted/list`
- **Action** : Récupère tous les enregistrements avec `destroyTime IS NOT NULL`
- **Résultat** : Liste des enregistrements "supprimés"

## 🗄️ **Structure de la base de données**

```sql
CREATE TABLE Globales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  -- ... autres champs ...
  destroyTime DATETIME NULL,  -- NULL = actif, DATE = supprimé
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## 📡 **API Endpoints**

### **Suppression (Soft Delete)**
```http
DELETE /api/globales/:id
Authorization: Bearer <token>

Response 200:
{
  "message": "Globale supprimée avec succès (soft delete)"
}
```

### **Restauration**
```http
POST /api/globales/:id/restore
Authorization: Bearer <token>

Response 200:
{
  "message": "Globale restaurée avec succès"
}
```

### **Liste des supprimés**
```http
GET /api/globales/deleted/list
Authorization: Bearer <token>

Response 200:
[
  {
    "id": 1,
    "fullName": "John Doe",
    "destroyTime": "2024-01-15T10:30:00.000Z",
    // ... autres champs
  }
]
```

### **Suppression définitive**
```http
DELETE /api/globales/:id/hard
Authorization: Bearer <token>

Response 200:
{
  "message": "Globale supprimée définitivement avec succès"
}
```

## 🔍 **Requêtes SQL**

### **Enregistrements actifs**
```sql
SELECT * FROM Globales WHERE destroyTime IS NULL;
```

### **Enregistrements supprimés**
```sql
SELECT * FROM Globales WHERE destroyTime IS NOT NULL;
```

### **Suppression (Soft Delete)**
```sql
UPDATE Globales 
SET destroyTime = NOW() 
WHERE id = ? AND destroyTime IS NULL;
```

### **Restauration**
```sql
UPDATE Globales 
SET destroyTime = NULL 
WHERE id = ? AND destroyTime IS NOT NULL;
```

## 🎯 **Avantages du Soft Delete**

### **1. Sécurité des données**
- ✅ **Récupération possible** : Les données peuvent être restaurées
- ✅ **Audit trail** : Historique des suppressions conservé
- ✅ **Conformité** : Respect des réglementations de rétention

### **2. Gestion des erreurs**
- ✅ **Annulation** : Possibilité d'annuler une suppression
- ✅ **Restauration** : Récupération des données supprimées par erreur
- ✅ **Validation** : Vérification avant suppression définitive

### **3. Maintenance**
- ✅ **Sauvegarde** : Données toujours présentes en base
- ✅ **Migration** : Facilité de migration des données
- ✅ **Debugging** : Accès aux données pour le diagnostic

## ⚠️ **Considérations**

### **1. Performance**
- **Requêtes** : Toujours filtrer par `destroyTime IS NULL`
- **Index** : Ajouter un index sur `destroyTime` si nécessaire
- **Archivage** : Considérer l'archivage des anciens supprimés

### **2. Stockage**
- **Espace** : Les données supprimées occupent toujours de l'espace
- **Nettoyage** : Planifier un nettoyage périodique des anciens supprimés
- **Limitation** : Définir une politique de rétention

### **3. Sécurité**
- **Accès** : Restreindre l'accès aux routes de restauration
- **Audit** : Logger toutes les opérations de soft delete
- **Permissions** : Différencier soft delete et hard delete

## 🚀 **Utilisation recommandée**

### **1. Suppression normale**
```javascript
// Utiliser le soft delete par défaut
await fetch(`/api/globales/${id}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### **2. Restauration**
```javascript
// Restaurer un enregistrement supprimé
await fetch(`/api/globales/${id}/restore`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### **3. Suppression définitive**
```javascript
// Supprimer définitivement (administrateurs uniquement)
await fetch(`/api/globales/${id}/hard`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 📊 **Monitoring et Maintenance**

### **1. Statistiques**
- **Nombre de supprimés** : Surveiller la croissance
- **Âge des supprimés** : Identifier les anciens enregistrements
- **Taux de restauration** : Mesurer l'efficacité

### **2. Nettoyage**
- **Politique de rétention** : Définir la durée de conservation
- **Archivage** : Déplacer les anciens supprimés
- **Purge** : Suppression définitive des très anciens

### **3. Alertes**
- **Espace disque** : Surveiller l'utilisation
- **Performance** : Détecter les ralentissements
- **Erreurs** : Logger les échecs de restauration

---

## 🎉 **Résultat**

Votre application dispose maintenant d'un système de soft delete robuste qui :
- ✅ **Protège vos données** contre les suppressions accidentelles
- ✅ **Permet la restauration** des enregistrements supprimés
- ✅ **Offre un audit trail** complet des opérations
- ✅ **Maintient la performance** avec des requêtes optimisées
- ✅ **Respecte les bonnes pratiques** de gestion des données
