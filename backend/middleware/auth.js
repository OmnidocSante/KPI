const auth = (req, res, next) => {
  // Ici vous pouvez ajouter votre logique d'authentification
  // Pour l'instant, c'est un middleware de base qui laisse passer toutes les requêtes
  next();
};
 
module.exports = auth; 