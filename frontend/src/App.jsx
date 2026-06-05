import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppStateProvider } from './context/AppStateContext'
import { OwnerProvider } from './context/owner/OwnerContext'
import { RoleSystemProvider } from './context/roleSystem/RoleSystemContext'
import AppLayout from './components/layout/AppLayout'
import OwnerLayout from './components/owner/OwnerLayout'
import ProtectedRoute from './components/routing/ProtectedRoute'
import PermissionRoute from './components/routing/PermissionRoute'
import RoleHomeRedirect from './components/routing/RoleHomeRedirect'
import RoleRoute from './components/routing/RoleRoute'
import { PERMISSIONS } from './rbac/permissions'
import { ROLES } from './rbac/roles'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import UnauthorizedPage from './pages/auth/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/app/DashboardPage'
import ConsignmentsPage from './pages/app/ConsignmentsPage'
import ConsignmentDetailsPage from './pages/app/ConsignmentDetailsPage'
import DigitalReceiptPage from './pages/app/DigitalReceiptPage'
import GateScanPage from './pages/app/GateScanPage'
import TrackingLivePage from './pages/app/TrackingLivePage'
import PaymentEntryPage from './pages/app/PaymentEntryPage'
import PaymentVerificationPage from './pages/app/PaymentVerificationPage'
import LedgerPage from './pages/app/LedgerPage'
import ReconciliationPage from './pages/app/ReconciliationPage'
import LegacyUserManagementPage from './pages/app/UserManagementPage'
import AlertsPage from './pages/app/AlertsPage'
import SettingsPage from './pages/app/SettingsPage'
import SupportPage from './pages/app/SupportPage'
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage'
import UserManagementPage from './pages/app/owner/UserManagementPage'
import OwnerTerminalPage from './pages/owner/OwnerTerminalPage'
import OwnerTrucksPage from './pages/owner/OwnerTrucksPage'
import OwnerAlertsPage from './pages/owner/OwnerAlertsPage'
import OwnerConsignmentsPage from './pages/owner/OwnerConsignmentsPage'
import OwnerConsignmentDetailPage from './pages/owner/OwnerConsignmentDetailPage'
import OwnerAccountsPage from './pages/owner/OwnerAccountsPage'
import OwnerSearchPage from './pages/owner/OwnerSearchPage'
import OwnerApprovalsPage from './pages/owner/OwnerApprovalsPage'
import OwnerSettingsPage from './pages/owner/OwnerSettingsPage'
import OwnerSupportPage from './pages/owner/OwnerSupportPage'
import OwnerProfilePage from './pages/owner/OwnerProfilePage'
import ProfilePage from './pages/app/ProfilePage'
import OperatorDashboardPage from './pages/app/operator/OperatorDashboardPage'
import OperatorConsignmentsPage from './pages/app/operator/OperatorConsignmentsPage'
import OperatorConsignmentCreatePage from './pages/app/operator/OperatorConsignmentCreatePage'
import OperatorDriversPage from './pages/app/operator/OperatorDriversPage'
import OperatorTrucksPage from './pages/app/operator/OperatorTrucksPage'
import DriverDashboardPage from './pages/app/driver/DriverDashboardPage'
import DriverConsignmentsPage from './pages/app/driver/DriverConsignmentsPage'
import WatchmanDashboardPage from './pages/app/watchman/WatchmanDashboardPage'
import ScannerPage from './pages/app/watchman/ScannerPage'
import AccountantDashboardPage from './pages/app/accountant/AccountantDashboardPage'
import AccountantLedgerPage from './pages/app/accountant/AccountantLedgerPage'
import AccountantVerificationPage from './pages/app/accountant/AccountantVerificationPage'
import AccountantExpensesPage from './pages/app/accountant/AccountantExpensesPage'
import AccountantDeliveredConsignmentsPage from './pages/app/accountant/AccountantDeliveredConsignmentsPage'
import QRDisplayPage from './pages/app/driver/QRDisplayPage'
import AnalyticsDashboardPage from './pages/owner/AnalyticsDashboardPage'
import StaffActivityLogPage from './pages/owner/StaffActivityLogPage'
import GateLogsPage from './pages/owner/GateLogsPage'
import PublicQrPassPage from './pages/public/PublicQrPassPage'

