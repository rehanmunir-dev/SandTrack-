import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import request from 'supertest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(backendDir, '..')
const frontendDir = path.resolve(rootDir, 'frontend')

dotenv.config({ path: path.join(backendDir, '.env') })
process.env.NODE_ENV = 'test'

const { default: app } = await import('../server.js')
const { default: pool } = await import('../db/pool.js')

const api = request(app)
const runId = `${Date.now()}`
const prefix = `E2E_TEST_${runId}`
const report = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: [],
  rows: [],
  data: {},
}

function record(step, expected, actual, passed, notes = '') {
  const actualText = typeof actual === 'object' && actual !== null
    ? JSON.stringify(sanitize(actual))
    : actual
  report.total += 1
  if (passed) report.passed += 1
  else report.failed += 1
  report.rows.push({ step, expected, actual: actualText, status: passed ? 'PASS' : 'FAIL', notes })
  const mark = passed ? 'PASS' : 'FAIL'
  console.log(`[${mark}] ${step}: ${actualText}`)
}

function sanitize(value) {
  if (Array.isArray(value)) {
    return value.map(sanitize)
  }
  if (!value || typeof value !== 'object') {
    return value
  }

  const secretKeys = new Set([
    'token',
    'accessToken',
    'refreshToken',
    'plainPassword',
    'password',
    'passwordUsed',
    'password_hash',
  ])

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      secretKeys.has(key) ? '[REDACTED]' : sanitize(item)
    ])
  )
}

function pass(step, expected, actual, notes = '') {
  record(step, expected, actual, true, notes)
}

function fail(step, expected, actual, notes = '') {
  record(step, expected, actual, false, notes)
}

function warn(message) {
  report.warnings.push(message)
  console.warn(`[WARN] ${message}`)
}

async function expectStep(step, expected, fn) {
  try {
    const actual = await fn()
    pass(step, expected, actual || expected)
    return actual
  } catch (error) {
    fail(step, expected, error.message)
    return null
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: true, stdio: 'pipe' })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(output || `${command} exited with ${code}`))
    })
  })
}

function auth(token) {
  return { Authorization: `Bearer ${token}` }
}

async function login(username, password) {
  const res = await api.post('/api/auth/login').send({ username, password })
  assert(res.status === 200, `Login failed for ${username}: ${res.status} ${res.body?.message || ''}`)
  const token = res.body?.token || res.body?.accessToken
  assert(token, `Login did not return token for ${username}`)
  return { token, user: res.body.user }
}

async function loginAdmin() {
  const username = process.env.E2E_CEO_USERNAME || 'admin'
  const password = process.env.E2E_CEO_PASSWORD
  assert(password, 'E2E_CEO_PASSWORD is required to run the workflow test')

  const res = await api.post('/api/auth/login').send({ username, password })
  if (res.status === 200) {
    return { token: res.body.token || res.body.accessToken, user: res.body.user }
  }
  throw new Error(`CEO login failed with configured credentials: ${res.status} ${res.body?.message || ''}`)
}

async function createStaff(ceoToken, role, label) {
  const res = await api
    .post('/api/users')
    .set(auth(ceoToken))
    .send({
      fullName: `${prefix}_${label}`,
      role,
      phone: '03000000000',
    })
  assert(res.status === 201, `Create ${role} failed: ${res.status} ${res.body?.message || ''}`)
  return res.body.data
}

async function waitForActivity(action, entityId) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { rows } = await pool.query(
      'SELECT id FROM activity_logs WHERE action = $1 AND entity_id = $2 ORDER BY id DESC LIMIT 1',
      [action, entityId]
    )
    if (rows.length) return true
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return false
}

function hasOnlyPublicQrFields(pass) {
  const forbidden = ['payment_status', 'amount', 'ledger_entries', 'activity_logs', 'gate_logs', 'submitted_by', 'verified_by']
  return forbidden.every((key) => !(key in pass))
}

