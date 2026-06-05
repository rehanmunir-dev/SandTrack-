import pool from '../db/pool.js'

export async function getSummaryStats(req, res, next) {
  try {
    // 1. Total Consignments
    const consignmentsCountRes = await pool.query('SELECT COUNT(*) FROM consignments')
    const totalConsignments = parseInt(consignmentsCountRes.rows[0].count, 10)

    // 2. Revenue (verified payments amount sum)
    const revenueRes = await pool.query("SELECT SUM(amount) FROM payments WHERE status = 'VERIFIED'")
    const totalRevenue = parseFloat(revenueRes.rows[0].sum || 0)

    // 3. Pending receivables (pending payments sum)
    const pendingRes = await pool.query("SELECT SUM(amount) FROM payments WHERE status = 'PENDING'")
    const pendingReceivables = parseFloat(pendingRes.rows[0].sum || 0)

    // 4. Flagged Payments count
    const flaggedRes = await pool.query("SELECT COUNT(*) FROM payments WHERE status = 'FLAGGED'")
    const flaggedPayments = parseInt(flaggedRes.rows[0].count, 10)

    const activeTrucksRes = await pool.query('SELECT COUNT(*) FROM trucks')
    const activeTrucks = parseInt(activeTrucksRes.rows[0].count, 10)

    return res.status(200).json({
      success: true,
      data: {
        totalConsignments,
        totalRevenue,
        pendingReceivables,
        flaggedPayments,
        activeTrucks
      }
    })
  } catch (error) {
    next(error)
  }
}

export async function getPaymentsByMethod(req, res, next) {
  try {
    const query = `
      SELECT payment_method, COUNT(*), SUM(amount)
      FROM payments
      WHERE status = 'VERIFIED'
      GROUP BY payment_method
    `
    const { rows } = await pool.query(query)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function getDailyRevenue(req, res, next) {
  try {
    const query = `
      SELECT DATE_TRUNC('day', verified_at)::date as date, SUM(amount) as revenue
      FROM payments
      WHERE status = 'VERIFIED' AND verified_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', verified_at)
      ORDER BY date ASC
    `
    const { rows } = await pool.query(query)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}
