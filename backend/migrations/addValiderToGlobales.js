const db = require('../config/db');

async function addValiderColumn() {
  try {
    // Vérifier si la colonne existe déjà
    const [columns] = await db.query(
      `SHOW COLUMNS FROM Globales LIKE 'valider'`
    );

    if (columns.length === 0) {
      // Ajouter la colonne valider si elle n'existe pas
      await db.query(
        `ALTER TABLE Globales 
         ADD COLUMN valider TINYINT(1) DEFAULT 1 COMMENT 'Validation status: 0 = imported (not validated), 1 = manually created (validated)'`
      );
      console.log('✅ Colonne valider ajoutée avec succès à la table Globales');
      console.log('   - valider = 0 : Globales importées (non validées)');
      console.log('   - valider = 1 : Globales créées manuellement (validées)');
    } else {
      console.log('ℹ️  La colonne valider existe déjà dans la table Globales');
    }

    // Mettre à jour les enregistrements existants pour qu'ils soient tous validés (valider = 1)
    const [result] = await db.query(
      `UPDATE Globales SET valider = 1 WHERE valider IS NULL`
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ ${result.affectedRows} enregistrement(s) existant(s) marqué(s) comme validé(s)`);
    }

    console.log('✅ Migration terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

addValiderColumn();

