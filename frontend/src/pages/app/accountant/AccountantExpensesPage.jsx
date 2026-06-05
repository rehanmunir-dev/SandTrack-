import { useState } from 'react'
import SectionCard from '../../../components/common/SectionCard'

export default function AccountantExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState({ type: 'salary', description: '', amount: '', date: new Date().toISOString().split('T')[0] })

  const addExpense = (e) => {
    e.preventDefault()
    if (!form.amount || !form.description) return
    setExpenses([...expenses, { ...form, id: Date.now() }])
    setForm({ ...form, description: '', amount: '' })
  }

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <SectionCard title="Record Expense" subtitle="Add new office expense">
            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Expense Type</label>
                <select 
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                  value={form.type} 
                  onChange={(e) => setForm({...form, type: e.target.value})}
                >
                  <option value="salary">Salaries</option>
                  <option value="petty_cash">Petty Cash</option>
                  <option value="office">Office Expenses</option>
                  <option value="other">Other Expenses</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g. Monthly salary for watchman"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Amount (PKR)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                  value={form.amount} 
                  onChange={(e) => setForm({...form, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                  value={form.date} 
                  onChange={(e) => setForm({...form, date: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">
                Save Expense
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="md:col-span-2">
           <SectionCard title="Expense Ledger" subtitle="Recent recorded expenses">
             <div className="app-table-scroll rounded-lg border border-outline-variant/20">
              <table className="app-table text-left text-sm">
                <thead className="bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Type</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Description</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Amount</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-on-surface-variant">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  ) : expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-3 text-on-surface-variant">{expense.date}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-semibold text-on-surface">
                          {expense.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface font-medium">{expense.description}</td>
                      <td className="px-4 py-3 text-right font-bold text-error">
                        Rs {Number(expense.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => deleteExpense(expense.id)}
                          className="text-error hover:underline text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
