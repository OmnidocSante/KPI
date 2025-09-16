const db = require('../config/db');

// Calcule le CA total (TTC) dans Globales, moins les charges (installments payées + charges variables)
// Query params: start, end (YYYY-MM-DD), paidOnly=1 pour ne prendre que les échéances payées
const getProfit = async (req, res) => {
  try {
    const { start, end, paidOnly } = req.query;
    const startDate = start ? `${start} 00:00:00` : null;
    const endDate = end ? `${end} 23:59:59` : null;

    // CA TTC sur Globales.dateCreation
    let caSql = 'SELECT SUM(caTTC) AS totalCA FROM Globales WHERE destroyTime IS NULL';
    const caParams = [];
    if (startDate) { caSql += ' AND dateCreation >= ?'; caParams.push(startDate); }
    if (endDate) { caSql += ' AND dateCreation <= ?'; caParams.push(endDate); }
    const [caRows] = await db.query(caSql, caParams);
    const totalCA = Number(caRows[0]?.totalCA || 0);

    // Charges récurrentes: somme des installments
    let instSql = 'SELECT SUM(amount) AS totalInst FROM ChargeInstallments WHERE destroyTime IS NULL';
    const instParams = [];
    if (paidOnly) { instSql += ' AND isPaid = 1'; }
    if (start) { instSql += ' AND dueDate >= ?'; instParams.push(start); }
    if (end) { instSql += ' AND dueDate <= ?'; instParams.push(end); }
    const [instRows] = await db.query(instSql, instParams);
    const totalInst = Number(instRows[0]?.totalInst || 0);

    // Charges variables: somme sur variableDate
    let varSql = "SELECT SUM(amount) AS totalVar FROM Charges WHERE destroyTime IS NULL AND type='variable'";
    const varParams = [];
    if (start) { varSql += ' AND variableDate >= ?'; varParams.push(start); }
    if (end) { varSql += ' AND variableDate <= ?'; varParams.push(end); }
    const [varRows] = await db.query(varSql, varParams);
    const totalVar = Number(varRows[0]?.totalVar || 0);

    const totalCharges = totalInst + totalVar;
    const profit = totalCA - totalCharges;

    res.json({ totalCA, totalCharges, totalInstallments: totalInst, totalVariable: totalVar, profit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProfit };


