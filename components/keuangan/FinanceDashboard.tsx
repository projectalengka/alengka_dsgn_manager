"use client"

import { useState, useEffect, useCallback } from "react"
import type { FinancialRecord, FinanceSummary, FinanceFormData } from "@/types"
import { getFinancialRecords, createFinancialRecord, deleteFinancialRecord, getFinanceSummary } from "@/actions/keuangan"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Wallet, ArrowRight, CircleOff, Filter, X, Banknote, Receipt, BarChart3, ArrowUp, ArrowDown } from "lucide-react"

const categories = [
  "DP Client", "Pelunasan", "Fee Design", "Cetak", "Lainnya"
]

export default function FinanceDashboard() {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(now.getFullYear())

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FinanceFormData>({
    title: "", amount: 0, date: now.toISOString().slice(0, 10), category: categories[0], notes: "",
  })
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        getFinancialRecords(filterMonth, filterYear),
        getFinanceSummary(filterMonth, filterYear),
      ])
      setRecords(r)
      setSummary(s)
    } catch (err) {
      console.error("Gagal muat data keuangan:", err)
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterYear])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async () => {
    setFormError("")
    if (!form.title.trim()) { setFormError("Nama pemasukan harus diisi."); return }
    if (!form.amount || form.amount <= 0) { setFormError("Nominal harus lebih dari 0."); return }
    if (!form.date) { setFormError("Tanggal harus diisi."); return }

    setSaving(true)
    try {
      await createFinancialRecord({ ...form, amount: Number(form.amount) })
      setForm({ title: "", amount: 0, date: now.toISOString().slice(0, 10), category: categories[0], notes: "" })
      setShowForm(false)
      await loadData()
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteFinancialRecord(id)
      await loadData()
    } catch {
      console.error("Gagal hapus")
    }
  }

  const months = [
    { value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
    { value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
    { value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
    { value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" },
  ]
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#a78bfa] text-white flex items-center justify-center font-serif italic text-xs shadow-lg animate-pulse">ds</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">Menu Keuangan</h2>
          <p className="text-xs text-neutral-400 dark:text-[#8b8b9e] mt-0.5">Kelola pemasukan dan lihat laporan keuangan.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-lg px-2.5 py-1.5">
            <Filter className="w-3 h-3 text-neutral-400" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="text-[11px] bg-transparent border-none outline-none text-neutral-700 dark:text-[#c8c8d8] cursor-pointer appearance-none"
            >
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="text-[11px] bg-transparent border-none outline-none text-neutral-700 dark:text-[#c8c8d8] cursor-pointer appearance-none"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-1.5 bg-[#7c5cfc] hover:bg-[#6b4fe0] text-white text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.97]"
          >
            <PlusCircle className="w-3.5 h-3.5" />{showForm ? "Tutup" : "Baru"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-5 sm:p-6 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#7c5cfc]" />
              <h3 className="text-xs font-medium text-neutral-800 dark:text-[#c8c8d8]">Input Pemasukan Baru</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-[#141422] rounded cursor-pointer">
              <X className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] block mb-1">Nama Pemasukan</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: DP Client"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#141422] border border-neutral-200 dark:border-[#232338] rounded-lg outline-none focus:ring-1 focus:ring-[#7c5cfc] text-neutral-800 dark:text-[#c8c8d8] placeholder:text-neutral-300 dark:placeholder:text-[#5a5a6e]"
              />
            </div>
            <div>
              <label className="text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] block mb-1">Nominal (Rp)</label>
              <input
                type="number"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="0"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#141422] border border-neutral-200 dark:border-[#232338] rounded-lg outline-none focus:ring-1 focus:ring-[#7c5cfc] text-neutral-800 dark:text-[#c8c8d8] placeholder:text-neutral-300 dark:placeholder:text-[#5a5a6e]"
              />
            </div>
            <div>
              <label className="text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] block mb-1">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#141422] border border-neutral-200 dark:border-[#232338] rounded-lg outline-none focus:ring-1 focus:ring-[#7c5cfc] text-neutral-800 dark:text-[#c8c8d8]"
              />
            </div>
            <div>
              <label className="text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] block mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#141422] border border-neutral-200 dark:border-[#232338] rounded-lg outline-none focus:ring-1 focus:ring-[#7c5cfc] text-neutral-800 dark:text-[#c8c8d8] appearance-none cursor-pointer"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] block mb-1">Catatan</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opsional"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#141422] border border-neutral-200 dark:border-[#232338] rounded-lg outline-none focus:ring-1 focus:ring-[#7c5cfc] text-neutral-800 dark:text-[#c8c8d8] placeholder:text-neutral-300 dark:placeholder:text-[#5a5a6e]"
              />
            </div>
          </div>
          {formError && <p className="text-[10px] text-red-500 mb-3">{formError}</p>}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-[#7c5cfc] hover:bg-[#6b4fe0] text-white text-xs font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50 active:scale-[0.97]"
          >
            {saving ? "Menyimpan..." : "Simpan Pemasukan"}
          </button>
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-1.5 text-neutral-400 dark:text-[#5a5a6e] mb-2">
                <Banknote className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Total Pemasukan</span>
              </div>
              <div className="text-xl sm:text-2xl font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tight">
                {formatCurrency(summary.totalIncome)}
              </div>
              <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] mt-1 block">
                {months.find((m) => m.value === filterMonth)?.label} {filterYear}
              </span>
            </div>

            <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-1.5 text-neutral-400 dark:text-[#5a5a6e] mb-2">
                <Receipt className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Jumlah Transaksi</span>
              </div>
              <div className="text-xl sm:text-2xl font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tight">
                {summary.transactionCount}
              </div>
              <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] mt-1 block">
                {summary.transactionCount === 1 ? "transaksi" : "transaksi"}
              </span>
            </div>

            <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-1.5 text-neutral-400 dark:text-[#5a5a6e] mb-2">
                <ArrowUp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Pemasukan Terbesar</span>
              </div>
              <div className="text-xl sm:text-2xl font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tight">
                {formatCurrency(summary.maxIncome)}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-1.5 text-neutral-400 dark:text-[#5a5a6e] mb-2">
                {summary.comparisonPercent >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                <span className="text-[10px] font-medium">Vs Bulan Lalu</span>
              </div>
              <div className="text-xl sm:text-2xl font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tight flex items-center gap-2">
                <span className={summary.comparisonPercent >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {summary.comparisonPercent >= 0 ? "+" : ""}{summary.comparisonPercent}%
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] mt-1 block">
                {formatCurrency(summary.lastMonthIncome)} bulan lalu
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-neutral-50 dark:bg-[#141422] rounded border border-neutral-150 dark:border-[#232338]">
                <BarChart3 className="w-4 h-4 text-[#7c5cfc]" />
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-800 dark:text-[#c8c8d8] block">Trend Keuangan {filterYear}</span>
                <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] block">Pemasukan per bulan</span>
              </div>
            </div>

            <div className="flex gap-4 h-44 w-full items-stretch">
              <div className="flex flex-col justify-between text-[8px] text-neutral-400 dark:text-[#5a5a6e] font-mono w-12 pr-2 text-right">
                {(() => {
                  const maxVal = Math.max(...summary.monthlyData.map((d) => d.total), 1)
                  return [1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                    <span key={idx} className="block translate-y-[3px]">{formatCurrency(ratio * maxVal)}</span>
                  ))
                })()}
              </div>
              <div className="flex-1 relative h-full">
                {(() => {
                  const maxVal = Math.max(...summary.monthlyData.map((d) => d.total), 1)
                  return summary.monthlyData.map((d, idx) => {
                    const height = (d.total / maxVal) * 100
                    const isHovered = hoveredMonth === idx
                    const barColor = d.total > 0
                      ? (idx + 1 === filterMonth ? "#7c5cfc" : "#a78bfa")
                      : "#e5e5ea"
                    return (
                      <div key={idx} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${(idx / 12) * 100 + 4}%`, width: `${100 / 12 - 8}%` }}>
                        <div
                          className="w-full rounded-t-md transition-all duration-300 cursor-pointer relative"
                          style={{
                            height: `${Math.max(height, d.total > 0 ? 4 : 0)}%`,
                            backgroundColor: barColor,
                            opacity: isHovered ? 1 : (d.total > 0 ? 0.85 : 0.4),
                          }}
                          onMouseEnter={() => setHoveredMonth(idx)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        />
                        {isHovered && d.total > 0 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-[#141422]/95 border border-neutral-200 dark:border-[#2a2a44] rounded px-2 py-1 shadow-lg whitespace-nowrap pointer-events-none z-10">
                            <div className="text-[9px] text-neutral-950 dark:text-[#e4e4ed] font-semibold">{formatCurrency(d.total)}</div>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
            <div className="flex gap-4 px-1 mt-3">
              <div className="w-12 shrink-0" />
              <div className="flex-1 flex justify-between border-t border-neutral-100 dark:border-[#1e1e30] pt-2">
                {summary.monthlyData.map((d, idx) => (
                  <span
                    key={idx}
                    className={`text-[8px] tracking-wide uppercase ${
                      hoveredMonth === idx
                        ? "text-neutral-950 dark:text-[#e4e4ed] font-semibold"
                        : idx + 1 === filterMonth
                          ? "text-[#7c5cfc] font-medium"
                          : "text-neutral-400 dark:text-[#5a5a6e]"
                    }`}
                  >
                    {d.month}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-neutral-400" />
                <h3 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">
                  Histori Pemasukan — {months.find((m) => m.value === filterMonth)?.label} {filterYear}
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e]">{records.length} transaksi</span>
            </div>

            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-[#5a5a6e]">
                <CircleOff className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-[11px]">Belum ada pemasukan untuk bulan ini.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-[#1e1e30]">
                      <th className="text-left py-2.5 pr-4 text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] uppercase tracking-wider">Tanggal</th>
                      <th className="text-left py-2.5 pr-4 text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] uppercase tracking-wider">Nama</th>
                      <th className="text-left py-2.5 pr-4 text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] uppercase tracking-wider">Kategori</th>
                      <th className="text-right py-2.5 pr-4 text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] uppercase tracking-wider">Nominal</th>
                      <th className="text-left py-2.5 text-[9px] font-medium text-neutral-400 dark:text-[#5a5a6e] uppercase tracking-wider">Catatan</th>
                      <th className="text-right py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className="border-b border-neutral-50 dark:border-[#1e1e30]/50 group hover:bg-neutral-50/50 dark:hover:bg-[#141422]/30 transition-colors">
                        <td className="py-2.5 pr-4 text-neutral-500 dark:text-[#8b8b9e]">{formatDate(r.date)}</td>
                        <td className="py-2.5 pr-4 font-medium text-neutral-800 dark:text-[#c8c8d8]">{r.title}</td>
                        <td className="py-2.5 pr-4">
                          <span className="px-2 py-0.5 bg-neutral-100 dark:bg-[#141422] border border-neutral-150 dark:border-[#232338] rounded text-[9px] text-neutral-500 dark:text-[#8b8b9e]">
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(r.amount)}</td>
                        <td className="py-2.5 text-neutral-400 dark:text-[#5a5a6e] max-w-[150px] truncate">{r.notes || "—"}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-red-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-200 dark:border-[#1e1e30]">
                      <td colSpan={3} className="py-3 text-[10px] font-medium text-neutral-500 dark:text-[#8b8b9e]">Total</td>
                      <td className="py-3 text-right text-sm font-semibold text-neutral-950 dark:text-[#e4e4ed]">{formatCurrency(summary.totalIncome)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
