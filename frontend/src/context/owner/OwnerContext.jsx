import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ALERT_REVIEW_STATE } from '../../constants/owner/status'
import { ROLE_DEFAULT_FEATURES } from '../../constants/owner/features'
import { useAuth } from '../AuthContext'
import { loadUserDirectory, saveUserDirectory } from '../sessionStorage'
import { PERMISSIONS } from '../../rbac/permissions'
import api from '../../services/api'

const OwnerContext = createContext(null)

function mapBackendUserToOwner(user) {
  const profile = user.profile || {}
  let mappedRole = user.role
  if (mappedRole === 'OPERATOR') {
    mappedRole = 'TERMINAL_OPERATOR'
  }

  return {
    id: user.id,
    name: profile.name || user.full_name || user.fullName || user.username,
    username: user.username,
    phone: profile.phone || user.phone || '',
    role: mappedRole,
    assignedTerminalId: user.site_id || '',
    status: user.is_active ? 'active' : 'inactive',
    featureAccess: ROLE_DEFAULT_FEATURES[mappedRole] || [],
    isActive: Boolean(user.is_active),
    createdAt: user.created_at,
    lastLoginAt: user.created_at,
    cnic: profile.cnic || '',
  }
}

const FEATURE_TO_PERMISSION_KEYS = {
  dashboard: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.OPERATOR_DASHBOARD_VIEW, PERMISSIONS.DRIVER_DASHBOARD_VIEW, PERMISSIONS.WATCHMAN_DASHBOARD_VIEW, PERMISSIONS.ACCOUNTANT_DASHBOARD_VIEW],
  consignments: [PERMISSIONS.CONSIGNMENT_READ, PERMISSIONS.CONSIGNMENT_CREATE],
  consignment_detail: [PERMISSIONS.CONSIGNMENT_READ],
  alerts: [PERMISSIONS.ALERTS_VIEW],
  terminal: [PERMISSIONS.TRACKING_VIEW, PERMISSIONS.GATE_SCAN],
  users: [PERMISSIONS.USERS_MANAGE],
  trucks: [PERMISSIONS.OPERATOR_TRUCK_MANAGE],
  global_search: [PERMISSIONS.CONSIGNMENT_READ],
}

function buildPermissionObjectFromFeatureAccess(featureAccess = []) {
  const allPermissions = [...new Set(Object.values(FEATURE_TO_PERMISSION_KEYS).flat())]
  const enabled = new Set(
    featureAccess.flatMap((featureKey) => FEATURE_TO_PERMISSION_KEYS[featureKey] || []),
  )

  return allPermissions.reduce((acc, permission) => {
    acc[permission] = enabled.has(permission)
    return acc
  }, {})
}

function mapBackendConsignmentToOwner(c, payment = null) {
  const status = c.status || 'PENDING'
  const logStatus = status.toLowerCase().replaceAll('_', '-')
  const paymentStatus = String(payment?.status || c.payment_status || 'pending').toLowerCase()
  const paymentAmount = Number(payment?.amount || c.payment_amount || 0)
  return {
    id: c.id,
    receiptId: c.consignment_number || `ST-${c.id}`,
    vehicleNo: c.truck_registration || 'N/A',
    driverName: c.driver_name || 'N/A',
    route: `${c.origin_location || 'Hazro'} -> ${c.destination || 'Islamabad'}`,
    sourceMine: c.material_type || 'Ghazi Mine-01',
    destination: c.destination || 'Islamabad',
    weightTons: Number(c.weight_tons || 0),
    terminalId: 't-hazro-main',
    logisticsStatus: logStatus,
    paymentId: payment?.id || null,
    paymentMethod: payment?.payment_method || payment?.method || 'CASH',
    paymentAmount,
    amount: paymentAmount,
    paymentStatus,
    paymentVerifiedAt: payment?.verified_at || null,
    flagged: Boolean(c.is_flagged),
    createdAt: c.created_at || new Date().toISOString(),
    updatedAt: c.updated_at || c.created_at || new Date().toISOString(),
    timeline: [
      { key: 'loaded', title: 'Loaded at Terminal', at: c.created_at, actor: c.operator_name || 'Operator' }
    ],
    evidencePhotos: [],
    activity: []
  }
}

