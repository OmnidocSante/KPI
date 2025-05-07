const jwt = require('jsonwebtoken');

// Utiliser la même clé secrète que dans le contrôleur
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Erreur de vérification du token:', err);
      return res.status(401).json({ message: 'Token invalide' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken };