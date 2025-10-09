const db = require('./config/db');

async function createChargesTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ChargeCategories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      destroyTime DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS Charges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      label VARCHAR(255) NOT NULL,
      categoryId INT NULL,
      type ENUM('recurring','variable') NOT NULL,
      priceType ENUM('monthly','yearly') NULL,
      unitPrice DECIMAL(12,2) NULL,
      periodCount INT NULL,
      startDate DATE NULL,
      endDate DATE NULL,
      amount DECIMAL(12,2) NULL,
      notes TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      destroyTime DATETIME NULL,
      CONSTRAINT fk_charges_category FOREIGN KEY (categoryId) REFERENCES ChargeCategories(id)
        ON UPDATE CASCADE ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS ChargeInstallments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chargeId INT NOT NULL,
      dueDate DATE NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      isPaid TINYINT(1) DEFAULT 0,
      paidAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      destroyTime DATETIME NULL,
      CONSTRAINT fk_installments_charge FOREIGN KEY (chargeId) REFERENCES Charges(id)
        ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    ALTER TABLE Charges ADD COLUMN valide TINYINT(1) DEFAULT 1;
  `).catch(() => {}); // ignore si déjà existant
  await db.query(`
    ALTER TABLE Charges ADD COLUMN fournisseurId INT NULL;
  `).catch(() => {});
  await db.query(`
    ALTER TABLE Charges ADD COLUMN invoicePeriod VARCHAR(7) NULL;
  `).catch(() => {});
  await db.query(`
    ALTER TABLE Charges ADD CONSTRAINT fk_charges_fournisseur FOREIGN KEY (fournisseurId) REFERENCES Fournisseurs(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  `).catch(() => {});

  console.log('Tables Charges créées/mises à jour');
  process.exit(0);
}

createChargesTables().catch((err) => {
  console.error('Erreur création tables Charges:', err);
  process.exit(1);
});


