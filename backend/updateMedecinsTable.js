const db = require('./config/db');

const updateMedecinsTable = async () => {
  try {
    console.log('🔄 Mise à jour de la table Medciens...');
    
    // Vérifier d'abord la structure actuelle de la table
    const [columns] = await db.query('DESCRIBE Medciens');
    const existingColumns = columns.map(col => col.Field);
    console.log('📋 Colonnes existantes:', existingColumns);
    
    // Définir les nouvelles colonnes à ajouter
    const newColumns = [
      { name: 'phone', type: 'VARCHAR(50) NULL' },
      { name: 'contact', type: 'VARCHAR(255) NULL' },
      { name: 'ville', type: 'VARCHAR(255) NULL' },
      { name: 'email', type: 'VARCHAR(255) NULL' }
    ];

    // Ajouter seulement les colonnes qui n'existent pas
    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          await db.query(`ALTER TABLE Medciens ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Colonne '${column.name}' ajoutée avec succès`);
        } catch (error) {
          console.error(`❌ Erreur lors de l'ajout de la colonne '${column.name}':`, error.message);
        }
      } else {
        console.log(`ℹ️ Colonne '${column.name}' existe déjà, ignorée`);
      }
    }

    console.log('🎉 Mise à jour de la table Medciens terminée !');
    
    // Afficher la structure finale
    const [finalColumns] = await db.query('DESCRIBE Medciens');
    console.log('📋 Structure finale de la table:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
};

updateMedecinsTable();