function mapBackendTruckToOwner(t) {
  const isApproved = t.is_approved === true || t.is_approved === 'true' || t.approval_status === 'approved' || t.approvalStatus === 'approved'
  return {
    id: t.id,
    vehicleNo: t.registration_number || 'N/A',
    ownershipType: t.ownership_type || 'own',
    assignedTerminalId: 't-hazro-main',
    driverName: t.driver_name || 'N/A',
    logisticsStatus: isApproved ? 'approved' : 'pending',
    lastSeenAt: t.updated_at || new Date().toISOString()
  }
}

function mapBackendDriverToOwner(d) {
  return {
    id: d.id,
    fullName: d.driver_name || d.full_name || d.fullName || d.name || 'N/A',
    phone: d.phone || '',
    cnic: d.cnic || '',
    licenseNo: d.license_number || d.license_no || '',
    assignedTruckId: d.assigned_truck_id || null,
    assignedTerminalId: 't-hazro-main',
    createdAt: d.created_at || new Date().toISOString()
  }
}

function mapBackendPaymentToOwner(p) {
  const rawStatus = String(p.status || 'PENDING').toUpperCase()
  const statusMap = {
    VERIFIED: 'paid',
    PENDING: 'pending',
    FLAGGED: 'held',
  }
  const status = statusMap[rawStatus] || String(p.status || 'pending').toLowerCase()
  return {
    id: p.id,
    consignmentId: p.consignment_id || p.consignmentId,
    consignmentNumber: p.consignment_number || '',
    amount: Number(p.amount || 0),
    method: p.payment_method || p.method || 'CASH',
    status,
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    verifiedAt: p.verified_at || p.verifiedAt || null,
  }
}

function buildPercentSeries(values) {
  const max = Math.max(...values, 0)
  if (max === 0) {
    return values.map(() => 0)
  }
  return values.map((value) => Math.max(8, Math.round((value / max) * 100)))
}

