import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getNotificationsAPI } from '../services/api'

const ACTION_DETAILS = {
  DRIVER_FLAGGED: { title: 'Driver flagged', icon: 'person_alert', tone: 'text-red-600 bg-red-50' },
  TRUCK_FLAGGED: { title: 'Truck flagged', icon: 'local_shipping', tone: 'text-red-600 bg-red-50' },
  CONSIGNMENT_FLAGGED: { title: 'Consignment flagged', icon: 'flag', tone: 'text-red-600 bg-red-50' },
  PAYMENT_FLAGGED: { title: 'Payment flagged', icon: 'payments', tone: 'text-red-600 bg-red-50' },
  APPROVE_DRIVER: { title: 'Driver approved', icon: 'person_check', tone: 'text-emerald-700 bg-emerald-50' },
  APPROVE_TRUCK: { title: 'Truck approved', icon: 'task_alt', tone: 'text-emerald-700 bg-emerald-50' },
  CREATED_CONSIGNMENT: { title: 'Consignment created', icon: 'inventory_2', tone: 'text-blue-700 bg-blue-50' },
  GENERATE_QR: { title: 'QR pass generated', icon: 'qr_code_2', tone: 'text-blue-700 bg-blue-50' },
  GATE_CLEARED: { title: 'Gate cleared', icon: 'verified', tone: 'text-emerald-700 bg-emerald-50' },
  ARRIVED: { title: 'Consignment arrived', icon: 'location_on', tone: 'text-blue-700 bg-blue-50' },
  DELIVERY_VERIFIED: { title: 'Delivery verified', icon: 'inventory', tone: 'text-emerald-700 bg-emerald-50' },
  PAYMENT_VERIFIED: { title: 'Payment verified', icon: 'price_check', tone: 'text-emerald-700 bg-emerald-50' },
  LEDGER_CLOSED: { title: 'Ledger closed', icon: 'account_balance', tone: 'text-emerald-700 bg-emerald-50' },
}

function formatMessage(notification) {
  const reason = notification.metadata?.reason
  if (reason) {
    return `${notification.entityLabel || 'Record'}: ${reason}`
  }

  return `${notification.entityLabel || 'Record'} updated by ${notification.actorName || 'System'}.`
}

export default function NotificationBell({ owner = false }) {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [lastReadId, setLastReadId] = useState(0)

  const storageKey = `sandtrack_notification_read_${currentUser?.id || currentUser?.username || 'user'}`

  useEffect(() => {
    setLastReadId(Number(localStorage.getItem(storageKey) || 0))
  }, [storageKey])

  useEffect(() => {
    if (!currentUser) return undefined

    let active = true
    const loadNotifications = async () => {
      try {
        const response = await getNotificationsAPI({ limit: 30 })
        if (active) {
          setNotifications(response.data?.data || [])
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Failed to load notifications:', error)
        }
      }
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 15000)
    window.addEventListener('sandtrack:notifications-refresh', loadNotifications)

    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('sandtrack:notifications-refresh', loadNotifications)
    }
  }, [currentUser])

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => Number(notification.id) > lastReadId).length,
    [lastReadId, notifications],
  )

  function toggleNotifications() {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)

    if (nextOpen && notifications.length > 0) {
      const newestId = Math.max(...notifications.map((notification) => Number(notification.id) || 0))
      setLastReadId(newestId)
      localStorage.setItem(storageKey, String(newestId))
    }
  }

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={toggleNotifications}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-blue-950"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-extrabold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed left-3 right-3 top-20 z-50 max-h-[70vh] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-on-surface">Notifications</p>
              <p className="text-xs text-on-surface-variant">Live updates related to your role</p>
            </div>
            {owner ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/owner/alerts')
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                View alerts
              </button>
            ) : null}
          </div>

          <div className="no-scrollbar max-h-[58vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">notifications_off</span>
                <p className="mt-2 text-sm font-semibold text-on-surface">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const detail = ACTION_DETAILS[notification.action] || {
                  title: notification.action?.replaceAll('_', ' ') || 'System update',
                  icon: 'info',
                  tone: 'text-blue-700 bg-blue-50',
                }

                return (
                  <div key={notification.id} className="flex gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${detail.tone}`}>
                      <span className="material-symbols-outlined text-xl">{detail.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-on-surface">{detail.title}</p>
                        <time className="flex-shrink-0 text-[10px] text-on-surface-variant">
                          {new Date(notification.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="mt-1 break-words text-xs leading-5 text-on-surface-variant">
                        {formatMessage(notification)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
