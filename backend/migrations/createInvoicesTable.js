const db = require('../config/db');

async function createInvoicesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS Invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      number VARCHAR(100) NOT NULL,
      supplier VARCHAR(255) NULL,
      amount DECIMAL(12,2) NOT NULL,
      invoiceDate DATE NOT NULL,
      terms INT NOT NULL,
      dueDate DATE NOT NULL,
      isPaid TINYINT(1) NOT NULL DEFAULT 0,
      paidAt DATETIME NULL,
      destroyTime DATETIME NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Table Invoices vérifiée/créée');
}

if (require.main === module) {
  createInvoicesTable()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = createInvoicesTable;


