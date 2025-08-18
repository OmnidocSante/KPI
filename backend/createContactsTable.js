const db = require('./config/db');

async function createContactsTable() {
  try {
    // Créer la table des contacts des personnes en charge
    await db.query(`
      CREATE TABLE IF NOT EXISTS ClientContacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clientId INT NOT NULL,
        contactName VARCHAR(255) NOT NULL,
        contactEmail VARCHAR(255),
        contactPhone VARCHAR(50),
        contactFunction VARCHAR(255) NOT NULL,
        isPrimary BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        destroyTime TIMESTAMP NULL,
        FOREIGN KEY (clientId) REFERENCES Clients(id) ON DELETE CASCADE
      )
    `);

    // Ajouter des colonnes pour les contacts principaux dans la table Clients
    // MySQL ne supporte pas ADD COLUMN IF NOT EXISTS, on utilise une approche différente
    try {
      await db.query(`
        ALTER TABLE Clients 
        ADD COLUMN primaryContactName VARCHAR(255) NULL
      `);
      console.log('Colonne primaryContactName ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Colonne primaryContactName existe déjà');
      } else {
        throw e;
      }
    }

    try {
      await db.query(`
        ALTER TABLE Clients 
        ADD COLUMN primaryContactEmail VARCHAR(255) NULL
      `);
      console.log('Colonne primaryContactEmail ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Colonne primaryContactEmail existe déjà');
      } else {
        throw e;
      }
    }

    try {
      await db.query(`
        ALTER TABLE Clients 
        ADD COLUMN primaryContactPhone VARCHAR(50) NULL
      `);
      console.log('Colonne primaryContactPhone ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Colonne primaryContactPhone existe déjà');
      } else {
        throw e;
      }
    }

    try {
      await db.query(`
        ALTER TABLE Clients 
        ADD COLUMN primaryContactFunction VARCHAR(255) NULL
      `);
      console.log('Colonne primaryContactFunction ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Colonne primaryContactFunction existe déjà');
      } else {
        throw e;
      }
    }

    console.log('Table ClientContacts créée avec succès !');
    console.log('Colonnes de contact ajoutées à la table Clients !');
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création de la table:', error);
    process.exit(1);
  }
}

createContactsTable();
