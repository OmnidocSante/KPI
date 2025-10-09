const db = require('./config/db');

async function createFournisseursTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS Fournisseurs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      tel VARCHAR(100) NULL,
      email VARCHAR(255) NULL,
      address VARCHAR(500) NULL,
      villeId INT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      destroyTime DATETIME NULL,
      CONSTRAINT fk_fournisseurs_ville FOREIGN KEY (villeId) REFERENCES Villes(id)
        ON UPDATE CASCADE ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Table Fournisseurs créée/mise à jour');
  process.exit(0);
}

createFournisseursTable().catch((err) => {
  console.error('Erreur création table Fournisseurs:', err);
  process.exit(1);
});
