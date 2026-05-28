"use client"

import type { Project } from "@/types"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
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
  if (days < 0) return { label: "Terlewat", color: "text-red-500", ring: "ring-red-500/20", dot: "bg-red-500" }
  if (days <= 1) return { label: "Besok", color: "text-red-500", ring: "ring-red-500/20", dot: "bg-red-500" }
  if (days <= 3) return { label: `${days} hari`, color: "text-amber-500", ring: "ring-amber-500/20", dot: "bg-amber-500" }
  if (days <= 7) return { label: `${days} hari`, color: "text-blue-500", ring: "ring-blue-500/20", dot: "bg-blue-500" }
  return { label: `${days} hari`, color: "text-emerald-500", ring: "ring-emerald-500/20", dot: "bg-emerald-500" }
}

export default function UpcomingDeadlines({ projects, onViewAll }: UpcomingDeadlinesProps) {
  const deadlines = useMemo(() => {
    return projects
      .filter((p) => p.status === "On Progress" || p.status === "Revisi")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5)
  }, [projects])

  const urgentCount = deadlines.filter((d) => getDaysUntil(d.deadline) <= 3).length

  return (
    <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-5 sm:p-6 shadow-xs h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-[#5a5a6e]" />
          <h3 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">Deadline</h3>
        </div>
        {urgentCount > 0 && (
          <span className="text-[9px] text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full font-medium">
            {urgentCount} urgent
          </span>
        )}
      </div>

      {deadlines.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs text-neutral-600 dark:text-[#a0a0b4]">Tidak ada deadline mendekat</p>
          <p className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] mt-0.5">Semua proyek dalam keadaan baik.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {deadlines.map((p) => {
            const days = getDaysUntil(p.deadline)
            const urg = getUrgency(days)
            return (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-[#141422]/40 transition-all duration-200">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${urg.dot} ${days <= 1 ? "animate-pulse" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-medium text-neutral-800 dark:text-[#c8c8d8] truncate">{p.projectTitle}</span>
                    <span className={`text-[9px] font-medium whitespace-nowrap ${urg.color}`}>{urg.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 dark:text-[#5a5a6e] mt-0.5">
                    <span>{p.clientName}</span>
                    <span>·</span>
                    <span>{formatCurrency(p.price)}</span>
                    <span>·</span>
                    <span>{formatDate(p.deadline)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deadlines.length > 0 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 flex items-center justify-center gap-1 py-2 text-[10px] text-neutral-400 dark:text-[#5a5a6e] hover:text-neutral-950 dark:hover:text-[#a78bfa] border-t border-neutral-100 dark:border-[#1e1e30] pt-3 transition-colors cursor-pointer"
        >
          Lihat semua <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
