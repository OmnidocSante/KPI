const db = require('../config/db');

// Catégories
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ChargeCategories WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO ChargeCategories (name, createdAt, updatedAt) VALUES (?, ?, ?)',
      [name, now, now]
    );
    res.status(201).json({ id: result.insertId, name, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'UPDATE ChargeCategories SET name = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [name, now, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ id: req.params.id, name, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE ChargeCategories SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helpers date sans timezone
function parseYMD(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(n => parseInt(n, 10));
  return { year: y, month: m, day: d };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month: 1-12
}

function formatYMD(year, month, day) {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonthsYMD(dateStr, monthsToAdd) {
  const { year, month, day } = parseYMD(dateStr); // month 1-12
  let totalMonths = (month - 1) + monthsToAdd;
  let newYear = year + Math.floor(totalMonths / 12);
  let newMonthIndex = totalMonths % 12;
  if (newMonthIndex < 0) {
    newMonthIndex += 12;
    newYear -= 1;
  }
  const newMonth = newMonthIndex + 1; // back to 1-12
  const dim = daysInMonth(newYear, newMonth);
  const newDay = Math.min(day, dim);
  return formatYMD(newYear, newMonth, newDay);
}

function addYearsYMD(dateStr, yearsToAdd) {
  const { year, month, day } = parseYMD(dateStr);
  const newYear = year + yearsToAdd;
  const dim = daysInMonth(newYear, month);
  const newDay = Math.min(day, dim);
  return formatYMD(newYear, month, newDay);
}

// Aide: générer échéances pour charges récurrentes (sans timezone)
async function generateInstallmentsIfRecurring(chargeId, type, priceType, unitPrice, periodCount, startDate) {
  if (type !== 'recurring' || !priceType || !unitPrice || !periodCount || !startDate) return;
  for (let i = 0; i < periodCount; i++) {
    const due = priceType === 'monthly'
      ? addMonthsYMD(startDate, i)
      : addYearsYMD(startDate, i);
    await db.query(
      'INSERT INTO ChargeInstallments (chargeId, dueDate, amount) VALUES (?, ?, ?)',
      [chargeId, due, unitPrice]
    );
  }
}

// Charges
const listCharges = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.*,
        cat.name AS categoryName,
        v.name AS villeName,
        a.numberPlate AS ambulancePlate,
        f.name AS fournisseurName,
        (SELECT COUNT(*) FROM ChargeInstallments ci WHERE ci.chargeId = c.id AND ci.destroyTime IS NULL) AS totalInstallments,
        (SELECT COUNT(*) FROM ChargeInstallments ci WHERE ci.chargeId = c.id AND ci.destroyTime IS NULL AND ci.isPaid = 1) AS paidInstallments
      FROM Charges c
      LEFT JOIN ChargeCategories cat ON c.categoryId = cat.id
      LEFT JOIN Villes v ON c.villeId = v.id
      LEFT JOIN aumbulances a ON c.ambulanceId = a.id
      LEFT JOIN Fournisseurs f ON c.fournisseurId = f.id
      WHERE c.destroyTime IS NULL
      ORDER BY c.createdAt DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCharge = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, f.name AS fournisseurName FROM Charges c LEFT JOIN Fournisseurs f ON c.fournisseurId = f.id WHERE c.id = ? AND c.destroyTime IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Charge non trouvée' });
    const charge = rows[0];
    const [installments] = await db.query(
      'SELECT * FROM ChargeInstallments WHERE chargeId = ? AND destroyTime IS NULL ORDER BY dueDate ASC',
      [req.params.id]
    );
    res.json({ ...charge, installments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCharge = async (req, res) => {
  try {
    const {
      label,
      categoryId,
      villeId,
      ambulanceId,
      fournisseurId,
      type, // 'recurring' | 'variable'
      priceType, // 'monthly' | 'yearly' (si recurring)
      unitPrice, // montant par période si recurring
      periodCount, // nb de périodes (mois/ans)
      startDate, // début si recurring
      endDate, // optionnel
      amount, // pour variable
      variableDate, // date de la charge variable
      notes,
      valide, // <-- Ajouté
      invoicePeriod
    } = req.body;

    if (!label || !type) {
      return res.status(400).json({ message: 'label et type sont requis' });
    }

    let computedEndDate = endDate || null;

    if (type === 'recurring') {
      if (!priceType || !unitPrice || !periodCount || !startDate) {
        return res.status(400).json({ message: 'Pour une charge récurrente, priceType, unitPrice, periodCount et startDate sont requis' });
      }
      const pc = Number(periodCount);
      if (!Number.isFinite(pc) || pc <= 0) {
        return res.status(400).json({ message: 'periodCount doit être un entier > 0' });
      }
      if (!computedEndDate) {
        computedEndDate = priceType === 'monthly'
          ? addMonthsYMD(startDate, pc - 1)
          : addYearsYMD(startDate, pc - 1);
      }
    } else if (type === 'variable') {
      if (!amount) {
        return res.status(400).json({ message: 'Pour une charge variable, amount est requis' });
      }
    }

    const now = new Date();
    const [result] = await db.query(
      `INSERT INTO Charges (label, categoryId, villeId, ambulanceId, fournisseurId, type, priceType, unitPrice, periodCount, startDate, endDate, amount, variableDate, notes, createdAt, updatedAt, valide, invoicePeriod)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [label, categoryId || null, villeId || null, ambulanceId || null, fournisseurId || null, type, priceType || null, unitPrice || null, periodCount || null, startDate || null, computedEndDate || null, amount || null, variableDate || null, notes || null, now, now, (valide === 0 || valide === false) ? 0 : 1, invoicePeriod || null]
    );

    const chargeId = result.insertId;
    await generateInstallmentsIfRecurring(chargeId, type, priceType, unitPrice, periodCount, startDate);
    // Pour une charge variable, créer une seule échéance pour permettre le suivi payé/non payé
    if (type === 'variable' && amount) {
      await db.query(
        'INSERT INTO ChargeInstallments (chargeId, dueDate, amount) VALUES (?, ?, ?)',
        [chargeId, variableDate || null, amount]
      );
    }

    res.status(201).json({ id: chargeId, endDate: computedEndDate });
  } catch (error) {
    console.error('Erreur createCharge:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateCharge = async (req, res) => {
  try {
    const {
      label,
      categoryId,
      villeId,
      ambulanceId,
      fournisseurId,
      type,
      priceType,
      unitPrice,
      periodCount,
      startDate,
      endDate,
      amount,
      notes,
      variableDate,
      valide, // <-- Ajouté
      invoicePeriod
    } = req.body;
    const now = new Date();
    const [result] = await db.query(
      `UPDATE Charges SET label=?, categoryId=?, villeId=?, ambulanceId=?, fournisseurId=?, type=?, priceType=?, unitPrice=?, periodCount=?, startDate=?, endDate=?, amount=?, variableDate=?, notes=?, updatedAt=?, valide=?, invoicePeriod=?
       WHERE id = ? AND destroyTime IS NULL`,
      [label, categoryId || null, villeId || null, ambulanceId || null, fournisseurId || null, type, priceType || null, unitPrice || null, periodCount || null, startDate || null, endDate || null, amount || null, variableDate || null, notes || null, now, (valide === 0 || valide === false) ? 0 : 1, invoicePeriod || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Charge non trouvée' });

    // Régénérer les échéances selon le type
    if (type === 'recurring') {
      await db.query('UPDATE ChargeInstallments SET destroyTime = ? WHERE chargeId = ? AND destroyTime IS NULL', [now, req.params.id]);
      await generateInstallmentsIfRecurring(Number(req.params.id), type, priceType, unitPrice, periodCount, startDate);
    } else if (type === 'variable') {
      // Pour variable: on garde une seule échéance alignée sur variableDate/amount
      await db.query('UPDATE ChargeInstallments SET destroyTime = ? WHERE chargeId = ? AND destroyTime IS NULL', [now, req.params.id]);
      if (amount) {
        await db.query('INSERT INTO ChargeInstallments (chargeId, dueDate, amount) VALUES (?, ?, ?)', [Number(req.params.id), variableDate || null, amount]);
      }
    }

    res.json({ message: 'Charge mise à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCharge = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query('UPDATE Charges SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL', [now, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Charge non trouvée' });
    await db.query('UPDATE ChargeInstallments SET destroyTime = ? WHERE chargeId = ? AND destroyTime IS NULL', [now, req.params.id]);
    res.json({ message: 'Charge supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listInstallments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ChargeInstallments WHERE chargeId = ? AND destroyTime IS NULL ORDER BY dueDate ASC', [req.params.chargeId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markInstallmentPaid = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query('UPDATE ChargeInstallments SET isPaid = 1, paidAt = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL', [now, now, req.params.installmentId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Échéance non trouvée' });
    res.json({ message: 'Échéance marquée payée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markInstallmentUnpaid = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query('UPDATE ChargeInstallments SET isPaid = 0, paidAt = NULL, updatedAt = ? WHERE id = ? AND destroyTime IS NULL', [now, req.params.installmentId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Échéance non trouvée" });
    res.json({ message: "Échéance marquée non payée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const autorouteCharge = async (req, res) => {
  try {
    const { montant, ville, ambulanceNumber, ambulancierName, date } = req.body;
    if (!montant || !ville || !ambulanceNumber || !ambulancierName || !date) {
      return res.status(400).json({ message: 'montant, ville, ambulanceNumber, ambulancierName, date sont requis' });
    }
    // Trouver l'id de la ville
    const [villeRows] = await db.query('SELECT id FROM Villes WHERE name = ? AND destroyTime IS NULL', [ville]);
    const villeId = villeRows.length > 0 ? villeRows[0].id : null;
    // Trouver l'id de l'ambulance par numéro interne
    const [ambRows] = await db.query('SELECT id FROM Aumbulances WHERE number = ? AND destroyTime IS NULL', [ambulanceNumber]);
    const ambulanceId = ambRows.length > 0 ? ambRows[0].id : null;
    // Trouver l'id de l'ambulancier par nom (tolérance sur le nom)
    const [ambcRows] = await db.query('SELECT id FROM Ambulanciers WHERE name LIKE ? AND destroyTime IS NULL', [`%${ambulancierName}%`]);
    const ambulancierId = ambcRows.length > 0 ? ambcRows[0].id : null;
    // Créer la charge non valide
    const now = new Date();
    const invoicePeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await db.query(
      `INSERT INTO Charges (label, categoryId, villeId, ambulanceId, type, amount, variableDate, notes,fournisseurId, createdAt, updatedAt, valide, invoicePeriod)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        'ADM',
        3,
        villeId,
        ambulanceId,
        'variable',
        montant,
        date,
        `Import autoroute - Ambulancier: ${ambulancierName}`,
        1,
        now,
        now,
        invoicePeriod
      ]
    );
    const chargeId = result.insertId;
    // Créer une échéance unique avec la date fournie
    await db.query('INSERT INTO ChargeInstallments (chargeId, dueDate, amount) VALUES (?, ?, ?)', [chargeId, date, montant]);
    res.status(201).json({
      id: chargeId,
      villeId,
      ambulanceId,
      ambulancierId,
      message: (!villeId ? 'Ville non trouvée. ' : '') + (!ambulanceId ? 'Ambulance non trouvée. ' : '') + (!ambulancierId ? 'Ambulancier non trouvé.' : '')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const carburantCharge = async (req, res) => {
  try {
    const { montant, ville, ambulanceNumber, ambulancierName, date } = req.body;
    if (!montant || !ville || !ambulanceNumber || !ambulancierName || !date) {
      return res.status(400).json({ message: 'montant, ville, ambulanceNumber, ambulancierName, date sont requis' });
    }
    const [villeRows] = await db.query('SELECT id FROM Villes WHERE name = ? AND destroyTime IS NULL', [ville]);
    const villeId = villeRows.length > 0 ? villeRows[0].id : null;
    const [ambRows] = await db.query('SELECT id FROM Aumbulances WHERE number = ? AND destroyTime IS NULL', [ambulanceNumber]);
    const ambulanceId = ambRows.length > 0 ? ambRows[0].id : null;
    const [ambcRows] = await db.query('SELECT id FROM Ambulanciers WHERE name LIKE ? AND destroyTime IS NULL', [`%${ambulancierName}%`]);
    const ambulancierId = ambcRows.length > 0 ? ambcRows[0].id : null;
    const now = new Date();
    const invoicePeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await db.query(
      `INSERT INTO Charges (label, categoryId, villeId, ambulanceId, type, amount, variableDate, notes,fournisseurId, createdAt, updatedAt, valide, invoicePeriod)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        'Total',
        2,
        villeId,
        ambulanceId,
        'variable',
        montant,
        date,
        `Import carburant - Ambulancier: ${ambulancierName}`,
        2,
        now,
        now,
        invoicePeriod
      ]
    );
    const chargeId = result.insertId;
    await db.query('INSERT INTO ChargeInstallments (chargeId, dueDate, amount) VALUES (?, ?, ?)', [chargeId, date, montant]);
    res.status(201).json({
      id: chargeId,
      villeId,
      ambulanceId,
      ambulancierId,
      message: (!villeId ? 'Ville non trouvée. ' : '') + (!ambulanceId ? 'Ambulance non trouvée. ' : '') + (!ambulancierId ? 'Ambulancier non trouvé.' : '')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markChargeValid = async (req, res) => {
  try {
    const now = new Date();
    const [r] = await db.query('UPDATE Charges SET valide = 1, updatedAt = ? WHERE id = ? AND destroyTime IS NULL', [now, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Charge non trouvée' });
    res.json({ message: 'Charge validée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markChargeInvalid = async (req, res) => {
  try {
    const now = new Date();
    const [r] = await db.query('UPDATE Charges SET valide = 0, updatedAt = ? WHERE id = ? AND destroyTime IS NULL', [now, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Charge non trouvée' });
    res.json({ message: 'Charge passée en non valide' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listCharges,
  getCharge,
  createCharge,
  updateCharge,
  deleteCharge,
  listInstallments,
  markInstallmentPaid,
  markInstallmentUnpaid,
  autorouteCharge,
  carburantCharge,
  markChargeValid,
  markChargeInvalid
};


