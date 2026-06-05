import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OWNER_ROUTES } from '../../constants/owner/routes'
import DateRangeFilterButton from '../../components/common/DateRangeFilterButton'
import DetailCard from '../../components/owner/DetailCard'
import OwnerStatusBadge from '../../components/owner/OwnerStatusBadge'
import EmptyState from '../../components/owner/EmptyState'
import { useOwnerData } from '../../context/owner/OwnerContext'
import { isInDateRange } from '../../utils/dateRange'

export default function OwnerTerminalPage() {
  const navigate = useNavigate()
  const {
    terminals,
    liveOperations,
    selectedTerminalId,
    selectedTerminal,
    setSelectedTerminalId,
    addTerminal,
    deleteTerminal,
    toggleTerminalControl,
    triggerEmergencyMode,
  } = useOwnerData()

  const [opsStatusFilter, setOpsStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [notice, setNotice] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [terminalForm, setTerminalForm] = useState({
    name: '',
    status: 'operational',
    utilizationPercent: 0,
    activeVehicles: 0,
    activeOperators: 0,
    activeSecurity: 0,
  })

  const terminalOperations = useMemo(() => {
    return liveOperations.filter((operation) => {
      if (selectedTerminalId && operation.terminalId !== selectedTerminalId) {
        return false
      }
      if (opsStatusFilter !== 'all' && operation.status !== opsStatusFilter) {
        return false
      }
      if (!isInDateRange(operation.createdAt || operation.updatedAt, dateRange)) {
        return false
      }
      return true
    })
  }, [liveOperations, selectedTerminalId, opsStatusFilter, dateRange])

  function handleAddTerminal(event) {
    event.preventDefault()
    if (!terminalForm.name.trim()) {
      setNotice('Terminal name is required.')
      return
    }

    const created = addTerminal({
      ...terminalForm,
      name: terminalForm.name.trim(),
      utilizationPercent: Number(terminalForm.utilizationPercent) || 0,
      activeVehicles: Number(terminalForm.activeVehicles) || 0,
      activeOperators: Number(terminalForm.activeOperators) || 0,
      activeSecurity: Number(terminalForm.activeSecurity) || 0,
    })

    setSelectedTerminalId(created.id)
    setTerminalForm({
      name: '',
      status: 'operational',
      utilizationPercent: 0,
      activeVehicles: 0,
      activeOperators: 0,
      activeSecurity: 0,
    })
    setIsCreateModalOpen(false)
    setNotice('Terminal added successfully.')
  }

  function handleDeleteTerminal(terminalId) {
    deleteTerminal(terminalId)

    const remaining = terminals.filter((terminal) => terminal.id !== terminalId)
    setSelectedTerminalId(remaining[0]?.id || null)
    setNotice('Terminal deleted successfully.')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-headline text-lg font-bold">Terminal Management</h4>
            <p className="text-xs text-on-surface-variant">Create, monitor, and delete terminal records.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            Add Terminal
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant/20 p-4">
          <h4 className="font-headline text-lg font-bold">Terminal Registry (Tabular)</h4>
          <p className="text-xs text-on-surface-variant">Select a row to manage controls. Delete removes the terminal record.</p>
        </div>

        <div className="app-table-scroll">
          <table className="app-table text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Terminal</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Utilization</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Active Vehicles</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Operators</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Security</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {terminals.map((terminal) => (
                <tr
                  key={terminal.id}
                  onClick={() => setSelectedTerminalId(terminal.id)}
                  className={`cursor-pointer transition-colors hover:bg-surface-container-low ${selectedTerminalId === terminal.id ? 'bg-surface-container-low' : ''}`}
                >
                  <td className="px-4 py-3 font-semibold text-on-surface">{terminal.name}</td>
                  <td className="px-4 py-3"><OwnerStatusBadge status={terminal.status} /></td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{terminal.utilizationPercent}%</td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{terminal.activeVehicles}</td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{terminal.activeOperators}</td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{terminal.activeSecurity}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTerminal(terminal.id)
                      }}
                      className="rounded border border-error px-2 py-1 text-[11px] font-semibold text-error"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
            <div>
              <h4 className="font-headline text-lg font-bold">Active Operations</h4>
              <p className="text-xs text-on-surface-variant">Filtered by selected terminal</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={opsStatusFilter} onChange={(e) => setOpsStatusFilter(e.target.value)} className="rounded-lg border border-outline-variant px-3 py-2 text-xs">
                <option value="all">All Status</option>
                <option value="loaded">Loaded</option>
                <option value="gate-cleared">Gate Cleared</option>
                <option value="on-way">On Way</option>
                <option value="delivered">Delivered</option>
              </select>
              <DateRangeFilterButton value={dateRange} onChange={setDateRange} label="Custom Date" />
              <button
                type="button"
                onClick={() => navigate(`${OWNER_ROUTES.CONSIGNMENTS}?terminal=${selectedTerminalId || ''}`)}
                className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold"
              >
                View All Live Operations
              </button>
            </div>
          </div>

          {terminalOperations.length === 0 ? (
            <div className="p-4"><EmptyState title="No operations for selected filters" /></div>
          ) : (
            <div className="space-y-3 p-4">
              {terminalOperations.map((operation) => (
                <div key={operation.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold text-on-surface">{operation.title}</p>
                    <OwnerStatusBadge status={operation.status} />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                    <div className="h-full bg-primary" style={{ width: `${operation.progress}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">Progress: {operation.progress}%</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DetailCard title="Security & Controls">
          {!selectedTerminal ? (
            <EmptyState title="Select a terminal" />
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">System Active Indicator</p>
                <p className="mt-1 text-sm font-semibold text-on-surface">{selectedTerminal.status === 'operational' ? 'Live and healthy' : 'Requires attention'}</p>
              </div>

              <label className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-sm">
                <span>Main Gate</span>
                <input
                  type="checkbox"
                  checked={Boolean(selectedTerminal.gates.mainGateOpen)}
                  onChange={() => toggleTerminalControl(selectedTerminal.id, 'mainGateOpen')}
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-sm">
                <span>Camera Feed</span>
                <input
                  type="checkbox"
                  checked={Boolean(selectedTerminal.gates.cameraOnline)}
                  onChange={() => toggleTerminalControl(selectedTerminal.id, 'cameraOnline')}
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-sm">
                <span>QR Scanner</span>
                <input
                  type="checkbox"
                  checked={Boolean(selectedTerminal.gates.qrScannerOnline)}
                  onChange={() => toggleTerminalControl(selectedTerminal.id, 'qrScannerOnline')}
                />
              </label>

              <button
                type="button"
                onClick={() => triggerEmergencyMode(selectedTerminal.id)}
                className="w-full rounded-lg bg-error px-3 py-2 text-sm font-bold text-white"
              >
                Emergency Action
              </button>
            </div>
          )}
        </DetailCard>
      </section>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 p-4 pt-16">
          <div className="w-full max-w-4xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 p-4">
              <div>
                <h4 className="font-headline text-lg font-bold">Create Terminal</h4>
                <p className="text-xs text-on-surface-variant">This popup opens only when you click Add Terminal.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded border border-outline-variant px-3 py-1 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddTerminal} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
              <input
                required
                value={terminalForm.name}
                onChange={(e) => setTerminalForm((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                placeholder="Terminal name"
              />
              <select
                value={terminalForm.status}
                onChange={(e) => setTerminalForm((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
              >
                <option value="operational">Operational</option>
                <option value="caution">Caution</option>
                <option value="standby">Standby</option>
                <option value="offline">Offline</option>
              </select>
              <input
                type="number"
                min="0"
                max="100"
                value={terminalForm.utilizationPercent}
                onChange={(e) => setTerminalForm((prev) => ({ ...prev, utilizationPercent: e.target.value }))}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                placeholder="Utilization %"
              />
              <input
                type="number"
                min="0"
                value={terminalForm.activeVehicles}
                onChange={(e) => setTerminalForm((prev) => ({ ...prev, activeVehicles: e.target.value }))}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                placeholder="Active vehicles"
              />
              <input
                type="number"
                min="0"
                value={terminalForm.activeOperators}
                onChange={(e) => setTerminalForm((prev) => ({ ...prev, activeOperators: e.target.value }))}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                placeholder="Active operators"
              />
              <input
                type="number"
                min="0"
                value={terminalForm.activeSecurity}
                onChange={(e) => setTerminalForm((prev) => ({ ...prev, activeSecurity: e.target.value }))}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                placeholder="Active security"
              />

              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white md:col-span-3">
                Save Terminal
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {notice ? <p className="text-xs font-medium text-on-surface-variant">{notice}</p> : null}
    </div>
  )
}
