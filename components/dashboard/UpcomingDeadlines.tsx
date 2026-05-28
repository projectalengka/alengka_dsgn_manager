"use client"

import type { Project } from "@/types"
import { Calendar, Clock, ArrowRight, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useMemo } from "react"

interface UpcomingDeadlinesProps {
  projects: Project[]
  onViewAll: () => void
}

function getDaysUntil(deadline: Date): number {
  const now = new Date()
  return Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getUrgency(days: number) {
  if (days < 0) return { label: "Terlewat", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" }
  if (days === 0) return { label: "Hari ini", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" }
  if (days === 1) return { label: "Besok", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20" }
  if (days <= 3) return { label: `${days} hari`, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" }
  if (days <= 7) return { label: `${days} hari`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" }
  return { label: `${days} hari`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" }
}

export default function UpcomingDeadlines({ projects, onViewAll }: UpcomingDeadlinesProps) {
  const deadlines = useMemo(() => {
    return projects
      .filter((p) => p.status === "On Progress" || p.status === "Revisi")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3)
  }, [projects])

  const urgentCount = deadlines.filter((d) => getDaysUntil(d.deadline) <= 3).length

  return (
    <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-2xl p-5 sm:p-6 shadow-xs h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#e4e4ed]">Tenggat Waktu</h3>
            <p className="text-[10px] text-neutral-500 dark:text-[#8b8b9e]">Prioritas pekerjaan</p>
          </div>
        </div>
        {urgentCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-2.5 py-1 rounded-lg font-semibold animate-pulse">
            <AlertCircle className="w-3 h-3" />
            {urgentCount} mendesak
          </span>
        )}
      </div>

      <div className="flex-1">
        {deadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xs font-medium text-neutral-800 dark:text-[#c8c8d8]">Semua Aman!</p>
            <p className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] mt-1">Tidak ada deadline yang mendekat.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {deadlines.map((p) => {
              const days = getDaysUntil(p.deadline)
              const urg = getUrgency(days)
              const dateObj = new Date(p.deadline)
              const isUrgent = days <= 3

              return (
                <div key={p.id} className="group flex items-center gap-2.5 p-2 rounded-xl border border-transparent hover:border-neutral-200/60 dark:hover:border-[#1e1e30] hover:bg-neutral-50/50 dark:hover:bg-[#141422]/40 transition-all duration-300 cursor-default">
                  {/* Calendar Box */}
                  <div className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg border shrink-0 transition-colors ${
                    isUrgent 
                      ? "bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 shadow-sm" 
                      : "bg-white border-neutral-200 text-neutral-600 dark:bg-[#0f0f1a] dark:border-[#232338] dark:text-[#a0a0b4]"
                  }`}>
                    <span className="text-[8px] uppercase font-bold tracking-wider opacity-80 leading-none mt-0.5">
                      {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-[11px] font-black leading-tight">
                      {dateObj.getDate()}
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-neutral-800 dark:text-[#c8c8d8] truncate block group-hover:text-[#7c5cfc] dark:group-hover:text-[#a78bfa] transition-colors">
                        {p.projectTitle}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${urg.bg} ${urg.color} ${urg.border}`}>
                        {urg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 dark:text-[#8b8b9e] mt-0.5">
                      <span className="truncate max-w-[100px] font-medium">{p.clientName}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      <span className="font-mono tracking-tight">{formatCurrency(p.price)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {deadlines.length > 0 && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-neutral-500 dark:text-[#8b8b9e] bg-neutral-50 dark:bg-[#141422]/50 hover:bg-neutral-100 dark:hover:bg-[#1a1a2e] hover:text-neutral-900 dark:hover:text-[#e4e4ed] rounded-xl transition-all cursor-pointer"
        >
          Kelola Proyek <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
