const db = require('./config/db');

async function updateChargesTable() {
  try {
    await db.query(`
      ALTER TABLE Charges
      ADD COLUMN IF NOT EXISTS variableDate DATE NULL AFTER amount;
    `);
    console.log('Colonne variableDate ajoutée si nécessaire.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur mise à jour Charges:', err);
    process.exit(1);
  }
}

updateChargesTable();


