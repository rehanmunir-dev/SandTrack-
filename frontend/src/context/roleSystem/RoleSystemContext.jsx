import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import {
  getDriversAPI,
  registerDriverAPI,
  approveDriverAPI,
  flagDriverAPI,
  getTrucksAPI,
  registerTruckAPI,
  approveTruckAPI,
  flagTruckAPI,
  getConsignmentsAPI,
  createConsignmentAPI,
  updateConsignmentStatusAPI,
  flagConsignmentAPI,
  verifyQRAPI,
  clearGateAPI,
  markArrivedAPI,
  verifyDeliveryAPI,
  getPaymentsAPI,
  submitPaymentAPI,
  verifyPaymentAPI,
  flagPaymentAPI,
  getExpensesAPI,
  addExpenseAPI,
  deleteExpenseAPI,
  getGateLogsAPI,
  getActivityLogsAPI,
  createGateLogAPI,
  getLedgerEntriesAPI,
  closeConsignmentLedgerAPI,
} from '../../services/api'
import api from '../../services/api'
import { CONSIGNMENT_STATUS, DRIVER_STATUS, PAYMENT_STATUS, QR_STATUS, TRUCK_STATUS } from '../../constants/roleSystemStatus'
import { ROLES } from '../../rbac/roles'

const RoleSystemContext = createContext(null)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POSTGRES RAW DATA NORMALIZATION HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeDriver(d) {
  if (!d) return null
  const isApproved = d.is_approved === true || d.is_approved === 'true' || d.approval_status === 'approved' || d.approvalStatus === 'approved'
  const isActive = d.is_active !== false && d.user_is_active !== false
  return {
    id: d.id,
    userId: d.user_id || d.userId || null,
    name: d.fullName || d.full_name || d.name || 'N/A',
    phone: d.phone || '',
    cnic: d.cnic || '',
    status: isActive ? DRIVER_STATUS.ACTIVE : DRIVER_STATUS.INACTIVE,
    assignedTruckId: d.assigned_truck_id || d.assignedTruckId || null,
    createdAt: d.created_at || d.createdAt || new Date().toISOString(),
    approvalStatus: isApproved ? 'approved' : 'pending',
    isFlagged: Boolean(d.is_flagged || d.isFlagged),
    flagReason: d.flag_reason || d.flagReason || '',
    addedBy: d.added_by || d.addedBy || 'operator',
  }
}

function normalizeTruck(t) {
  if (!t) return null
  const isApproved = t.is_approved === true || t.is_approved === 'true' || t.approval_status === 'approved' || t.approvalStatus === 'approved'
  const status = String(t.status || '').toUpperCase()
  return {
    id: t.id,
    vehicleNo: t.registration_number || t.vehicle_no || t.vehicleNo || 'N/A',
    type: t.vehicle_type || t.type || 'Damper',
    ownershipType: t.ownership_type || t.ownershipType || 'own',
    assignedDriverId: t.assigned_driver_id || t.assignedDriverId || null,
    status: status === 'INACTIVE' ? TRUCK_STATUS.INACTIVE : status === 'MAINTENANCE' ? TRUCK_STATUS.MAINTENANCE : status === 'STANDBY' ? TRUCK_STATUS.STANDBY : TRUCK_STATUS.ACTIVE,
    wheelCount: t.wheel_count || t.wheelCount || 6,
    wheels: t.wheel_count || t.wheels || t.wheelCount || 6,
    createdAt: t.created_at || t.createdAt || new Date().toISOString(),
    approvalStatus: isApproved ? 'approved' : 'pending',
    isFlagged: Boolean(t.is_flagged || t.isFlagged),
    flagReason: t.flag_reason || t.flagReason || '',
    addedBy: t.added_by || t.addedBy || 'operator',
  }
}

