const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuration de la connexion MySQL Azure
const dbConfig = {
  host: 'dbomni.mysql.database.azure.com',
  user: 'omnidocdb',
  password: 'Regulation@2025',
  database: 'omnidocdb',
  port: 3306,
  dateStrings: true,
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig); 

// Test de la connexion
pool.getConnection()
  .then(connection => {
    console.log('Connexion à la base de données MySQL Azure établie avec succès');
    connection.release();
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
  });

module.exports = pool; 