async function main() {
  console.log(`\nSandTrack workflow E2E run: ${prefix}\n`)

  await expectStep('Environment variables', 'DATABASE_URL and JWT secrets available', async () => {
    assert(process.env.DATABASE_URL, 'DATABASE_URL is missing')
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      warn('JWT secrets are using fallback or are partially missing. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET before production.')
    }
    return 'Required database config found'
  })

  await expectStep('Backend health', 'Health endpoint and DB are ready', async () => {
    const res = await api.get('/api/health')
    assert(res.status === 200, `Health status ${res.status}`)
    assert(res.body.db === 'connected', `DB is ${res.body.db}`)
    return 'Backend health ok, DB connected'
  })

  await expectStep('Frontend build', 'Frontend production build succeeds', async () => {
    const output = await runCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build', '--', '--emptyOutDir=false'], frontendDir)
    if (output.includes('Some chunks are larger than 500 kB')) {
      warn('Frontend build passes but Vite reports large chunks.')
    }
    return 'Frontend build succeeded'
  })

  const ceo = await expectStep('CEO login', 'CEO can login and receives SUPER_ADMIN role', async () => {
    const session = await loginAdmin()
    assert(session.user?.role === 'SUPER_ADMIN', `Expected SUPER_ADMIN, got ${session.user?.role}`)
    return session
  })
  if (!ceo) throw new Error('Cannot continue without CEO login')

  const operatorStaff = await expectStep('Create Operator', 'CEO creates test operator', () => createStaff(ceo.token, 'OPERATOR', 'Operator'))
  const watchmanStaff = await expectStep('Create Watchman', 'CEO creates test watchman', () => createStaff(ceo.token, 'WATCHMAN', 'Watchman'))
  const accountantStaff = await expectStep('Create Accountant', 'CEO creates test accountant', () => createStaff(ceo.token, 'ACCOUNTANT', 'Accountant'))

  const operator = await expectStep('Operator login', 'Operator login works', async () => {
    const session = await login(operatorStaff.username, operatorStaff.plainPassword)
    assert(session.user.role === 'OPERATOR', `Expected OPERATOR, got ${session.user.role}`)
    return session
  })
  const watchman = await expectStep('Watchman login', 'Watchman login works', async () => {
    const session = await login(watchmanStaff.username, watchmanStaff.plainPassword)
    assert(session.user.role === 'WATCHMAN', `Expected WATCHMAN, got ${session.user.role}`)
    return session
  })
  const accountant = await expectStep('Accountant login', 'Accountant login works', async () => {
    const session = await login(accountantStaff.username, accountantStaff.plainPassword)
    assert(session.user.role === 'ACCOUNTANT', `Expected ACCOUNTANT, got ${session.user.role}`)
    return session
  })

  const driverName = `${prefix}_Driver`
  const driverCnic = `99${String(runId).slice(-11)}`.slice(0, 13)
  const truckNo = `E2E${String(runId).slice(-10)}`

  const truck = await expectStep('Operator creates unapproved truck', 'Truck is created pending approval', async () => {
    const res = await api
      .post('/api/trucks')
      .set(auth(operator.token))
      .send({
        registrationNumber: truckNo,
        vehicleType: 'Damper',
        wheelCount: 14,
        ownerName: `${prefix}_Owner`,
      })
    assert(res.status === 201, `Truck create failed: ${res.status} ${res.body?.message || ''}`)
    assert(res.body.data.is_approved === false, 'Truck should start unapproved')
    return res.body.data
  })

  const driver = await expectStep('Operator creates unapproved driver', 'Driver is created pending approval with login', async () => {
    const res = await api
      .post('/api/drivers')
      .set(auth(operator.token))
      .field('fullName', driverName)
      .field('cnic', driverCnic)
      .field('licenseNumber', `${prefix}_LIC`)
      .field('phone', '03001112222')
    assert(res.status === 201, `Driver create failed: ${res.status} ${res.body?.message || ''}`)
    assert(res.body.data.isApproved === false, 'Driver should start unapproved')
    assert(res.body.data.loginCredentials?.username, 'Driver login credentials missing')
    return res.body.data
  })

  await expectStep('Driver login', 'Driver account created by operator can login', async () => {
    const session = await login(driver.loginCredentials.username, driver.loginCredentials.plainPassword)
    assert(session.user.role === 'DRIVER', `Expected DRIVER, got ${session.user.role}`)
    return session
  })
  const driverSession = await login(driver.loginCredentials.username, driver.loginCredentials.plainPassword)

  await expectStep('Unapproved consignment blocked', 'Unapproved driver/truck cannot be assigned', async () => {
    const res = await api
      .post('/api/consignments')
      .set(auth(operator.token))
      .send({
        driverId: driver.id,
        truckId: truck.id,
        materialType: `${prefix}_Sand`,
        weightTons: '18.50',
        destination: `${prefix}_Destination`,
        price: 12345,
        discount: 45,
      })
    assert(res.status === 400, `Expected 400, got ${res.status}`)
    return 'Backend rejected unapproved driver/truck'
  })

  await expectStep('CEO approves driver', 'Driver approval works', async () => {
    const res = await api.patch(`/api/drivers/${driver.id}/approve`).set(auth(ceo.token))
    assert(res.status === 200, `Approve driver failed: ${res.status}`)
    assert(res.body.data.is_approved === true, 'Driver is not approved')
    return 'Driver approved'
  })

  await expectStep('CEO approves truck', 'Truck approval works', async () => {
    const res = await api.patch(`/api/trucks/${truck.id}/approve`).set(auth(ceo.token))
    assert(res.status === 200, `Approve truck failed: ${res.status}`)
    assert(res.body.data.is_approved === true, 'Truck is not approved')
    return 'Truck approved'
  })

  await expectStep('Operator deactivates driver/truck', 'Operator can mark approved driver and truck inactive', async () => {
    const driverRes = await api
      .patch(`/api/drivers/${driver.id}`)
      .set(auth(operator.token))
      .send({ status: 'inactive' })
    assert(driverRes.status === 200, `Driver inactive update failed: ${driverRes.status} ${driverRes.body?.message || ''}`)

    const truckRes = await api
      .patch(`/api/trucks/${truck.id}`)
      .set(auth(operator.token))
      .send({ status: 'inactive' })
    assert(truckRes.status === 200, `Truck inactive update failed: ${truckRes.status} ${truckRes.body?.message || ''}`)

    const { rows: driverRows } = await pool.query('SELECT is_active FROM drivers WHERE id = $1', [driver.id])
    const { rows: truckRows } = await pool.query('SELECT status FROM trucks WHERE id = $1', [truck.id])
    assert(driverRows[0].is_active === false, 'Driver did not become inactive')
    assert(truckRows[0].status === 'INACTIVE', `Truck status is ${truckRows[0].status}`)
    return 'Driver and truck are inactive'
  })

  await expectStep('Inactive consignment blocked', 'Inactive approved driver/truck cannot be assigned', async () => {
    const res = await api
      .post('/api/consignments')
      .set(auth(operator.token))
      .send({
        driverId: driver.id,
        truckId: truck.id,
        materialType: `${prefix}_InactiveBlockedSand`,
        weightTons: '18.50',
        destination: `${prefix}_Destination`,
        price: 12345,
        discount: 45,
      })
    assert(res.status === 400, `Expected 400, got ${res.status}`)
    return 'Backend rejected inactive driver/truck'
  })

  await expectStep('Operator reactivates driver/truck', 'Operator can mark driver and truck active again', async () => {
    const driverRes = await api
      .patch(`/api/drivers/${driver.id}`)
      .set(auth(operator.token))
      .send({ status: 'active' })
    assert(driverRes.status === 200, `Driver active update failed: ${driverRes.status} ${driverRes.body?.message || ''}`)

    const truckRes = await api
      .patch(`/api/trucks/${truck.id}`)
      .set(auth(operator.token))
      .send({ status: 'active' })
    assert(truckRes.status === 200, `Truck active update failed: ${truckRes.status} ${truckRes.body?.message || ''}`)

    const { rows: driverRows } = await pool.query('SELECT is_active FROM drivers WHERE id = $1', [driver.id])
    const { rows: truckRows } = await pool.query('SELECT status FROM trucks WHERE id = $1', [truck.id])
    assert(driverRows[0].is_active === true, 'Driver did not become active')
    assert(truckRows[0].status === 'ACTIVE', `Truck status is ${truckRows[0].status}`)
    return 'Driver and truck are active again'
  })

  const consignment = await expectStep('Operator creates consignment', 'Approved driver/truck create SCAN_PENDING order and payment', async () => {
    const res = await api
      .post('/api/consignments')
      .set(auth(operator.token))
      .send({
        driverId: driver.id,
        truckId: truck.id,
        materialType: `${prefix}_Sand`,
        weightTons: '18.50',
        originLocation: `${prefix}_Origin`,
        destination: `${prefix}_Destination`,
        price: 12345,
        discount: 45,
      })
    assert(res.status === 201, `Consignment create failed: ${res.status} ${res.body?.message || ''}`)
    assert(res.body.data.status === 'SCAN_PENDING', `Expected SCAN_PENDING, got ${res.body.data.status}`)
    const paymentsRes = await api.get('/api/payments').set(auth(accountant.token))
    const payment = paymentsRes.body.data.find((p) => p.consignment_id === res.body.data.id)
    assert(payment, 'Auto payment record not found')
    assert(payment.status === 'PENDING', `Expected pending payment, got ${payment.status}`)
    report.data.paymentId = payment.id
    report.data.paymentAmount = Number(payment.amount)
    return res.body.data
  })

  report.data.consignmentId = consignment.id
  report.data.consignmentNumber = consignment.consignment_number

  await expectStep('Busy driver/truck assignment blocked', 'Same driver/truck cannot receive another open consignment', async () => {
    const res = await api
      .post('/api/consignments')
      .set(auth(operator.token))
      .send({
        driverId: driver.id,
        truckId: truck.id,
        materialType: `${prefix}_DuplicateBusySand`,
        weightTons: '11.25',
        originLocation: `${prefix}_Origin`,
        destination: `${prefix}_DuplicateBusyDestination`,
        price: 500,
        discount: 0,
      })
    assert(res.status === 400, `Expected busy assignment 400, got ${res.status}`)
    assert(/busy/i.test(res.body?.message || ''), `Expected busy error message, got ${res.body?.message || ''}`)
    return 'Backend rejected second open consignment for same driver/truck'
  })

  await expectStep('CEO/Operator/Driver visibility', 'All roles can see appropriate consignment data', async () => {
    const ceoRes = await api.get('/api/consignments').set(auth(ceo.token))
    const opRes = await api.get('/api/consignments').set(auth(operator.token))
    const driverRes = await api.get('/api/consignments').set(auth(driverSession.token))
    assert(ceoRes.body.data.some((c) => c.id === consignment.id), 'CEO cannot see consignment')
    assert(opRes.body.data.some((c) => c.id === consignment.id), 'Operator cannot see consignment')
    assert(driverRes.body.data.some((c) => c.id === consignment.id), 'Driver cannot see assigned consignment')
    return 'Consignment visible to CEO, operator, and assigned driver'
  })

  const qr = await expectStep('Operator generates QR', 'QR token and expiry are stored', async () => {
    const res = await api.post(`/api/consignments/${consignment.id}/qr`).set(auth(operator.token))
    assert(res.status === 200, `QR generation failed: ${res.status}`)
    const token = res.body.data?.consignment?.qr_token
    assert(token, 'QR token missing')
    assert(res.body.data?.expiresAt, 'QR expiry missing')
    return { token, expiresAt: res.body.data.expiresAt, sessionUrl: res.body.data.sessionUrl }
  })
  report.data.qrTokenTail = qr.token.slice(-8)

  await expectStep('Public QR pass', 'Public pass works and exposes only pass data', async () => {
    const res = await api.get(`/api/consignments/qr-pass/${qr.token}`)
    assert(res.status === 200, `Public QR failed: ${res.status}`)
    const passData = res.body.data
    assert(passData.consignment_number === consignment.consignment_number, 'Wrong consignment on public pass')
    assert(passData.driver_name === driverName, 'Driver name missing on public pass')
    assert(passData.truck_registration === truckNo, 'Truck number missing on public pass')
    assert(passData.material_type === `${prefix}_Sand`, 'Material missing on public pass')
    assert(hasOnlyPublicQrFields(passData), 'Public QR exposes sensitive/internal fields')
    return 'Public pass contains branding-ready public payload only'
  })

  await expectStep('Watchman verifies QR read-only', 'Verify returns details but keeps SCAN_PENDING', async () => {
    const verify = await api.get(`/api/consignments/verify-qr/${qr.token}`).set(auth(watchman.token))
    assert(verify.status === 200, `Verify QR failed: ${verify.status}`)
    assert(verify.body.valid === true, 'QR not valid')
    const after = await api.get(`/api/consignments/${consignment.id}`).set(auth(ceo.token))
    assert(after.body.data.status === 'SCAN_PENDING', `Verify changed status to ${after.body.data.status}`)
    return 'QR verified and status remained SCAN_PENDING'
  })

  await expectStep('Watchman clears gate', 'CLEAR GATE changes status to IN_TRANSIT and deactivates QR', async () => {
    const clear = await api
      .post(`/api/consignments/${consignment.id}/clear-gate`)
      .set(auth(watchman.token))
      .send({ qrToken: qr.token })
    assert(clear.status === 200, `Clear gate failed: ${clear.status} ${clear.body?.message || ''}`)
    assert(clear.body.data.status === 'IN_TRANSIT', `Expected IN_TRANSIT, got ${clear.body.data.status}`)
    assert(clear.body.data.qr_token === null, 'QR token should be cleared')
    const logs = await api.get('/api/gate-logs').set(auth(ceo.token))
    assert(logs.status === 200, `CEO gate logs fetch failed: ${logs.status}`)
    assert(logs.body.data.some((g) => g.consignment_id === consignment.id && g.scan_result === 'CLEARED'), 'Gate log missing')
    const logged = await waitForActivity('GATE_CLEARED', consignment.id)
    assert(logged, 'Activity log for GATE_CLEARED missing')
    return 'Gate cleared, order is on the way, QR disabled'
  })

  await expectStep('Duplicate QR reuse blocked', 'Old QR cannot verify or clear again', async () => {
    const verifyAgain = await api.get(`/api/consignments/verify-qr/${qr.token}`).set(auth(watchman.token))
    assert([404, 200].includes(verifyAgain.status), `Unexpected status ${verifyAgain.status}`)
    if (verifyAgain.status === 200) assert(verifyAgain.body.valid === false, 'Duplicate QR should be invalid')
    const clearAgain = await api
      .post(`/api/consignments/${consignment.id}/clear-gate`)
      .set(auth(watchman.token))
      .send({ qrToken: qr.token })
    assert(clearAgain.status === 400, `Expected duplicate clear 400, got ${clearAgain.status}`)
    return 'Duplicate QR use blocked'
  })

  await expectStep('Invalid QR blocked', 'Invalid QR token fails', async () => {
    const res = await api.get('/api/consignments/verify-qr/INVALID_E2E_TOKEN').set(auth(watchman.token))
    assert(res.status === 404, `Expected 404, got ${res.status}`)
    return 'Invalid QR rejected'
  })

  await expectStep('Accountant marks arrived', 'IN_TRANSIT moves to ARRIVED', async () => {
    const res = await api.patch(`/api/consignments/${consignment.id}/mark-arrived`).set(auth(accountant.token))
    assert(res.status === 200, `Mark arrived failed: ${res.status}`)
    assert(res.body.data.status === 'ARRIVED', `Expected ARRIVED, got ${res.body.data.status}`)
    return 'Marked ARRIVED'
  })

  await expectStep('Accountant updates payment and delivery', 'Ledger payment update marks payment VERIFIED and consignment DELIVERED', async () => {
    const res = await api
      .put(`/api/payments/${report.data.paymentId}`)
      .set(auth(accountant.token))
      .send({
        method: 'CASH',
        amount: report.data.paymentAmount,
        status: 'VERIFIED',
        remarks: `${prefix}_Payment received`,
      })
    assert(res.status === 200, `Update payment failed: ${res.status} ${res.body?.message || ''}`)
    assert(res.body.data.status === 'VERIFIED', `Expected VERIFIED, got ${res.body.data.status}`)
    const consRes = await api.get(`/api/consignments/${consignment.id}`).set(auth(ceo.token))
    assert(consRes.body.data.status === 'DELIVERED', `Payment update did not deliver consignment; got ${consRes.body.data.status}`)
    return 'Payment updated and consignment delivered'
  })

  await expectStep('Accountant closes ledger', 'Delivered and verified consignment closes ledger', async () => {
    const res = await api.post(`/api/ledger/close-consignment/${consignment.id}`).set(auth(accountant.token))
    assert(res.status === 200, `Close ledger failed: ${res.status} ${res.body?.message || ''}`)
    assert(res.body.data.consignment.status === 'CLOSED', `Expected CLOSED, got ${res.body.data.consignment.status}`)
    assert(res.body.data.ledgerEntry.status === 'CLOSED', 'Ledger entry not closed')
    return 'Ledger closed, consignment final status CLOSED'
  })

  await expectStep('Revenue and full detail sync', 'Analytics/detail reflect paid and closed order', async () => {
    const summary = await api.get('/api/analytics/summary').set(auth(ceo.token))
    assert(summary.status === 200, `Analytics summary failed: ${summary.status}`)
    assert(Number(summary.body.data.totalRevenue) >= report.data.paymentAmount, 'Revenue did not include verified payment')
    const full = await api.get(`/api/consignments/${consignment.id}/full-detail`).set(auth(ceo.token))
    assert(full.status === 200, `Full detail failed: ${full.status}`)
    assert(full.body.data.payments.some((p) => p.status === 'VERIFIED'), 'Full detail missing verified payment')
    assert(full.body.data.gateLogs.length > 0, 'Full detail missing gate logs')
    assert(full.body.data.ledgerEntries.some((l) => l.status === 'CLOSED'), 'Full detail missing closed ledger')
    assert(full.body.data.activityLogs.length > 0, 'Full detail missing activity logs')
    return 'CEO full detail and revenue are synced'
  })

  await expectStep('Unauthorized route blocks', 'RBAC denies wrong-role actions', async () => {
    const driverUsers = await api.get('/api/users').set(auth(driverSession.token))
    assert(driverUsers.status === 403, `Driver users access expected 403, got ${driverUsers.status}`)
    const opVerify = await api.patch(`/api/payments/${report.data.paymentId}/verify`).set(auth(operator.token))
    assert(opVerify.status === 403, `Operator verify expected 403, got ${opVerify.status}`)
    const watchmanLedger = await api.post(`/api/ledger/close-consignment/${consignment.id}`).set(auth(watchman.token))
    assert(watchmanLedger.status === 403, `Watchman ledger expected 403, got ${watchmanLedger.status}`)
    const noQrClear = await api.post(`/api/consignments/${consignment.id}/clear-gate`).set(auth(watchman.token)).send({})
    assert([400, 403].includes(noQrClear.status), `Clear without QR expected 400/403, got ${noQrClear.status}`)
    return 'Unauthorized actions blocked'
  })

  await expectStep('Expired QR simulation', 'Expired token is rejected', async () => {
    const second = await api
      .post('/api/consignments')
      .set(auth(operator.token))
      .send({
        driverId: driver.id,
        truckId: truck.id,
        materialType: `${prefix}_ExpiredQrSand`,
        weightTons: '9.25',
        originLocation: `${prefix}_Origin`,
        destination: `${prefix}_ExpiredDestination`,
        price: 100,
        discount: 0,
      })
    assert(second.status === 201, `Second consignment create failed: ${second.status}`)
    const qrRes = await api.post(`/api/consignments/${second.body.data.id}/qr`).set(auth(operator.token))
    const expiredToken = qrRes.body.data.consignment.qr_token
    await pool.query("UPDATE consignments SET qr_expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1", [second.body.data.id])
    const verify = await api.get(`/api/consignments/verify-qr/${expiredToken}`).set(auth(watchman.token))
    assert(verify.status === 200, `Expired verify expected 200 invalid, got ${verify.status}`)
    assert(verify.body.valid === false && verify.body.reason === 'EXPIRED', 'Expired token was not rejected')
    return 'Expired QR rejected'
  })

  await expectStep('Persistence readback', 'Records persist in PostgreSQL during test process', async () => {
    const { rows } = await pool.query(
      'SELECT c.status, p.status as payment_status, l.status as ledger_status FROM consignments c LEFT JOIN payments p ON p.consignment_id = c.id LEFT JOIN ledger_entries l ON l.consignment_id = c.id WHERE c.id = $1',
      [consignment.id]
    )
    assert(rows.length > 0, 'Consignment not found in database')
    assert(rows[0].status === 'CLOSED', `Expected CLOSED, got ${rows[0].status}`)
    assert(rows[0].payment_status === 'VERIFIED', `Expected VERIFIED payment, got ${rows[0].payment_status}`)
    assert(rows[0].ledger_status === 'CLOSED', `Expected CLOSED ledger, got ${rows[0].ledger_status}`)
    return 'Closed order persisted in PostgreSQL'
  })

  report.data.created = {
    users: [operatorStaff.username, watchmanStaff.username, accountantStaff.username, driver.loginCredentials.username],
    driverId: driver.id,
    truckId: truck.id,
    consignmentId: consignment.id,
    paymentId: report.data.paymentId,
  }
}

