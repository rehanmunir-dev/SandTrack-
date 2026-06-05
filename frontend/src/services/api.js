import axios from 'axios'

// Central Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // required to send httpOnly cookies in cross-origin requests
})

// Request Interceptor: Attach bearer token from localStorage sandtrack_token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sandtrack_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response Interceptor: Silent refresh on 401 with Request Queuing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const dataObj = res.data?.data || res.data || {}
        const token = dataObj.token || dataObj.accessToken

        if (token) {
          localStorage.setItem('sandtrack_token', token)
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          originalRequest.headers.Authorization = `Bearer ${token}`
          processQueue(null, token)
          isRefreshing = false
          return api(originalRequest)
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        isRefreshing = false
        localStorage.removeItem('sandtrack_token')
        localStorage.removeItem('sandtrack_user')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(error)
  }
)

// Auth Domain API functions
export const loginAPI = (username, password) =>
  api.post('/auth/login', { username, password })
export const logoutAPI = () =>
  api.post('/auth/logout')
export const refreshTokenAPI = () =>
  api.post('/auth/refresh')
export const resetPasswordAPI = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword })
export const updateProfilePictureAPI = (formData) =>
  api.patch('/auth/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

// Drivers Domain API functions
export const getDriversAPI = () =>
  api.get('/drivers')
export const registerDriverAPI = (formData) =>
  api.post('/drivers', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const approveDriverAPI = (id) =>
  api.patch(`/drivers/${id}/approve`)
export const flagDriverAPI = (id, reason) =>
  api.patch(`/drivers/${id}/flag`, { reason })

// Trucks Domain API functions
export const getTrucksAPI = () =>
  api.get('/trucks')
export const registerTruckAPI = (data) =>
  api.post('/trucks', data)
export const approveTruckAPI = (id) =>
  api.patch(`/trucks/${id}/approve`)
export const flagTruckAPI = (id, reason) =>
  api.patch(`/trucks/${id}/flag`, { reason })

// Consignments Domain API functions
export const getConsignmentsAPI = () =>
  api.get('/consignments')
export const createConsignmentAPI = (data) =>
  api.post('/consignments', data)
export const updateConsignmentStatusAPI = (id, status) =>
  api.patch(`/consignments/${id}/status`, { status })
export const flagConsignmentAPI = (id, reason) =>
  api.patch(`/consignments/${id}/flag`, { reason })
export const generateQRAPI = (id) =>
  api.post(`/consignments/${id}/qr`)
export const verifyQRAPI = (token) =>
  api.get(`/consignments/verify-qr/${token}`)
export const getPublicQrPassAPI = (token) =>
  api.get(`/consignments/qr-pass/${token}`)
export const clearGateAPI = (id, qrToken) =>
  api.post(`/consignments/${id}/clear-gate`, { qrToken })
export const markArrivedAPI = (id) =>
  api.patch(`/consignments/${id}/mark-arrived`)
export const verifyDeliveryAPI = (id) =>
  api.patch(`/consignments/${id}/verify-delivery`)
export const getConsignmentFullDetailAPI = (id) =>
  api.get(`/consignments/${id}/full-detail`)

// Payments Domain API functions
export const getPaymentsAPI = () =>
  api.get('/payments')
export const submitPaymentAPI = (formData) =>
  api.post('/payments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const verifyPaymentAPI = (id) =>
  api.patch(`/payments/${id}/verify`)
export const flagPaymentAPI = (id, notes) =>
  api.patch(`/payments/${id}/flag`, { notes })

// Expenses Domain API functions
export const getExpensesAPI = () =>
  api.get('/expenses')
export const addExpenseAPI = (data) =>
  api.post('/expenses', data)
export const deleteExpenseAPI = (id) =>
  api.delete(`/expenses/${id}`)

// Gate Logs Domain API functions
export const createGateLogAPI = (data) =>
  api.post('/gate-logs', data)
export const getGateLogsAPI = () =>
  api.get('/gate-logs')

// Activity Logs Domain API functions
export const getActivityLogsAPI = (params) =>
  api.get('/activity-logs', { params })

// Analytics Domain API functions
export const getAnalyticsSummaryAPI = () =>
  api.get('/analytics/summary')
export const getPaymentsByMethodAPI = () =>
  api.get('/analytics/payments-by-method')
export const getDailyRevenueAPI = () =>
  api.get('/analytics/daily-revenue')

// Ledger Domain API functions
export const getLedgerEntriesAPI = () =>
  api.get('/ledger')
export const getLedgerEntriesByConsignmentAPI = (id) =>
  api.get(`/ledger/consignment/${id}`)
export const closeConsignmentLedgerAPI = (id) =>
  api.post(`/ledger/close-consignment/${id}`)

// Users Domain API functions
export const getUsersAPI = () =>
  api.get('/users')
export const getAllUsersAPI = getUsersAPI
export const createUserAPI = (data) =>
  api.post('/users', data)
export const toggleUserStatusAPI = (id, isActive) =>
  api.patch(`/users/${id}/status`, { isActive })
export const resetUserPasswordAPI = (id) =>
  api.post(`/users/${id}/reset-password`)
export const deleteUserAPI = (id) =>
  api.delete(`/users/${id}`)

export default api
