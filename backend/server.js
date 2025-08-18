const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const https = require('https');
const fs = require('fs');


// Configuration HTTPS
const httpsOptions = {
 //cert: fs.readFileSync('/etc/letsencrypt/live/kpi.omnidoc.ma/fullchain.pem'),
 //key: fs.readFileSync('/etc/letsencrypt/live/kpi.omnidoc.ma/privkey.pem')
};


// Import des routes
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const businessUnitRoutes = require('./routes/businessUnitRoutes');
const clientRoutes = require('./routes/clientRoutes');
const medecinRoutes = require('./routes/medecinRoutes');
const infirmierRoutes = require('./routes/infirmierRoute');
const produitRoutes = require('./routes/produitRoutes');
const userRoutes = require('./routes/userRoutes');
const villeRoutes = require('./routes/villeRoutes');
const globaleRoutes = require('./routes/globaleRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware pour vérifier la connexion à la base de données
app.use(async (req, res, next) => {
  try {
    const connection = await db.getConnection();
    connection.release();
    next();
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    res.status(503).json({ message: 'Service temporairement indisponible' });
  }
});

// Routes
app.use('/ambulances', ambulanceRoutes);
app.use('/business-units', businessUnitRoutes);
app.use('/clients', clientRoutes);
app.use('/medecins', medecinRoutes);
app.use('/infirmiers', infirmierRoutes);
app.use('/produits', produitRoutes);
app.use('/users', userRoutes);
app.use('/villes', villeRoutes);
app.use('/globales', globaleRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne correctement' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue sur le serveur' });
});

const PORT = process.env.PORT || 4301;

const HTTPS_PORT = process.env.HTTPS_PORT || 4300;

// Créer le serveur HTTPS
https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
  console.log(`Serveur HTTPS démarré sur le port ${HTTPS_PORT}`);
});

// Garder le serveur HTTP pour la redirection si nécessaire

app.listen(PORT, () => {
  console.log(`Serveur HTTP démarré sur le port ${PORT}`);
}); 