function App() {
  return (
    <AuthProvider>
      <OwnerProvider>
        <RoleSystemProvider>
          <AppStateProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/app" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/403" element={<UnauthorizedPage />} />
                <Route path="/driver/qr" element={<QRDisplayPage />} />
                <Route path="/public/qr-pass/:token" element={<PublicQrPassPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/owner" element={<OwnerLayout />}>
                    <Route index element={<Navigate to="/owner/dashboard" replace />} />
                    <Route path="dashboard" element={<OwnerDashboardPage />} />
                    <Route path="accounts" element={<OwnerAccountsPage />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="trucks" element={<OwnerTrucksPage />} />
                    <Route path="approvals" element={<OwnerApprovalsPage />} />
                    <Route path="terminal" element={<OwnerTerminalPage />} />
                    <Route path="alerts" element={<OwnerAlertsPage />} />
                    <Route path="consignments" element={<OwnerConsignmentsPage />} />
                    <Route path="consignments/:id" element={<OwnerConsignmentDetailPage />} />
                    <Route path="profile" element={<OwnerProfilePage />} />
                    <Route path="settings" element={<OwnerSettingsPage />} />
                    <Route path="support" element={<OwnerSupportPage />} />
                    <Route path="search" element={<OwnerSearchPage />} />
                    <Route path="analytics" element={<AnalyticsDashboardPage />} />
                    <Route path="activity" element={<StaffActivityLogPage />} />
                    <Route path="gate-logs" element={<GateLogsPage />} />
                  </Route>

                  <Route path="/app" element={<AppLayout />}>
                    <Route index element={<RoleHomeRedirect />} />
                    <Route path="profile" element={<ProfilePage />} />

                    <Route path="operator" element={<RoleRoute roles={[ROLES.TERMINAL_OPERATOR]} />}>
                      <Route index element={<Navigate to="/app/operator/dashboard" replace />} />
                      <Route path="dashboard" element={<OperatorDashboardPage />} />
                      <Route path="consignments" element={<OperatorConsignmentsPage />} />
                      <Route path="consignments/create" element={<OperatorConsignmentCreatePage />} />
                      <Route path="drivers" element={<OperatorDriversPage />} />
                      <Route path="trucks" element={<OperatorTrucksPage />} />
                    </Route>

                    <Route path="driver" element={<RoleRoute roles={[ROLES.DRIVER]} />}>
                      <Route index element={<Navigate to="/app/driver/dashboard" replace />} />
                      <Route path="dashboard" element={<DriverDashboardPage />} />
                      <Route path="consignments" element={<DriverConsignmentsPage />} />
                      <Route path="qr" element={<QRDisplayPage />} />
                    </Route>

                    <Route path="watchman" element={<RoleRoute roles={[ROLES.WATCHMAN]} />}>
                      <Route index element={<Navigate to="/app/watchman/dashboard" replace />} />
                      <Route path="dashboard" element={<WatchmanDashboardPage />} />
                      <Route path="scan" element={<ScannerPage />} />
                    </Route>

                    <Route path="accountant" element={<RoleRoute roles={[ROLES.ACCOUNTANT]} />}>
                      <Route index element={<Navigate to="/app/accountant/dashboard" replace />} />
                      <Route path="dashboard" element={<AccountantDashboardPage />} />
                      <Route path="ledger" element={<AccountantLedgerPage />} />
                      <Route path="delivered" element={<AccountantDeliveredConsignmentsPage />} />
                      <Route path="verification" element={<AccountantVerificationPage />} />
                      <Route path="expenses" element={<AccountantExpensesPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.DASHBOARD_VIEW]} />}>
                      <Route path="dashboard" element={<DashboardPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.CONSIGNMENT_READ]} />}>
                      <Route path="consignments" element={<ConsignmentsPage />} />
                      <Route path="consignments/:consignmentId" element={<ConsignmentDetailsPage />} />
                      <Route path="consignments/:consignmentId/receipt" element={<DigitalReceiptPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.GATE_SCAN]} />}>
                      <Route path="gate/scan" element={<GateScanPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.TRACKING_VIEW]} />}>
                      <Route path="tracking/live" element={<TrackingLivePage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.PAYMENT_CREATE]} />}>
                      <Route path="payments/entry" element={<PaymentEntryPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.PAYMENT_VERIFY]} />}>
                      <Route path="payments/verification" element={<PaymentVerificationPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.LEDGER_VIEW]} />}>
                      <Route path="ledger" element={<LedgerPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.RECONCILIATION_VIEW]} />}>
                      <Route path="reconciliation" element={<ReconciliationPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.ALERTS_VIEW]} />}>
                      <Route path="alerts" element={<AlertsPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.USERS_MANAGE]} />}>
                      <Route path="users" element={<LegacyUserManagementPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.SETTINGS_VIEW]} />}>
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    <Route element={<PermissionRoute permissions={[PERMISSIONS.SUPPORT_VIEW]} />}>
                      <Route path="support" element={<SupportPage />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </AppStateProvider>
        </RoleSystemProvider>
      </OwnerProvider>
    </AuthProvider>
  )
}

export default App