function printReport() {
  console.log('\n# SandTrack Workflow E2E Report\n')
  console.log(`Run ID: ${prefix}`)
  console.log(`Total: ${report.total}`)
  console.log(`Passed: ${report.passed}`)
  console.log(`Failed: ${report.failed}`)
  console.log(`Warnings: ${report.warnings.length}`)
  if (report.warnings.length) {
    report.warnings.forEach((message) => console.log(`- WARNING: ${message}`))
  }
  console.log('\n| Step | Expected | Actual | Status | Notes |')
  console.log('|---|---|---|---|---|')
  report.rows.forEach((row) => {
    console.log(`| ${row.step} | ${row.expected} | ${String(row.actual).replaceAll('|', '/')} | ${row.status} | ${row.notes || ''} |`)
  })
  console.log('\nTest Data Created:')
  console.log(JSON.stringify(report.data.created || {}, null, 2))
  console.log(`\nFinal verdict: ${report.failed === 0 ? 'READY AFTER MINOR FIXES' : 'NOT READY FOR DEPLOYMENT'}`)
}

try {
  await main()
} catch (error) {
  fail('Fatal workflow runner error', 'Runner completes without fatal error', error.message)
} finally {
  printReport()
  await pool.end()
  process.exit(report.failed > 0 ? 1 : 0)
}
