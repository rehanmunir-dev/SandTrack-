import {
  createContext,
  useContext,
  useMemo,
  useReducer,
} from 'react'
import {
  ALERT_STATUSES,
  CONSIGNMENT_STATUSES,
  CONSIGNMENT_TRANSITIONS,
  PAYMENT_STATUSES,
} from '../constants/statusModels'

const AppStateContext = createContext(null)

const initialState = {
  consignments: [],
  payments: [],
  alerts: [],
  auditLogs: [],
  scanHistory: [],
  filters: {
    consignments: {
      tab: 'active',
      search: '',
      terminal: 'ALL',
    },
    ledger: {
      status: 'ALL',
      method: 'ALL',
      fromDate: '',
      toDate: '',
    },
  },
  selectedConsignmentId: null,
  selectedPaymentId: null,
  dashboardRefreshAt: new Date().toISOString(),
}

function canTransition(currentStatus, nextStatus) {
  const allowedTargets = CONSIGNMENT_TRANSITIONS[currentStatus] || []
  return allowedTargets.includes(nextStatus)
}

function pushAuditLog(state, actor, action, entityType, entityId, detail, location = null) {
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    actor,
    action,
    entityType,
    entityId,
    detail,
    location,
    createdAt: new Date().toISOString(),
  }

  return [log, ...state.auditLogs]
}

