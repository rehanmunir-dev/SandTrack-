import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(scriptDir, '..', '.env') })
const { default: pool } = await import('../db/pool.js')

const shouldDelete = process.env.CLEAN_E2E_DATA === 'true'

async function getIds(client, sql, params = []) {
  const { rows } = await client.query(sql, params)
  return rows.map((row) => row.id)
}

function asIntArray(ids) {
  return ids.map((id) => Number(id)).filter(Number.isInteger)
}

async function countByIds(client, table, ids) {
  if (ids.length === 0) return 0
  const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE id = ANY($1::int[])`, [ids])
  return rows[0].count
}

async function deleteByIds(client, table, ids) {
  if (ids.length === 0) return 0
  const { rows } = await client.query(`DELETE FROM ${table} WHERE id = ANY($1::int[]) RETURNING id`, [ids])
  return rows.length
}

async function main() {
  const client = await pool.connect()

  try {
    const userIds = asIntArray(await getIds(
      client,
      `SELECT id FROM users
       WHERE lower(username) LIKE '%.e2e_test_%'
          OR full_name LIKE 'E2E_TEST_%'`
    ))

    const driverIds = asIntArray(await getIds(
      client,
      `SELECT id FROM drivers
       WHERE user_id = ANY($1::int[])
          OR cnic LIKE 'E2E_TEST_%'
          OR license_number LIKE 'E2E_TEST_%'`,
      [userIds]
    ))

    const truckIds = asIntArray(await getIds(
      client,
      `SELECT id FROM trucks
       WHERE registration_number LIKE 'E2E_TEST_%'
          OR owner_name LIKE 'E2E_TEST_%'`
    ))

    const consignmentIds = asIntArray(await getIds(
      client,
      `SELECT id FROM consignments
       WHERE consignment_number LIKE 'E2E_TEST_%'
          OR material_type LIKE 'E2E_TEST_%'
          OR destination LIKE 'E2E_TEST_%'
          OR origin_location LIKE 'E2E_TEST_%'
          OR driver_id = ANY($1::int[])
          OR truck_id = ANY($2::int[])
          OR operator_id = ANY($3::int[])`,
      [driverIds, truckIds, userIds]
    ))

    const relatedActivityIds = asIntArray(await getIds(
      client,
      `SELECT id FROM activity_logs
       WHERE actor_id = ANY($1::int[])
          OR metadata::text LIKE '%E2E_TEST_%'
          OR (entity_type = 'CONSIGNMENT' AND entity_id = ANY($2::int[]))
          OR (entity_type = 'DRIVER' AND entity_id = ANY($3::int[]))
          OR (entity_type = 'TRUCK' AND entity_id = ANY($4::int[]))
          OR (entity_type = 'USER' AND entity_id = ANY($1::int[]))`,
      [userIds, consignmentIds, driverIds, truckIds]
    ))

    const summary = {
      ledger_entries: consignmentIds.length
        ? (await client.query('SELECT COUNT(*)::int AS count FROM ledger_entries WHERE consignment_id = ANY($1::int[])', [consignmentIds])).rows[0].count
        : 0,
      payments: consignmentIds.length
        ? (await client.query('SELECT COUNT(*)::int AS count FROM payments WHERE consignment_id = ANY($1::int[])', [consignmentIds])).rows[0].count
        : 0,
      gate_logs: consignmentIds.length
        ? (await client.query('SELECT COUNT(*)::int AS count FROM gate_logs WHERE consignment_id = ANY($1::int[])', [consignmentIds])).rows[0].count
        : 0,
      activity_logs: await countByIds(client, 'activity_logs', relatedActivityIds),
      consignments: await countByIds(client, 'consignments', consignmentIds),
      drivers: await countByIds(client, 'drivers', driverIds),
      trucks: await countByIds(client, 'trucks', truckIds),
      users: await countByIds(client, 'users', userIds),
    }

    console.table(summary)

    if (!shouldDelete) {
      console.log('Dry run only. Set CLEAN_E2E_DATA=true to delete these prefixed E2E records.')
      return
    }

    await client.query('BEGIN')
    const deleted = {}

    deleted.ledger_entries = consignmentIds.length
      ? (await client.query('DELETE FROM ledger_entries WHERE consignment_id = ANY($1::int[]) RETURNING id', [consignmentIds])).rows.length
      : 0
    deleted.payments = consignmentIds.length
      ? (await client.query('DELETE FROM payments WHERE consignment_id = ANY($1::int[]) RETURNING id', [consignmentIds])).rows.length
      : 0
    deleted.gate_logs = consignmentIds.length
      ? (await client.query('DELETE FROM gate_logs WHERE consignment_id = ANY($1::int[]) RETURNING id', [consignmentIds])).rows.length
      : 0
    deleted.activity_logs = await deleteByIds(client, 'activity_logs', relatedActivityIds)
    deleted.consignments = await deleteByIds(client, 'consignments', consignmentIds)
    deleted.drivers = await deleteByIds(client, 'drivers', driverIds)
    deleted.trucks = await deleteByIds(client, 'trucks', truckIds)
    deleted.users = await deleteByIds(client, 'users', userIds)

    await client.query('COMMIT')
    console.table(deleted)
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(`E2E cleanup failed: ${error.message}`)
  process.exit(1)
})
