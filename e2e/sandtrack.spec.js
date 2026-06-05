import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

// Shared state between tests to pass values down the workflow
let driverCnic = ''
let vehicleNo = ''
let qrCodeValue = ''
let consignmentId = ''

test.describe('SandTrack Anti-Fraud Logistics Platform End-to-End Workflow', () => {

  test('Step 1: Operator registers driver + truck', async ({ page }) => {
    // 1. Login as operator
    await page.goto('/login')
    await page.fill('#username', 'operator')
    await page.fill('#password', 'operator')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/operator\/dashboard/)

    // 2. Register Driver
    await page.goto('/app/operator/drivers')
    await page.click('button:has-text("Add Driver")')

    const uniqueSuffix = String(Date.now()).slice(-5)
    driverCnic = `35202-${uniqueSuffix}-1`
    const driverName = `Test Driver ${uniqueSuffix}`

    await page.fill('input[name="name"]', driverName)
    await page.fill('input[name="phone"]', '03001234567')
    await page.fill('input[name="cnic"]', driverCnic)
    await page.click('button[type="submit"]:has-text("Add Driver")')

    // Confirm it appears in the list (as pending)
    await expect(page.locator(`tbody tr:has-text("${driverName}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${driverName}")`).locator('text=Pending')).toBeVisible()

    // 3. Register Truck
    await page.goto('/app/operator/trucks')
    await page.click('button:has-text("Add Truck")')

    vehicleNo = `LEZ-${uniqueSuffix}`
    await page.fill('input[name="vehicleNo"]', vehicleNo)
    await page.selectOption('select[name="type"]', { value: 'Damper' })
    await page.selectOption('select[name="wheels"]', { value: '14' })
    await page.selectOption('select[name="ownershipType"]', { value: 'own' })
    await page.click('button[type="submit"]:has-text("Add Truck")')

    // Confirm it appears in the list
    await expect(page.locator(`tbody tr:has-text("${vehicleNo}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${vehicleNo}")`).locator('text=Pending')).toBeVisible()

    // Logout
    await page.goto('/app/profile')
    await page.click('button:has-text("Logout"), button:has-text("Log out")')
  })

  test('Step 2: Admin approves both', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/owner\/dashboard/)

    // 2. Go to Approvals page
    await page.goto('/owner/approvals')

    // Approve Driver
    const driverRow = page.locator(`div.app-card:has-text("${driverCnic}")`)
    await expect(driverRow).toBeVisible()
    await driverRow.locator('button:has-text("Approve")').click()
    
    // Accept confirm modal and wait for backend response
    const driverApprovePromise = page.waitForResponse(r => r.url().includes('/drivers/') && r.url().includes('/approve') && r.status() === 200)
    await page.locator('div.fixed.inset-0.z-50 button').last().click()
    await driverApprovePromise

    // Approve Truck
    await page.click('button:has-text("Trucks Pending")') // switch tab
    const truckRow = page.locator(`div.app-card:has-text("${vehicleNo}")`)
    await expect(truckRow).toBeVisible()
    await truckRow.locator('button:has-text("Approve")').click()
    
    // Accept confirm modal and wait for backend response
    const truckApprovePromise = page.waitForResponse(r => r.url().includes('/trucks/') && r.url().includes('/approve') && r.status() === 200)
    await page.locator('div.fixed.inset-0.z-50 button').last().click()
    await truckApprovePromise

    // Logout
    await page.goto('/owner/profile')
    await page.click('button:has-text("Logout"), button:has-text("Log out")')
  })

  test('Step 3: Operator creates consignment + generates QR', async ({ page }) => {
    // 1. Login as operator
    await page.goto('/login')
    await page.fill('#username', 'operator')
    await page.fill('#password', 'operator')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/operator\/dashboard/)

    // 2. Create consignment
    await page.goto('/app/operator/consignments/create')
    
    // Wait for options and log them
    await page.waitForSelector('select[name="driverId"]')
    const driverOptions = await page.locator('select[name="driverId"] option').allTextContents()
    console.log('Driver Options on Page:', driverOptions)
    console.log('Target Driver Suffix:', driverCnic.split('-')[1])

    const truckOptions = await page.locator('select[name="truckId"] option').allTextContents()
    console.log('Truck Options on Page:', truckOptions)
    console.log('Target Truck:', vehicleNo)

    // Select the approved driver and truck
    await page.selectOption('select[name="driverId"]', { label: `Test Driver ${driverCnic.split('-')[1]}` })
    await page.selectOption('select[name="truckId"]', { label: vehicleNo })
    await page.fill('input[name="netWeight"]', '25.5')
    await page.fill('input[name="destination"]', 'Lahore Terminal')
    await page.fill('input[name="originTerminal"]', 'Hazro Main Gate')
    await page.fill('input[name="notes"]', 'Premium River Sand')

    // Submit
    await page.click('button[type="submit"]:has-text("Generate QR & Create")')

    // Extract QR code value and consignmentId from the UI
    const qrTextContainer = page.locator('p.mt-3.break-all')
    await expect(qrTextContainer).toBeVisible()
    qrCodeValue = (await qrTextContainer.innerText()).trim()

    const idContainer = page.locator('text=/Consignment: \\w+-?\\d*/')
    await expect(idContainer).toBeVisible()
    const textContent = await idContainer.innerText()
    consignmentId = textContent.replace('Consignment: ', '').trim()

    expect(qrCodeValue).not.toBeNull()
    expect(consignmentId).not.toBeNull()

    // Logout
    await page.goto('/app/profile')
    await page.click('button:has-text("Logout"), button:has-text("Log out")')
  })

  test('Step 4: Driver opens QR link → sees countdown', async ({ page }) => {
    // Navigate directly to the driver's QR page with query parameters
    const expiresTimestamp = Date.now() + 5 * 60 * 1000 // 5 minutes in future
    await page.goto(`/driver/qr?session=${qrCodeValue}&expires=${expiresTimestamp}`)

    // Check that countdown timer and active status are visible
    await expect(page.locator('text=/Active/i').first()).toBeVisible()
    await expect(page.locator('text=/expires/i').first()).toBeVisible()
    await expect(page.locator('text=/session/i').first()).toBeVisible()
  })

  test('Step 5: Watchman scans QR → clears gate', async ({ page }) => {
    // 1. Login as watchman
    await page.goto('/login')
    await page.fill('#username', 'watchman')
    await page.fill('#password', 'watchman')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/watchman\/dashboard/)

    // 2. Go to Scanner
    await page.goto('/app/watchman/scan')

    // Enter token manually
    await page.fill('input[data-testid="scanner-input"]', qrCodeValue)
    await page.click('button[data-testid="verify-btn"]')

    // Confirm driver name, truck no, and load weight match
    await expect(page.locator(`text=${vehicleNo}`)).toBeVisible()
    await expect(page.locator('text=25.5 Tons')).toBeVisible()

    // Clear Gate
    await page.click('button[data-testid="clear-gate-btn"]')
    await expect(page.locator('text=GATE CLEARED!')).toBeVisible()

    // Logout
    await page.goto('/app/profile')
    await page.click('button:has-text("Logout"), button:has-text("Log out")')
  })

  test('Step 6: Accountant verifies payment', async ({ page }) => {
    // 1. Login as accountant
    await page.goto('/login')
    await page.fill('#username', 'accountant')
    await page.fill('#password', 'accountant')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/app\/accountant\/dashboard/)

    // 2. Go to Payment Verification Page
    await page.goto('/app/accountant/verification')

    // Find the card for our consignment and click verify
    const paymentCard = page.locator('div.rounded-lg.border').filter({ hasText: consignmentId }).first()
    await expect(paymentCard).toBeVisible()
    await paymentCard.locator('button:has-text("Verify")').click()

    // 3. Go to Ledger and confirm verified
    await page.goto('/app/accountant/ledger')
    const ledgerRow = page.locator('tbody tr').filter({ hasText: consignmentId }).first()
    await expect(ledgerRow).toBeVisible()
    await expect(ledgerRow.locator('span', { hasText: /verified|paid/i })).toBeVisible()

    // Logout
    await page.goto('/app/profile')
    await page.click('button:has-text("Logout"), button:has-text("Log out")')
  })

  test('Step 7: CEO sees full activity log + analytics', async ({ page }) => {
    // 1. Login as admin (CEO)
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/owner\/dashboard/)

    // 2. Verify staff activity log contains the events
    await page.goto('/owner/activity')
    await expect(page.locator(`text=REGISTER_DRIVER`).first()).toBeVisible()
    await expect(page.locator(`text=ADDED_TRUCK`).first()).toBeVisible()

    // 3. Verify Analytics dashboard loads correctly
    await page.goto('/owner/analytics')
    await expect(page.locator('text=Daily Revenue Trend')).toBeVisible()
    await expect(page.locator('text=Payment Methods Split')).toBeVisible()
  })

})
