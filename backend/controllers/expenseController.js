import pool from '../db/pool.js'

export async function getExpenses(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, u.full_name as recorded_by_name
      FROM expenses e
      LEFT JOIN users u ON e.recorded_by = u.id
      ORDER BY e.id DESC
    `)
    return res.status(200).json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
}

export async function createExpense(req, res, next) {
  const { category, amount, description } = req.body
  const recordedBy = req.user.id

  if (!category || !amount) {
    return res.status(400).json({ success: false, message: 'Category and amount are required' })
  }

  try {
    const sql = `
      INSERT INTO expenses (category, amount, description, recorded_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const { rows } = await pool.query(sql, [category, amount, description || '', recordedBy])

    req.activityLog = {
      action: 'CREATED_EXPENSE',
      entityType: 'expense',
      getEntityId: (data) => data.data.id,
      metadata: { category, amount }
    }

    return res.status(201).json({ success: true, data: rows[0], message: 'Expense recorded successfully' })
  } catch (error) {
    next(error)
  }
}

export async function deleteExpense(req, res, next) {
  const { id } = req.params
  try {
    const { rows } = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id])
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense record not found' })
    }

    req.activityLog = {
      action: 'DELETED_EXPENSE',
      entityType: 'expense',
      entityId: parseInt(id, 10),
      metadata: { deletedRecord: rows[0] }
    }

    return res.status(200).json({ success: true, data: rows[0], message: 'Expense deleted successfully' })
  } catch (error) {
    next(error)
  }
}
