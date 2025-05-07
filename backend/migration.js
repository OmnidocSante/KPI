const xlsx = require('xlsx');
// Utilise l'instance db du projet
const db = require('./config/db');

// 2. Lecture du fichier Excel
const workbook = xlsx.readFile('./test.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

function cleanRowKeys(row) {
  const cleaned = {};
  for (const key in row) {
    cleaned[key.trim()] = row[key];
  }
  return cleaned;
}

async function getIdOrCreate(table, field, value) {
  if (!value) return null;
  // Ex: SELECT id FROM villes WHERE name = ?
  const [rows] = await db.query(`SELECT id FROM ${table} WHERE ${field} = ?`, [value]);
  if (rows.length > 0) return rows[0].id;
  // Sinon, on crée
  const [result] = await db.query(`INSERT INTO ${table} (${field}) VALUES (?)`, [value]);
  return result.insertId;
}

function normalizeBusinessUnitType(val) {
  if (!val) return null;
  const v = val.trim().toLowerCase();
  if (v === 'b2c' || v === 'btoc') return 'b2c';
  if (v === 'b2b' || v === 'btob') return 'b2b';
  if (v === 'assurance' || v === 'assurances') return 'Assurance';
  return null; // ou lève une erreur si tu veux forcer la cohérence
}

function parseExcelDate(str) {
  if (!str) return null;
  // Ex: "janv.-25" ou "févr.-24"
  const moisMap = {
    'janv.': '01',
    'févr.': '02',
    'mars': '03',
    'avr.': '04',
    'mai': '05',
    'juin': '06',
    'juil.': '07',
    'août': '08',
    'sept.': '09',
    'oct.': '10',
    'nov.': '11',
    'déc.': '12'
  };
  const [moisTxt, anneeTxt] = str.split('-');
  const mois = moisMap[moisTxt.trim().toLowerCase()];
  const annee = anneeTxt.length === 2 ? '20' + anneeTxt : anneeTxt;
  if (!mois || !annee) return null;
  return `${annee}-${mois}-01 00:00:00`;
}

function formatDateFrToSQL(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'number') {
    // Excel date serial number
    // Excel's epoch starts at 1899-12-30
    const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00`;
  }
  if (typeof dateVal === 'string') {
    const [day, month, year] = dateVal.split('/');
    if (day && month && year) {
      return `${year}-${month}-${day} 00:00:00`;
    }
  }
  return null;
}

async function main() {
  for (const rawRow of rows) {
    const row = cleanRowKeys(rawRow);
    // Adapte les noms de colonnes Excel ci-dessous
    const villeId = await getIdOrCreate('villes', 'name', row['VILLES']);
    const produitId = await getIdOrCreate('produits', 'name', row['PRODUITS']);
    const ambulanceId = row['ID AMBULANCE'] ? await getIdOrCreate('aumbulances', 'numberPlate', row['ID AMBULANCE']) : null;
    const clientId = await getIdOrCreate('clients', 'clientFullName', row['CLIENTS']);
    const medcienId = row['PRESCRIPTEUR'] ? await getIdOrCreate('medciens', 'name', row['PRESCRIPTEUR'].trim()) : null;
    const normalizedBUType = normalizeBusinessUnitType(row['ASSURANCES']);
    const businessUnitId = normalizedBUType ? await getIdOrCreate('businessunits', 'businessUnitType', normalizedBUType) : null;

    // Formatage des dates et des montants
    const dateCreation = row['DATE'] ? formatDateFrToSQL(row['DATE']) : null;
    const caHT = parseFloat((row['CA HT'] || '0').toString().replace(',', '.')) || 0;
    const caTTC = parseFloat((row['CA TTC'] || '0').toString().replace(',', '.')) || 0;

    // Champs directs
    const Ref = row['REF'] || null;
    const fullName = row['NOM'] || null;
    const businessUnitType = normalizedBUType;
    const etatdePaiment = row['ETAT DE PAIEMENT'] || null;
    const numTelephone = row['NUMERO'] || null;

    // Insertion dans la table Globales
    await db.query(
      `INSERT INTO Globales
        (villeId, clientId, aumbulanceId, businessUnitId, produitId, medcienId, dateCreation, Ref, caHT, caTTC, fullName, businessUnitType, etatdePaiment, numTelephone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        villeId,
        clientId,
        ambulanceId,
        businessUnitId,
        produitId,
        medcienId,
        dateCreation,
        Ref,
        caHT,
        caTTC,
        fullName,
        businessUnitType,
        etatdePaiment,
        numTelephone
      ]
    );
    console.log(`Importé: ${Ref}`);
  }
  console.log('Import terminé !');
  process.exit();
}

main();