function createAlert(state, payload) {
  const alert = {
    id: `al-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    ...payload,
  }

  return [alert, ...state.alerts]
}

function formatDistance(a, b) {
  const latDiff = Math.abs(a.lat - b.lat)
  const lngDiff = Math.abs(a.lng - b.lng)
  return Math.sqrt(latDiff ** 2 + lngDiff ** 2)
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER': {
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.scope]: {
            ...state.filters[action.payload.scope],
            ...action.payload.patch,
          },
        },
      }
    }

    case 'SELECT_CONSIGNMENT': {
      return {
        ...state,
        selectedConsignmentId: action.payload,
      }
    }

    case 'SELECT_PAYMENT': {
      return {
        ...state,
        selectedPaymentId: action.payload,
      }
    }

    case 'CREATE_CONSIGNMENT': {
      const createdAt = new Date().toISOString()
      const consignment = {
        id: `con-${Date.now()}`,
        receiptId: action.payload.receiptId,
        terminal: action.payload.terminal,
        vehicleNo: action.payload.vehicleNo,
        driverName: action.payload.driverName,
        destination: action.payload.destination,
        sourceMine: action.payload.sourceMine,
        status: CONSIGNMENT_STATUSES.CREATED,
        paymentStatus: PAYMENT_STATUSES.NOT_SUBMITTED,
        amountDue: Number(action.payload.amountDue || 0),
        sourceWeight: Number(action.payload.sourceWeight || 0),
        destinationWeight: null,
        qrCode: `QR-${action.payload.receiptId}`,
        evidencePhotos: [],
        routePoints: [],
        expectedCorridor: {
          lat: Number(action.payload.corridorLat || 33.9),
          lng: Number(action.payload.corridorLng || 72.5),
          tolerance: Number(action.payload.corridorTolerance || 0.08),
        },
        timeline: [
          {
            status: CONSIGNMENT_STATUSES.CREATED,
            at: createdAt,
            actor: action.payload.actor,
          },
        ],
      }

      return {
        ...state,
        consignments: [consignment, ...state.consignments],
        selectedConsignmentId: consignment.id,
        dashboardRefreshAt: createdAt,
        auditLogs: pushAuditLog(
          state,
          action.payload.actor,
          'consignment.created',
          'consignment',
          consignment.id,
          `Created ${consignment.receiptId}`,
          consignment.terminal,
        ),
      }
    }

    case 'ASSIGN_CONSIGNMENT': {
      const { consignmentId, vehicleNo, driverName, actor } = action.payload
      const updatedConsignments = state.consignments.map((item) => {
        if (item.id !== consignmentId) {
          return item
        }

        return {
          ...item,
          vehicleNo: vehicleNo || item.vehicleNo,
          driverName: driverName || item.driverName,
        }
      })

      return {
        ...state,
        consignments: updatedConsignments,
        auditLogs: pushAuditLog(
          state,
          actor,
          'consignment.assigned',
          'consignment',
          consignmentId,
          'Vehicle and driver assignment updated.',
        ),
      }
    }

    case 'TRANSITION_CONSIGNMENT': {
      const { consignmentId, nextStatus, actor } = action.payload
      let blockedReason = ''

      const updatedConsignments = state.consignments.map((item) => {
        if (item.id !== consignmentId) {
          return item
        }

        if (!canTransition(item.status, nextStatus)) {
          blockedReason = `Invalid transition from ${item.status} to ${nextStatus}`
          return item
        }

        if (
          nextStatus === CONSIGNMENT_STATUSES.CLOSED &&
          item.paymentStatus !== PAYMENT_STATUSES.VERIFIED
        ) {
          blockedReason = 'Cannot close consignment before payment is verified.'
          return item
        }

        return {
          ...item,
          status: nextStatus,
          timeline: [
            ...item.timeline,
            {
              status: nextStatus,
              at: new Date().toISOString(),
              actor,
            },
          ],
        }
      })

      if (blockedReason) {
        return {
          ...state,
          alerts: createAlert(state, {
            severity: ALERT_STATUSES.WARNING,
            title: 'Transition Blocked',
            message: blockedReason,
            status: 'OPEN',
          }),
          auditLogs: pushAuditLog(
            state,
            actor,
            'consignment.transition.blocked',
            'consignment',
            consignmentId,
            blockedReason,
          ),
        }
      }

      return {
        ...state,
        consignments: updatedConsignments,
        dashboardRefreshAt: new Date().toISOString(),
        auditLogs: pushAuditLog(
          state,
          actor,
          'consignment.transition',
          'consignment',
          consignmentId,
          `Transitioned to ${nextStatus}`,
        ),
      }
    }

    case 'SUBMIT_PAYMENT': {
      const payload = action.payload
      const createdAt = new Date().toISOString()
      const payment = {
        id: `pay-${Date.now()}`,
        consignmentId: payload.consignmentId,
        amountEntered: Number(payload.amountEntered),
        expectedAmount: Number(payload.expectedAmount),
        ocrAmount: Number(payload.ocrAmount),
        payerName: payload.payerName,
        method: payload.method,
        receiptFileName: payload.receiptFileName,
        status: PAYMENT_STATUSES.PENDING_VERIFICATION,
        remarks: '',
        createdAt,
      }

      const discrepancy = Math.abs(payment.ocrAmount - payment.expectedAmount)
      const shouldFlag = discrepancy > Number(payload.tolerance || 0)

      const updatedConsignments = state.consignments.map((item) =>
        item.id === payload.consignmentId
          ? {
              ...item,
              paymentStatus: shouldFlag
                ? PAYMENT_STATUSES.FLAGGED
                : PAYMENT_STATUSES.PENDING_VERIFICATION,
            }
          : item,
      )

      let nextAlerts = state.alerts
      if (shouldFlag) {
        nextAlerts = createAlert(state, {
          severity: ALERT_STATUSES.CRITICAL,
          title: 'Payment OCR Mismatch',
          message: `Payment mismatch detected for consignment ${payload.receiptId}.`,
          consignmentId: payload.consignmentId,
          status: 'OPEN',
        })
      }

      return {
        ...state,
        payments: [
          {
            ...payment,
            status: shouldFlag
              ? PAYMENT_STATUSES.FLAGGED
              : PAYMENT_STATUSES.PENDING_VERIFICATION,
          },
          ...state.payments,
        ],
        selectedPaymentId: payment.id,
        consignments: updatedConsignments,
        alerts: nextAlerts,
        dashboardRefreshAt: createdAt,
        auditLogs: pushAuditLog(
          state,
          payload.actor,
          'payment.submitted',
          'payment',
          payment.id,
          `Submitted payment for ${payload.receiptId}`,
        ),
      }
    }

    case 'VERIFY_PAYMENT': {
      const { paymentId, decision, remarks, actor } = action.payload
      let targetConsignmentId = null

      const updatedPayments = state.payments.map((payment) => {
        if (payment.id !== paymentId) {
          return payment
        }

        targetConsignmentId = payment.consignmentId

        return {
          ...payment,
          status: decision,
          remarks: remarks || payment.remarks,
        }
      })

      if (!targetConsignmentId) {
        return state
      }

      const updatedConsignments = state.consignments.map((consignment) => {
        if (consignment.id !== targetConsignmentId) {
          return consignment
        }

        return {
          ...consignment,
          paymentStatus:
            decision === PAYMENT_STATUSES.VERIFIED
              ? PAYMENT_STATUSES.VERIFIED
              : decision,
        }
      })

      return {
        ...state,
        payments: updatedPayments,
        consignments: updatedConsignments,
        dashboardRefreshAt: new Date().toISOString(),
        auditLogs: pushAuditLog(
          state,
          actor,
          'payment.verified',
          'payment',
          paymentId,
          `Decision: ${decision}`,
        ),
      }
    }

    case 'SCAN_GATE_QR': {
      const { qrCode, actor, gateName } = action.payload
      const now = new Date().toISOString()
      const matchedConsignment = state.consignments.find(
        (consignment) => consignment.qrCode === qrCode,
      )

      const duplicateScan = state.scanHistory.some(
        (entry) => entry.qrCode === qrCode && Date.now() - entry.atMs < 2 * 60 * 1000,
      )

      const scanEntry = {
        id: `scan-${Date.now()}`,
        qrCode,
        actor,
        gateName,
        at: now,
        atMs: Date.now(),
        result: 'INVALID',
        consignmentId: matchedConsignment?.id || null,
        reason: null,
      }

      let alerts = state.alerts
      let consignments = state.consignments
      let auditLogs = state.auditLogs

      if (!matchedConsignment) {
        alerts = createAlert(state, {
          severity: ALERT_STATUSES.CRITICAL,
          title: 'Invalid QR Scan',
          message: `Unknown QR scanned at ${gateName}.`,
          status: 'OPEN',
        })

        auditLogs = pushAuditLog(
          state,
          actor,
          'gate.scan.invalid',
          'gate',
          scanEntry.id,
          'Unknown QR payload.',
          gateName,
        )

        return {
          ...state,
          alerts,
          auditLogs,
          scanHistory: [{ ...scanEntry, result: 'INVALID', reason: 'Unknown QR' }, ...state.scanHistory],
        }
      }

      if (duplicateScan) {
        alerts = createAlert(state, {
          severity: ALERT_STATUSES.CRITICAL,
          title: 'Duplicate QR Detection',
          message: `${matchedConsignment.receiptId} was scanned repeatedly at gate.`,
          consignmentId: matchedConsignment.id,
          status: 'OPEN',
        })

        auditLogs = pushAuditLog(
          state,
          actor,
          'gate.scan.duplicate',
          'consignment',
          matchedConsignment.id,
          'Duplicate QR scan detected.',
          gateName,
        )

        return {
          ...state,
          alerts,
          auditLogs,
          scanHistory: [
            { ...scanEntry, result: 'FLAGGED', consignmentId: matchedConsignment.id, reason: 'Duplicate scan' },
            ...state.scanHistory,
          ],
        }
      }

      if (matchedConsignment.status !== CONSIGNMENT_STATUSES.AT_GATE) {
        alerts = createAlert(state, {
          severity: ALERT_STATUSES.CRITICAL,
          title: 'Unauthorized Exit Detection',
          message: `${matchedConsignment.receiptId} scanned while status is ${matchedConsignment.status}.`,
          consignmentId: matchedConsignment.id,
          status: 'OPEN',
        })

        consignments = state.consignments.map((item) =>
          item.id === matchedConsignment.id
            ? { ...item, status: CONSIGNMENT_STATUSES.FLAGGED }
            : item,
        )

        auditLogs = pushAuditLog(
          state,
          actor,
          'gate.scan.unauthorized_exit',
          'consignment',
          matchedConsignment.id,
          `Attempted release during ${matchedConsignment.status}.`,
          gateName,
        )

        return {
          ...state,
          alerts,
          consignments,
          auditLogs,
          scanHistory: [
            {
              ...scanEntry,
              result: 'FLAGGED',
              consignmentId: matchedConsignment.id,
              reason: 'Unauthorized release state',
            },
            ...state.scanHistory,
          ],
        }
      }

      auditLogs = pushAuditLog(
        state,
        actor,
        'gate.scan.valid',
        'consignment',
        matchedConsignment.id,
        'Gate scan passed all checks.',
        gateName,
      )

      return {
        ...state,
        auditLogs,
        scanHistory: [
          {
            ...scanEntry,
            result: 'VALID',
            consignmentId: matchedConsignment.id,
            reason: 'Ready for release verification',
          },
          ...state.scanHistory,
        ],
      }
    }

    case 'CONFIRM_GATE_RELEASE': {
      const { consignmentId, actor, gateName } = action.payload

      const consignments = state.consignments.map((item) => {
        if (item.id !== consignmentId || item.status !== CONSIGNMENT_STATUSES.AT_GATE) {
          return item
        }

        return {
          ...item,
          status: CONSIGNMENT_STATUSES.VERIFIED_FOR_RELEASE,
          timeline: [
            ...item.timeline,
            {
              status: CONSIGNMENT_STATUSES.VERIFIED_FOR_RELEASE,
              at: new Date().toISOString(),
              actor,
            },
          ],
        }
      })

      return {
        ...state,
        consignments,
        dashboardRefreshAt: new Date().toISOString(),
        auditLogs: pushAuditLog(
          state,
          actor,
          'gate.release.confirmed',
          'consignment',
          consignmentId,
          'Gate release confirmed.',
          gateName,
        ),
      }
    }

    case 'INGEST_TRACKING_POINT': {
      const { consignmentId, point, actor } = action.payload
      let routeDeviationDetected = false
      let updatedReceiptId = null

      const consignments = state.consignments.map((item) => {
        if (item.id !== consignmentId) {
          return item
        }

        updatedReceiptId = item.receiptId
        const distance = formatDistance(point, item.expectedCorridor)

        if (distance > item.expectedCorridor.tolerance) {
          routeDeviationDetected = true
        }

        return {
          ...item,
          routePoints: [
            ...item.routePoints,
            { ...point, at: new Date().toISOString() },
          ],
        }
      })

      let alerts = state.alerts
      let auditLogs = state.auditLogs

      if (routeDeviationDetected) {
        alerts = createAlert(state, {
          severity: ALERT_STATUSES.WARNING,
          title: 'Route Deviation',
          message: `${updatedReceiptId} is outside expected corridor.`,
          consignmentId,
          status: 'OPEN',
        })

        auditLogs = pushAuditLog(
          state,
          actor,
          'tracking.route_deviation',
          'consignment',
          consignmentId,
          'Route deviation detected from incoming GPS point.',
        )
      }

      return {
        ...state,
        consignments,
        alerts,
        auditLogs,
      }
    }

    case 'RESOLVE_ALERT': {
      const { alertId, actor } = action.payload

      const alerts = state.alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: ALERT_STATUSES.RESOLVED,
            }
          : alert,
      )

      return {
        ...state,
        alerts,
        auditLogs: pushAuditLog(
          state,
          actor,
          'alert.resolved',
          'alert',
          alertId,
          'Alert marked as resolved.',
        ),
      }
    }

    case 'REFRESH_DASHBOARD': {
      return {
        ...state,
        dashboardRefreshAt: new Date().toISOString(),
      }
    }

    default:
      return state
  }
}

function withDerived(state) {
  const openAlerts = state.alerts.filter((item) => item.status !== ALERT_STATUSES.RESOLVED)
  const pendingPayments = state.payments.filter(
    (item) => item.status === PAYMENT_STATUSES.PENDING_VERIFICATION || item.status === PAYMENT_STATUSES.FLAGGED,
  )

  const activeConsignments = state.consignments.filter((item) => {
    return ![
      CONSIGNMENT_STATUSES.DELIVERED,
      CONSIGNMENT_STATUSES.CLOSED,
    ].includes(item.status)
  })

  return {
    ...state,
    counters: {
      openAlerts: openAlerts.length,
      pendingPayments: pendingPayments.length,
      activeConsignments: activeConsignments.length,
    },
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const value = useMemo(() => {
    const enriched = withDerived(state)

    return {
      ...enriched,
      setFilter: (scope, patch) => dispatch({ type: 'SET_FILTER', payload: { scope, patch } }),
      selectConsignment: (consignmentId) =>
        dispatch({ type: 'SELECT_CONSIGNMENT', payload: consignmentId }),
      selectPayment: (paymentId) => dispatch({ type: 'SELECT_PAYMENT', payload: paymentId }),
      createConsignment: (payload) => dispatch({ type: 'CREATE_CONSIGNMENT', payload }),
      assignConsignment: (payload) => dispatch({ type: 'ASSIGN_CONSIGNMENT', payload }),
      transitionConsignment: (payload) => dispatch({ type: 'TRANSITION_CONSIGNMENT', payload }),
      submitPayment: (payload) => dispatch({ type: 'SUBMIT_PAYMENT', payload }),
      verifyPayment: (payload) => dispatch({ type: 'VERIFY_PAYMENT', payload }),
      scanGateQr: (payload) => dispatch({ type: 'SCAN_GATE_QR', payload }),
      confirmGateRelease: (payload) => dispatch({ type: 'CONFIRM_GATE_RELEASE', payload }),
      ingestTrackingPoint: (payload) => dispatch({ type: 'INGEST_TRACKING_POINT', payload }),
      resolveAlert: (payload) => dispatch({ type: 'RESOLVE_ALERT', payload }),
      refreshDashboard: () => dispatch({ type: 'REFRESH_DASHBOARD' }),
    }
  }, [state])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }

  return context
}