function normalizeConsignment(c) {
  if (!c) return null
  const status = c.status || CONSIGNMENT_STATUS.CREATED
  const consId = c.consignment_number || c.receipt_id || c.consignment_id || c.consignmentId || `OP-${c.id}`
  return {
    id: c.id,
    consignmentId: consId,
    receiptId: consId,
    driverId: c.driver_id || c.driverId,
    truckId: c.truck_id || c.truckId,
    netWeight: Number(c.weight_tons || c.net_weight || c.netWeight || 0),
    destination: c.destination || 'N/A',
    originTerminal: c.origin_location || c.origin_terminal || c.originTerminal || 'Hazro Terminal',
    notes: c.notes || '',
    status: status,
    logisticsStatus: status.toLowerCase().replace('_', '-'), // mapped to logistics status badge
    qrCode: c.qr_token || c.qrCode || '',
    qrExpiresAt: c.qr_expires_at || c.qrExpiresAt || null,
    materialType: c.material_type || c.materialType || '',
    driverName: c.driver_name || c.driverName || '',
    truckRegistration: c.truck_registration || c.truckRegistration || '',
    qrStatus: c.qr_token ? QR_STATUS.VALID : QR_STATUS.USED,
    createdAt: c.created_at || c.createdAt || new Date().toISOString(),
    gateVerifiedAt: c.gate_verified_at || c.gateVerifiedAt || null,
    deliveredAt: c.delivered_at || c.deliveredAt || null,
    isFlagged: c.is_flagged || c.isFlagged || false,
    flagReason: c.flag_reason || c.flagReason || '',
    price: Number(c.price || 0),
    discount: Number(c.discount || 0),
  }
}

function normalizePayment(p) {
  if (!p) return null
  const rawStatus = String(p.status || PAYMENT_STATUS.PENDING).toUpperCase()
  const statusMap = {
    PENDING: PAYMENT_STATUS.PENDING,
    VERIFIED: PAYMENT_STATUS.PAID,
    FLAGGED: PAYMENT_STATUS.HELD,
  }
  const status = statusMap[rawStatus] || String(p.status || PAYMENT_STATUS.PENDING).toLowerCase()
  const rawReceiptImage = p.receipt_image_url || p.receipt_image || p.receiptImage || ''
  const apiOrigin = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : window.location.origin
  const receiptImage = rawReceiptImage && rawReceiptImage.startsWith('/uploads/')
    ? `${apiOrigin}${rawReceiptImage}`
    : rawReceiptImage
  return {
    id: p.id,
    consignmentDbId: p.consignment_id || p.consignmentDbId || null,
    consignmentId: p.consignment_number || p.consignmentId || `OP-${p.consignment_id}`,
    amount: Number(p.amount || 0),
    method: p.payment_method || p.method || 'CASH',
    status: status,
    paymentStatus: status,
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    verifiedAt: p.verified_at || p.verifiedAt || null,
    remarks: p.remarks || p.notes || '',
    receiptImage,
  }
}

function normalizeLedgerEntry(entry) {
  if (!entry) return null
  return {
    id: entry.id,
    consignmentId: entry.consignment_id || entry.consignmentId,
    consignmentNumber: entry.consignment_number || entry.consignmentNumber || '',
    paymentId: entry.payment_id || entry.paymentId || null,
    entryType: entry.entry_type || entry.entryType,
    debit: Number(entry.debit || 0),
    credit: Number(entry.credit || 0),
    amount: Number(entry.amount || 0),
    status: entry.status || 'OPEN',
    createdAt: entry.created_at || entry.createdAt,
    verifiedAt: entry.verified_at || entry.verifiedAt,
    notes: entry.notes || '',
  }
}

function normalizeLog(l) {
  if (!l) return null
  return {
    id: l.id,
    timestamp: l.created_at || l.timestamp || new Date().toISOString(),
    actor: l.actor || 'System',
    role: l.role || 'operator',
    action: l.action || 'Event',
    details: l.details || '',
  }
}

