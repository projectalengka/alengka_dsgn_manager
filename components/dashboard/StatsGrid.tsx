"use client"

import type { DashboardStats, FinanceSummary } from "@/types"
import { Layers, Activity, GitPullRequestDraft, CheckCircle2, TrendingUp, Banknote, Receipt, ArrowUp, ArrowDown, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import AnimatedCounter from "./AnimatedCounter"

interface StatsGridProps {
  stats: DashboardStats
  financeSummary?: FinanceSummary | null
}

const cardConfig = [
  {
    label: "Total",
    key: "total" as const,
    desc: "Semua proyek",
    icon: <Layers className="w-3.5 h-3.5" />,
    bar: "bg-[#7c5cfc]",
    ring: "#7c5cfc",
    badgeKey: "done" as const,
    badgeLabel: "selesai",
  },
  {
    label: "Berjalan",
    key: "onProgress" as const,
    desc: "Lagi dikerjain",
    icon: <Activity className="w-3.5 h-3.5" />,
    bar: "bg-blue-500",
    ring: "#3b82f6",
    badgeKey: "revisi" as const,
    badgeLabel: "revisi",
  },
  {
    label: "Revisi",
    key: "revisi" as const,
    desc: "Butuh ditinjau",
    icon: <GitPullRequestDraft className="w-3.5 h-3.5" />,
    bar: "bg-amber-500",
    ring: "#f59e0b",
    badgeKey: null,
    badgeLabel: "perlu perhatian",
  },
  {
    label: "Selesai",
    key: "done" as const,
    desc: "Proyek rampung",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    bar: "bg-emerald-500",
    ring: "#10b981",
    badgeKey: "cancel" as const,
    badgeLabel: "batal",
  },
]

export default function StatsGrid({ stats, financeSummary }: StatsGridProps) {
  const totalActive = stats.onProgress + stats.revisi
  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
  const activeRate = stats.total > 0 ? Math.round((totalActive / stats.total) * 100) : 0

  function getPct(key: string): number {
    if (key === "total") return 100
    if (key === "onProgress") return activeRate
    if (key === "revisi") return stats.total > 0 ? Math.round((stats.revisi / stats.total) * 100) : 0
    return completionRate
  }

  function getBadge(key: string | null): string {
    if (!key) return stats.revisi > 0 ? `${stats.revisi} perlu ditinjau` : "aman"
    return `${stats[key as keyof DashboardStats]} ${cardConfig.find((c) => c.key === key)?.badgeLabel || ""}`
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#7c5cfc]" />
              <span className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">Pemasukan Bulan Ini</span>
            </div>
            <div className="text-2xl sm:text-3xl font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tight">
              <AnimatedCounter value={financeSummary?.totalIncome ?? stats.totalIncome} formatter={formatCurrency} duration={1500} />
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-[#5a5a6e] mt-1 block">
              {financeSummary ? `${financeSummary.transactionCount} transaksi` : `Dari ${stats.done} proyek selesai`}
            </span>
          </div>
          <div className="hidden sm:block w-px h-12 bg-neutral-200 dark:bg-[#1e1e30]" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              {financeSummary && financeSummary.comparisonPercent >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">Vs Bulan Lalu</span>
            </div>
            <div className="text-2xl sm:text-3xl font-light tracking-tight">
              {financeSummary ? (
                <span className={financeSummary.comparisonPercent >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {financeSummary.comparisonPercent >= 0 ? "+" : ""}{financeSummary.comparisonPercent}%
                </span>
              ) : (
                <span className="text-neutral-400 dark:text-[#a0a0b4]">
                  <AnimatedCounter value={stats.pipelineIncome} formatter={formatCurrency} duration={1500} />
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-[#5a5a6e] mt-1 block">
              {financeSummary
                ? `${formatCurrency(financeSummary.lastMonthIncome)} bulan lalu`
                : `${totalActive} proyek berjalan`}
            </span>
          </div>
          <div className="sm:ml-auto flex items-center gap-3 sm:pl-8 sm:border-l border-neutral-200 dark:border-[#1e1e30]">
            <div className="text-center">
              <div className="text-lg font-light text-neutral-950 dark:text-[#e4e4ed]">{completionRate}%</div>
              <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e]">selesai</span>
            </div>
            <div className="w-14 h-1.5 bg-neutral-100 dark:bg-[#1e1e30] rounded-full overflow-hidden">
              <div className="h-full bg-[#7c5cfc] rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cardConfig.map((item, idx) => {
          const pct = getPct(item.key)
          const badge = getBadge(item.badgeKey)
          return (
            <div
              key={idx}
              className="group bg-white dark:bg-[#0f0f1a]/60 border border-neutral-200/60 dark:border-[#1e1e30] rounded-xl p-4 hover:border-neutral-300 dark:hover:border-[#7c5cfc]/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-neutral-400 dark:text-[#5a5a6e]">
                  <span>{item.icon}</span>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
                <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e]">{item.desc}</span>
              </div>
              <div className="text-xl sm:text-2xl font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tight">
                <AnimatedCounter value={stats[item.key]} duration={1000 + idx * 100} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex-1 h-1 bg-neutral-100 dark:bg-[#1e1e30] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${item.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[8px] text-neutral-400 dark:text-[#5a5a6e] whitespace-nowrap">{badge}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