export function OwnerProvider({ children }) {
  const { session } = useAuth()
  const [users, setUsers] = useState([])
  const [consignments, setConsignments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [terminals, setTerminals] = useState([])
  const [trucks, setTrucks] = useState([])
  const [driverProfiles, setDriverProfiles] = useState([])
  const [payments, setPayments] = useState([])
  const [liveOperations, setLiveOperations] = useState([])
  const [selectedAlertId, setSelectedAlertId] = useState(null)
  const [selectedTerminalId, setSelectedTerminalId] = useState(null)

  useEffect(() => {
    if (!session) {
      // Clear all data on logout
      setUsers([])
      setConsignments([])
      setAlerts([])
      setTerminals([])
      setTrucks([])
      setDriverProfiles([])
      setPayments([])
      setLiveOperations([])
      return
    }

    const token = localStorage.getItem('sandtrack_token')
    if (!token) return

    async function loadAllRemoteData() {
      try {
        const [usersRes, consRes, trucksRes, driversRes, paymentsRes] = await Promise.all([
          api.get('/users'),
          api.get('/consignments'),
          api.get('/trucks'),
          api.get('/drivers'),
          api.get('/payments')
        ])

        const usersData = usersRes.data?.data || usersRes.data || []
        if (Array.isArray(usersData)) {
          setUsers(usersData.map(mapBackendUserToOwner))
        }

        const consData = consRes.data?.data || consRes.data || []

        const trucksData = trucksRes.data?.data || trucksRes.data || []
        const driversData = driversRes.data?.data || driversRes.data || []
        const latestTruckByDriverId = new Map()
        const latestDriverNameByTruckId = new Map()

        if (Array.isArray(consData)) {
          consData.forEach((consignment) => {
            if (!consignment.driver_id || !consignment.truck_id) {
              return
            }

            latestTruckByDriverId.set(String(consignment.driver_id), consignment.truck_id)
            if (consignment.driver_name) {
              latestDriverNameByTruckId.set(String(consignment.truck_id), consignment.driver_name)
            }
          })
        }

        if (Array.isArray(trucksData)) {
          setTrucks(trucksData.map((truck) => {
            const mappedTruck = mapBackendTruckToOwner(truck)
            return {
              ...mappedTruck,
              driverName: latestDriverNameByTruckId.get(String(truck.id)) || mappedTruck.driverName
            }
          }))
        }

        if (Array.isArray(driversData)) {
          setDriverProfiles(driversData.map((driver) => {
            const mappedDriver = mapBackendDriverToOwner(driver)
            return {
              ...mappedDriver,
              assignedTruckId: mappedDriver.assignedTruckId || latestTruckByDriverId.get(String(driver.id)) || null
            }
          }))
        }

        const paymentsData = paymentsRes.data?.data || paymentsRes.data || []
        const paymentsByConsignmentId = new Map()
        if (Array.isArray(paymentsData)) {
          paymentsData.forEach((payment) => {
            paymentsByConsignmentId.set(String(payment.consignment_id || payment.consignmentId), payment)
          })
          setPayments(paymentsData.map(mapBackendPaymentToOwner))
        }

        if (Array.isArray(consData)) {
          setConsignments(consData.map((consignment) =>
            mapBackendConsignmentToOwner(
              consignment,
              paymentsByConsignmentId.get(String(consignment.id))
            )
          ))
        }
      } catch (err) {
        console.error('Failed to load owner remote data:', err)
      }
    }

    loadAllRemoteData()
    const interval = setInterval(loadAllRemoteData, 15000)
    return () => clearInterval(interval)
  }, [session])

  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) || null,
    [alerts, selectedAlertId],
  )

  const selectedTerminal = useMemo(
    () => terminals.find((terminal) => terminal.id === selectedTerminalId) || null,
    [terminals, selectedTerminalId],
  )

  const dashboardStats = useMemo(() => {
    const loadedToday = consignments.filter((item) => item.logisticsStatus === 'scan-pending').length
    const onWay = consignments.filter((item) => item.logisticsStatus === 'in-transit').length
    const delivered = consignments.filter((item) => item.logisticsStatus === 'delivered').length

    let revenue = 0
    let pendingReceivables = 0
    payments.forEach((item) => {
      if (item.status === 'verified' || item.status === 'paid') {
        revenue += item.amount
      }
      if (item.status === 'pending') {
        pendingReceivables += item.amount
      }
    })

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && a.reviewState !== 'resolved' && a.reviewState !== 'dismissed').length
    const delayedTrips = consignments.filter((item) => item.logisticsStatus === 'delayed').length

    return {
      loadedToday,
      onWay,
      delivered,
      revenue,
      pendingReceivables,
      criticalAlerts,
      delayedTrips,
    }
  }, [alerts, consignments, payments])

  const routeMonitoring = useMemo(() => {
    const routeMap = new Map()
    consignments.forEach((item) => {
      const routeKey = item.route || `${item.sourceMine || 'Terminal'} -> ${item.destination || 'Destination'}`
      const existing = routeMap.get(routeKey) || {
        id: routeKey,
        name: routeKey,
        status: 'active',
        activeCount: 0,
        deliveredCount: 0,
        truckIds: new Set(),
      }

      if (item.logisticsStatus === 'delivered') {
        existing.deliveredCount += 1
      }

      if (item.logisticsStatus === 'scan-pending' || item.logisticsStatus === 'in-transit' || item.logisticsStatus === 'gate-cleared') {
        existing.activeCount += 1
        if (item.vehicleNo && item.vehicleNo !== 'N/A') {
          existing.truckIds.add(item.vehicleNo)
        }
      }

      existing.status = existing.activeCount > 0 ? 'active' : item.logisticsStatus
      routeMap.set(routeKey, existing)
    })

    return Array.from(routeMap.values()).map((route) => ({
      ...route,
      activeCount: route.truckIds.size || route.activeCount,
      truckIds: undefined,
    }))
  }, [consignments])

  const trendSeries = useMemo(() => {
    const buckets = Array.from({ length: 7 }, () => 0)
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    consignments.forEach((item) => {
      const createdAt = new Date(item.createdAt)
      if (Number.isNaN(createdAt.getTime())) return
      const diffDays = Math.floor((start.getTime() - new Date(createdAt.setHours(0, 0, 0, 0)).getTime()) / (24 * 60 * 60 * 1000))
      const index = 6 - diffDays
      if (index >= 0 && index < buckets.length) {
        buckets[index] += 1
      }
    })

    return buildPercentSeries(buckets)
  }, [consignments])

  async function addUser(payload) {
    const res = await api.post('/users', {
      username: payload.username,
      password: payload.password,
      role: payload.role === 'TERMINAL_OPERATOR' ? 'OPERATOR' : payload.role,
      fullName: payload.name || payload.fullName,
      phone: payload.phone || '',
      email: payload.email || '',
      cnic: payload.cnic || '',
      permissions: buildPermissionObjectFromFeatureAccess(payload.featureAccess || []),
    })

    const result = res.data
    const backendUser = result?.data || result || {}

    const user = {
      id: backendUser.id || `u-${Date.now()}`,
      username: payload.username.trim().toLowerCase(),
      name: payload.name,
      phone: payload.phone || '',
      role: payload.role,
      assignedTerminalId: payload.assignedTerminalId || '',
      status: payload.status || 'active',
      lastLoginAt: new Date().toISOString(),
      featureAccess: payload.featureAccess || ROLE_DEFAULT_FEATURES[payload.role] || [],
      isActive: true,
      password: payload.password,
    }

    setUsers((prev) => [user, ...prev])

    const sharedDirectory = loadUserDirectory() || []
    const updatedDirectory = [user, ...sharedDirectory]
    saveUserDirectory(updatedDirectory)

    return user
  }

  function addTerminal(payload) {
    const terminal = {
      id: `t-${Date.now()}`,
      status: 'operational',
      utilizationPercent: 0,
      activeVehicles: 0,
      activeOperators: 0,
      activeSecurity: 0,
      gates: { mainGateOpen: true, cameraOnline: true, qrScannerOnline: true },
      ...payload,
    }

    setTerminals((prev) => [terminal, ...prev])
    return terminal
  }

  function deleteTerminal(terminalId) {
    setTerminals((prev) => prev.filter((terminal) => terminal.id !== terminalId))

    setLiveOperations((prev) => prev.filter((operation) => operation.terminalId !== terminalId))

    setUsers((prev) =>
      prev.map((user) =>
        user.assignedTerminalId === terminalId
          ? {
              ...user,
              assignedTerminalId: null,
            }
          : user,
      ),
    )

    setConsignments((prev) =>
      prev.map((consignment) =>
        consignment.terminalId === terminalId
          ? {
              ...consignment,
              terminalId: null,
            }
          : consignment,
      ),
    )

    setTrucks((prev) =>
      prev.map((truck) =>
        truck.assignedTerminalId === terminalId
          ? {
              ...truck,
              assignedTerminalId: null,
            }
          : truck,
      ),
    )

    setDriverProfiles((prev) =>
      prev.map((profile) =>
        profile.assignedTerminalId === terminalId
          ? {
              ...profile,
              assignedTerminalId: null,
            }
          : profile,
      ),
    )

    setSelectedTerminalId((prev) => (prev === terminalId ? null : prev))
  }

  function addDriverProfile(payload) {
    const profile = {
      id: `drv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload,
    }

    setDriverProfiles((prev) => [profile, ...prev])

    setTrucks((prev) =>
      prev.map((truck) =>
        truck.id === payload.assignedTruckId
          ? {
              ...truck,
              driverName: payload.fullName,
              driverProfileId: profile.id,
            }
          : truck,
      ),
    )

    return profile
  }

  function addTruck(payload) {
    const truck = {
      id: `trk-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      driverName: null,
      driverProfileId: null,
      ...payload,
    }

    setTrucks((prev) => [truck, ...prev])
    return truck
  }

  function updateTruck(truckId, patch) {
    setTrucks((prev) =>
      prev.map((truck) =>
        truck.id === truckId
          ? {
              ...truck,
              ...patch,
            }
          : truck,
      ),
    )
  }

  function deleteTruck(truckId) {
    setTrucks((prev) => prev.filter((truck) => truck.id !== truckId))

    setDriverProfiles((prev) =>
      prev.map((profile) =>
        profile.assignedTruckId === truckId
          ? {
              ...profile,
              assignedTruckId: null,
            }
          : profile,
      ),
    )
  }

  function updateDriverProfile(profileId, patch) {
    let previousTruckId = null
    let nextTruckId = null
    let nextDriverName = ''

    setDriverProfiles((prev) => {
      const existing = prev.find((profile) => profile.id === profileId)
      previousTruckId = existing?.assignedTruckId || null

      const updated = prev.map((profile) => {
        if (profile.id !== profileId) {
          return profile
        }

        const nextProfile = {
          ...profile,
          ...patch,
        }

        nextTruckId = nextProfile.assignedTruckId || null
        nextDriverName = nextProfile.fullName || profile.fullName
        return nextProfile
      })

      return updated
    })

    setTrucks((prev) =>
      prev.map((truck) => {
        if (previousTruckId && truck.id === previousTruckId && previousTruckId !== nextTruckId) {
          return {
            ...truck,
            driverProfileId: null,
          }
        }

        if (nextTruckId && truck.id === nextTruckId) {
          return {
            ...truck,
            driverProfileId: profileId,
            driverName: nextDriverName || truck.driverName,
          }
        }

        return truck
      }),
    )
  }

  function deleteDriverProfile(profileId) {
    let removedTruckId = null

    setDriverProfiles((prev) => {
      const target = prev.find((profile) => profile.id === profileId)
      removedTruckId = target?.assignedTruckId || null
      return prev.filter((profile) => profile.id !== profileId)
    })

    if (removedTruckId) {
      setTrucks((prev) =>
        prev.map((truck) =>
          truck.id === removedTruckId
            ? {
                ...truck,
                driverProfileId: null,
              }
            : truck,
        ),
      )
    }
  }

  async function updateUser(userId, patch) {
    if (patch.status !== undefined) {
      await api.patch(`/users/${userId}/status`, {
        isActive: patch.status === 'active'
      })
    }

    let updatedUser = null
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          updatedUser = { ...user, ...patch }
          return updatedUser
        }
        return user
      }),
    )

    if (updatedUser) {
      const sharedDirectory = loadUserDirectory() || []
      const updatedDirectory = sharedDirectory.map((user) =>
        user.id === userId ? updatedUser : user,
      )
      saveUserDirectory(updatedDirectory)
    }
  }

  function setAlertAction(alertId, actorName, actionType) {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id !== alertId) {
          return alert
        }

        const actionMap = {
          dispatch_security: {
            reviewState: ALERT_REVIEW_STATE.IN_REVIEW,
            action: 'Dispatch Security triggered',
          },
          escalate_incident: {
            reviewState: ALERT_REVIEW_STATE.IN_REVIEW,
            action: 'Escalated incident',
          },
          clear_false_alarm: {
            reviewState: ALERT_REVIEW_STATE.DISMISSED,
            action: 'Marked as false alarm',
          },
          resolve: {
            reviewState: ALERT_REVIEW_STATE.RESOLVED,
            action: 'Alert resolved',
          },
        }

        const mapped = actionMap[actionType] || actionMap.escalate_incident

        return {
          ...alert,
          isRead: true,
          reviewState: mapped.reviewState,
          actions: [
            {
              at: new Date().toISOString(),
              by: actorName,
              action: mapped.action,
            },
            ...(alert.actions || []),
          ],
        }
      }),
    )
  }

  function markAlertRead(alertId) {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)))
  }

  function toggleTerminalControl(terminalId, key) {
    setTerminals((prev) =>
      prev.map((terminal) => {
        if (terminal.id !== terminalId) {
          return terminal
        }

        return {
          ...terminal,
          gates: {
            ...terminal.gates,
            [key]: !terminal.gates[key],
          },
        }
      }),
    )
  }

  function triggerEmergencyMode(terminalId) {
    setTerminals((prev) =>
      prev.map((terminal) => {
        if (terminal.id !== terminalId) {
          return terminal
        }
        return {
          ...terminal,
          status: terminal.status === 'caution' ? 'operational' : 'caution',
        }
      }),
    )

    setLiveOperations((prev) =>
      prev.map((operation) => {
        if (operation.terminalId !== terminalId) {
          return operation
        }
        return {
          ...operation,
          progress: Math.max(15, operation.progress - 10),
        }
      }),
    )
  }

  const value = {
    users,
    consignments,
    trucks,
    driverProfiles,
    payments,
    alerts,
    terminals,
    liveOperations,
    selectedAlert,
    selectedAlertId,
    selectedTerminal,
    selectedTerminalId,
    dashboardStats,
    routeMonitoring,
    trendSeries,
    setSelectedAlertId,
    setSelectedTerminalId,
    setAlertAction,
    markAlertRead,
    addUser,
    addTerminal,
    deleteTerminal,
    addDriverProfile,
    addTruck,
    updateUser,
    updateTruck,
    deleteTruck,
    updateDriverProfile,
    deleteDriverProfile,
    toggleTerminalControl,
    triggerEmergencyMode,
  }

  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>
}

export function useOwnerData() {
  const context = useContext(OwnerContext)
  if (!context) {
    throw new Error('useOwnerData must be used inside OwnerProvider')
  }
  return context
}