export function RoleSystemProvider({ children }) {
  const { currentUser } = useAuth()

  // State
  const [drivers, setDrivers] = useState([])
  const [trucks, setTrucks] = useState([])
  const [consignments, setConsignments] = useState([])
  const [payments, setPayments] = useState([])
  const [scans, setScans] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [ledgerEntries, setLedgerEntries] = useState([])

  // On mount or user change: Fetch all real data from backend
  useEffect(() => {
    if (!currentUser) {
      // Clear all data on logout
      setDrivers([])
      setTrucks([])
      setConsignments([])
      setPayments([])
      setScans([])
      setActivityLogs([])
      setExpenses([])
      return
    }

    const token = localStorage.getItem('sandtrack_token')
    if (!token) return

    fetchDrivers()
    fetchTrucks()
    fetchConsignments()
    fetchPayments()
    fetchActivityLogs()
    fetchScans()
    fetchExpenses()
    fetchLedgerEntries()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    const interval = setInterval(() => {
      fetchDrivers()
      fetchTrucks()
      fetchConsignments()
      fetchPayments()
      fetchScans()
      fetchLedgerEntries()
    }, 25000)

    return () => clearInterval(interval)
  }, [currentUser])

  // Fetch functions
  const fetchDrivers = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) {
      return
    }
    try {
      const res = await getDriversAPI()
      const data = res.data?.data || res.data || []
      setDrivers(data.map(normalizeDriver))
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch drivers:', err)
      }
    }
  }

  const fetchTrucks = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) {
      return
    }
    try {
      const res = await getTrucksAPI()
      const data = res.data?.data || res.data || []
      setTrucks(data.map(normalizeTruck))
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch trucks:', err)
      }
    }
  }

  const fetchConsignments = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) {
      return
    }
    try {
      const res = await getConsignmentsAPI()
      const data = res.data?.data || res.data || []
      setConsignments(data.map(normalizeConsignment))
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch consignments:', err)
      }
    }
  }

  const fetchPayments = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) {
      return
    }
    try {
      const res = await getPaymentsAPI()
      const data = res.data?.data || res.data || []
      setPayments(data.map(normalizePayment))
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch payments:', err)
      }
    }
  }

  const fetchActivityLogs = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) {
      return
    }
    try {
      const res = await getActivityLogsAPI()
      const data = res.data?.data || res.data || []
      setActivityLogs(data.map(normalizeLog))
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch activity logs:', err)
      }
    }
  }

  const fetchScans = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) {
      return
    }
    try {
      const res = await getGateLogsAPI()
      const data = res.data?.data || res.data || []
      setScans(data.map(s => ({
        id: s.id,
        qrCode: s.qr_token_used || s.qrCode || '',
        consignmentId: s.consignment_id || s.consignmentId,
        result: s.scan_result || s.result || 'valid',
        gateName: s.gateName || 'Main Gate',
        actor: s.watchman_name || s.actor || 'Watchman',
        createdAt: s.created_at || s.createdAt || new Date().toISOString()
      })))
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch gate scans:', err)
      }
    }
  }

  const fetchExpenses = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) {
      return
    }
    try {
      const res = await getExpensesAPI()
      const data = res.data?.data || res.data || []
      setExpenses(data)
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch expenses:', err)
      }
    }
  }

  const fetchLedgerEntries = async () => {
    const token = localStorage.getItem('sandtrack_token')
    if (!token) return
    if (![ROLES.ACCOUNTANT, ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUser?.role)) return

    try {
      const res = await getLedgerEntriesAPI()
      const data = res.data?.data || res.data || []
      setLedgerEntries(data.map(normalizeLedgerEntry))
    } catch (err) {
      if (err.response?.status !== 403) {
        console.error('Failed to fetch ledger entries:', err)
      }
    }
  }

  // Summaries
  const operatorSummary = useMemo(() => ({
    consignmentsCreatedToday: consignments.filter((item) => Date.now() - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000).length,
    trucksActive: trucks.filter((item) => item.status === TRUCK_STATUS.ACTIVE).length,
    driversActive: drivers.filter((item) => item.status === DRIVER_STATUS.ACTIVE).length,
    pendingDispatches: consignments.filter((item) => item.status === CONSIGNMENT_STATUS.SCAN_PENDING).length,
  }), [consignments, trucks, drivers])

  const accountantSummary = useMemo(() => ({
    totalRevenue: payments.filter((payment) => payment.status === PAYMENT_STATUS.PAID).reduce((sum, payment) => sum + payment.amount, 0),
    pendingPayments: payments.filter((payment) => payment.status === PAYMENT_STATUS.PENDING).length,
    verifiedPayments: payments.filter((payment) => payment.status === PAYMENT_STATUS.PAID).length,
    flaggedPayments: payments.filter((payment) => payment.status === PAYMENT_STATUS.HELD || payment.status === PAYMENT_STATUS.OVERDUE || payment.status === 'held').length,
  }), [payments])

  const pendingApprovals = useMemo(() => ({
    drivers: drivers.filter((driver) => driver.approvalStatus === 'pending'),
    trucks: trucks.filter((truck) => truck.approvalStatus === 'pending'),
  }), [drivers, trucks])

  // Context Mutating Functions
  const createDriver = async (payload) => {
    let body = payload
    if (!(payload instanceof FormData)) {
      body = new FormData()
      body.append('cnic', payload.cnic || '')
      body.append('fullName', payload.name || payload.fullName || '')
      body.append('phone', payload.phone || '')
      body.append('licenseNumber', payload.licenseNumber || payload.licenseNo || 'LIC-' + String(Date.now()).slice(-6))
      if (payload.facePhoto) {
        body.append('facePhoto', payload.facePhoto)
      }
    }
    const res = await registerDriverAPI(body)
    await fetchDrivers()
    await fetchActivityLogs()
    return res.data?.data || res.data
  }

  const updateDriver = async (driverId, patch) => {
    await api.patch(`/drivers/${driverId}`, {
      fullName: patch.name || patch.fullName,
      phone: patch.phone,
      cnic: patch.cnic,
      licenseNumber: patch.licenseNumber || patch.licenseNo,
      status: patch.status,
    })
    await fetchDrivers()
    await fetchActivityLogs()
  }

  const deleteDriver = async (driverId) => {
    setDrivers((prev) => prev.filter((driver) => driver.id !== driverId))
  }

  const createTruck = async (payload) => {
    const apiPayload = {
      registrationNumber: payload.vehicleNo || payload.registrationNumber || '',
      vehicleType: payload.type || payload.vehicleType || 'Damper',
      wheelCount: Number(payload.wheelCount || payload.wheels || 6),
      ownerName: payload.ownershipType || payload.ownerName || 'own'
    }
    const res = await registerTruckAPI(apiPayload)
    await fetchTrucks()
    await fetchActivityLogs()
    return res.data?.data || res.data
  }

  const updateTruck = async (truckId, patch) => {
    await api.patch(`/trucks/${truckId}`, {
      registrationNumber: patch.vehicleNo || patch.registrationNumber,
      vehicleType: patch.type || patch.vehicleType,
      wheelCount: patch.wheels || patch.wheelCount,
      ownerName: patch.ownershipType || patch.ownerName,
      status: patch.status,
    })
    await fetchTrucks()
    await fetchActivityLogs()
  }

  const deleteTruck = async (truckId) => {
    setTrucks((prev) => prev.filter((truck) => truck.id !== truckId))
  }

  const approveDriver = async (driverId) => {
    await approveDriverAPI(driverId)
    await fetchDrivers()
    await fetchActivityLogs()
  }

  const approveAllPendingDrivers = async () => {
    const pending = drivers.filter(d => d.approvalStatus === 'pending')
    for (const d of pending) {
      await approveDriverAPI(d.id)
    }
    await fetchDrivers()
    await fetchActivityLogs()
  }

  const rejectDriver = async (driverId) => {
    // Treat rejection as removal in static workflow fallback
    setDrivers((prev) => prev.filter((driver) => driver.id !== driverId))
  }

  const approveTruck = async (truckId) => {
    await approveTruckAPI(truckId)
    await fetchTrucks()
    await fetchActivityLogs()
  }

  const approveAllPendingTrucks = async () => {
    const pending = trucks.filter(t => t.approvalStatus === 'pending')
    for (const t of pending) {
      await approveTruckAPI(t.id)
    }
    await fetchTrucks()
    await fetchActivityLogs()
  }

  const rejectTruck = async (truckId) => {
    setTrucks((prev) => prev.filter((truck) => truck.id !== truckId))
  }

  const createConsignment = async (payload) => {
    // Support materialType, originLocation, weightTons, destination
    const apiPayload = {
      driverId: Number(payload.driverId),
      truckId: Number(payload.truckId),
      weightTons: Number(payload.netWeight),
      destination: payload.destination,
      materialType: payload.notes || 'Sand Load',
      originLocation: payload.originTerminal || 'Hazro Terminal',
      price: Number(payload.price || 0),
      discount: Number(payload.discount || 0),
    }
    const res = await createConsignmentAPI(apiPayload)
    const newConsignment = res.data?.data || res.data
    
    // Generate QR automatically
    if (newConsignment?.id) {
      await api.post(`/consignments/${newConsignment.id}/qr`)
    }

    // Fetch fresh lists to ensure we get the generated QR token!
    const freshRes = await getConsignmentsAPI()
    const freshData = freshRes.data?.data || freshRes.data || []
    const mapped = freshData.map(normalizeConsignment)
    setConsignments(mapped)

    await fetchPayments()
    await fetchActivityLogs()

    const updated = mapped.find(c => c.id === newConsignment?.id)
    return updated || normalizeConsignment(newConsignment)
  }

  const scanQrCode = async (qrCode, actor, gateName) => {
    const res = await verifyQRAPI(qrCode)
    const data = res.data
    
    await fetchConsignments()
    await fetchScans()
    await fetchActivityLogs()

    if (!data?.success) {
      return { result: QR_STATUS.INVALID }
    }
    return { result: QR_STATUS.VALID, data }
  }

  const clearGate = async (consignmentId, qrToken) => {
    const res = await clearGateAPI(consignmentId, qrToken)
    await fetchConsignments()
    await fetchScans()
    await fetchActivityLogs()
    return res.data?.data || res.data
  }

  const markDelivered = async (consignmentId) => {
    await updateConsignmentStatusAPI(consignmentId, 'DELIVERED')
    await fetchConsignments()
    await fetchActivityLogs()
  }

  const markArrived = async (consignmentId) => {
    await markArrivedAPI(consignmentId)
    await fetchConsignments()
    await fetchActivityLogs()
  }

  const verifyDelivery = async (consignmentId) => {
    await verifyDeliveryAPI(consignmentId)
    await fetchConsignments()
    await fetchActivityLogs()
  }

  const verifyPayment = async (paymentId) => {
    await verifyPaymentAPI(paymentId)
    await fetchPayments()
    await fetchConsignments()
    await fetchActivityLogs()
  }

  const closeLedger = async (consignmentId) => {
    await closeConsignmentLedgerAPI(consignmentId)
    await fetchLedgerEntries()
    await fetchPayments()
    await fetchConsignments()
    await fetchActivityLogs()
  }

  const flagPayment = async (paymentId, notes) => {
    await flagPaymentAPI(paymentId, notes || 'Flagged by accountant')
    await fetchPayments()
    await fetchActivityLogs()
  }

  const flagConsignment = async (consignmentId, reason) => {
    await flagConsignmentAPI(consignmentId, reason)
    await fetchConsignments()
    await fetchActivityLogs()
  }

  const flagDriver = async (driverId, reason) => {
    await flagDriverAPI(driverId, reason)
    await fetchDrivers()
    await fetchActivityLogs()
  }

  const flagTruck = async (truckId, reason) => {
    await flagTruckAPI(truckId, reason)
    await fetchTrucks()
    await fetchActivityLogs()
  }

  const updatePaymentDetails = async (paymentId, patch) => {
    const statusMap = {
      [PAYMENT_STATUS.PENDING]: 'PENDING',
      [PAYMENT_STATUS.PAID]: 'VERIFIED',
      [PAYMENT_STATUS.HELD]: 'FLAGGED',
      [PAYMENT_STATUS.OVERDUE]: 'FLAGGED',
    }

    const methodMap = {
      Cash: 'CASH',
      'Bank Account': 'BANK',
      'Online Transfer': 'BANK',
      Cheque: 'BANK',
    }

    await api.put(`/payments/${paymentId}`, {
      ...patch,
      method: methodMap[patch.method] || patch.method || 'CASH',
      status: statusMap[patch.status] || patch.status || 'PENDING',
    })
    await fetchPayments()
    await fetchConsignments()
    await fetchLedgerEntries()
    await fetchActivityLogs()
  }

  const value = {
    drivers,
    trucks,
    consignments,
    payments,
    scans,
    activityLogs,
    expenses,
    ledgerEntries,
    operatorSummary,
    accountantSummary,
    pendingApprovals,
    createDriver,
    updateDriver,
    deleteDriver,
    createTruck,
    updateTruck,
    deleteTruck,
    approveDriver,
    approveAllPendingDrivers,
    rejectDriver,
    approveTruck,
    approveAllPendingTrucks,
    rejectTruck,
    createConsignment,
    scanQrCode,
    clearGate,
    markDelivered,
    markArrived,
    verifyDelivery,
    verifyPayment,
    flagPayment,
    flagConsignment,
    flagDriver,
    flagTruck,
    updatePaymentDetails,
    closeLedger,
    fetchExpenses,
    fetchPayments,
    fetchConsignments,
    fetchDrivers,
    fetchTrucks,
    fetchActivityLogs,
    fetchLedgerEntries,
  }

  return <RoleSystemContext.Provider value={value}>{children}</RoleSystemContext.Provider>
}

export function useRoleSystem() {
  const context = useContext(RoleSystemContext)
  if (!context) {
    throw new Error('useRoleSystem must be used inside RoleSystemProvider')
  }
  return context
}
