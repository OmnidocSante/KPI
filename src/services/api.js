import axios from 'axios';

const API_URL = 'https://kpi.omnidoc.ma/api'

// Configuration d'axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Vérifier si le token existe avant de le supprimer
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Ne rediriger que si nous ne sommes pas déjà sur la page de login
        if (!window.location.hash.includes('/login')) {
          window.location.hash = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
// Fonction utilitaire pour récupérer le nom d'un élément
const getNom = (array, id, field) => {
  const item = array.find(item => String(item.id) === String(id));
  return item ? item[field] : id;
};

// Fonctions pour l'API Ambulances
export const fetchAmbulances = () => api.get('/ambulances');
export const fetchAmbulanceById = (id) => api.get(`/ambulances/${id}`);
export const createAmbulance = (data) => api.post('/ambulances', data);
export const updateAmbulance = (id, data) => api.put(`/ambulances/${id}`, data);
export const deleteAmbulance = (id) => api.delete(`/ambulances/${id}`);

// Fonctions pour l'API Clients
export const fetchClients = () => api.get('/clients');
export const fetchClientById = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);
export const searchClients = (query) => api.get(`/clients/search?query=${encodeURIComponent(query)}`);

// Fonctions pour l'API Contacts des clients
export const fetchClientContacts = (clientId) => api.get(`/clients/${clientId}/contacts`);
export const addClientContact = (clientId, data) => api.post(`/clients/${clientId}/contacts`, data);
export const updateClientContact = (contactId, data) => api.put(`/clients/contacts/${contactId}`, data);
export const deleteClientContact = (contactId) => api.delete(`/clients/contacts/${contactId}`);

// Fonctions pour l'API Villes
export const fetchVilles = () => api.get('/villes');

// Fonctions pour l'API Médecins
export const fetchMedecins = () => api.get('/medecins');
export const fetchMedecinById = (id) => api.get(`/medecins/${id}`);
export const createMedecin = (data) => api.post('/medecins', data);
export const updateMedecin = (id, data) => api.put(`/medecins/${id}`, data);
export const deleteMedecin = (id) => api.delete(`/medecins/${id}`);

// Fonctions pour l'API Infirmiers
export const fetchInfirmiers = () => api.get('/infirmiers');
export const fetchInfirmierById = (id) => api.get(`/infirmiers/${id}`);
export const createInfirmier = (data) => api.post('/infirmiers', data);
export const updateInfirmier = (id, data) => api.put(`/infirmiers/${id}`, data);
export const deleteInfirmier = (id) => api.delete(`/infirmiers/${id}`);

// Fonctions pour l'API Produits
export const fetchProduits = () => api.get('/produits');
export const fetchProduitById = (id) => api.get(`/produits/${id}`);
export const createProduit = (data) => api.post('/produits', data);
export const updateProduit = (id, data) => api.put(`/produits/${id}`, data);
export const deleteProduit = (id) => api.delete(`/produits/${id}`);

// Fonctions pour l'API Charges
export const fetchChargeCategories = () => api.get('/charges/categories');
export const createChargeCategory = (data) => api.post('/charges/categories', data);
export const updateChargeCategory = (id, data) => api.put(`/charges/categories/${id}`, data);
export const deleteChargeCategory = (id) => api.delete(`/charges/categories/${id}`);

export const fetchCharges = () => api.get('/charges');
export const fetchChargeById = (id) => api.get(`/charges/${id}`);
export const createCharge = (data) => api.post('/charges', data);
export const updateCharge = (id, data) => api.put(`/charges/${id}`, data);
export const deleteCharge = (id) => api.delete(`/charges/${id}`);
export const fetchChargeInstallments = (chargeId) => api.get(`/charges/${chargeId}/installments`);
export const payChargeInstallment = (installmentId) => api.patch(`/charges/installments/${installmentId}/pay`);

// Rapports
export const fetchProfitReport = ({ start, end, paidOnly } = {}) => {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  if (paidOnly) params.append('paidOnly', '1');
  return api.get(`/reports/profit?${params.toString()}`);
};



export { getNom };

export default api; 