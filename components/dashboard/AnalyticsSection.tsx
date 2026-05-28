"use client"

import { useState, useMemo } from "react"
import type { Project } from "@/types"
import { BarChart3, TrendingUp, Info } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AnalyticsSectionProps {
  projects: Project[]
  darkMode: boolean
}

export default function AnalyticsSection({ projects, darkMode }: AnalyticsSectionProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)

  const statusDistribution = useMemo(() => {
    const counts = { "On Progress": 0, Revisi: 0, Done: 0, Cancel: 0 }
    projects.forEach((p) => { counts[p.status as keyof typeof counts]++ })
    return counts
  }, [projects])

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    projects.forEach((p) => { counts[p.category.name] = (counts[p.category.name] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [projects])

  const monthlyData = useMemo(() => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli"]
    const income = [800000, 1500000, 1200000, 3100000, 2400000, 4800000, 3200000]
    const count = [1, 2, 2, 4, 3, 5, 3]

    projects.forEach((p) => {
      const d = new Date(p.createdAt)
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const idx = parseInt(mm) - 1
      if (idx >= 0 && idx < 7) {
        count[idx]++
        if (p.status === "Done") income[idx] += p.price
      }
    })

    return months.map((name, i) => ({ name, shortName: name.slice(0, 3), income: income[i], count: count[i] }))
  }, [projects])

  const maxIncome = Math.max(...monthlyData.map((d) => d.income), 5000000)
  const totalCount = projects.length
  const doneCount = projects.filter((p) => p.status === "Done").length
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-200/50 dark:border-[#1e1e30] pb-5">
        <div>
          <h2 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">Analisis Proyek</h2>
          <p className="text-xs text-neutral-400 dark:text-[#8b8b9e] mt-0.5">Grafik dan statistik nilai proyek dari waktu ke waktu.</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-white/60 dark:bg-[#141422] border border-neutral-150 dark:border-[#232338] rounded text-[9px] text-neutral-500 dark:text-[#8b8b9e]">
          <Info className="w-3 h-3 opacity-70" />
          <span>Sinkron</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-4 bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] p-6 sm:p-8 rounded-xl flex flex-col items-center text-center shadow-xs">
          <div className="w-full flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">Progres</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="my-10 relative flex items-center justify-center w-48 h-48">
            <div className="absolute inset-0 rounded-full border border-neutral-50 dark:border-[#1e1e30] p-3">
              <div className="w-full h-full rounded-full border border-dashed border-neutral-150 dark:border-[#232338]/60" />
            </div>
            <svg className="w-full h-full transform -rotate-90 scale-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" strokeWidth="1.5" className="stroke-neutral-100 dark:stroke-[#232338]" fill="transparent" />
              <circle cx="50" cy="50" r="42" stroke="#7c5cfc" strokeWidth="3" strokeDasharray={`${completionRate * 2.64} 264`} strokeLinecap="round" fill="transparent" className="transition-all duration-1000" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center w-32 h-32 rounded-full">
              <span className="text-4xl font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tighter flex items-start">
                {completionRate}<span className="text-xs text-neutral-400 font-medium mt-1 pl-0.5">%</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-neutral-400 dark:text-[#5a5a6e] mt-1">Selesai</span>
              <span className="text-[10px] text-neutral-500 dark:text-[#8b8b9e] mt-0.5">{doneCount} dari {totalCount}</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-4 gap-2 border-t border-neutral-100 dark:border-[#1e1e30] pt-5">
            <div className="text-center">
              <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e] block">Selesai</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-[#c8c8d8] mt-0.5 block">{statusDistribution.Done}</span>
            </div>
            <div className="text-center border-l border-neutral-100 dark:border-[#1e1e30]">
              <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e] block">Berjalan</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-[#c8c8d8] mt-0.5 block">{statusDistribution["On Progress"]}</span>
            </div>
            <div className="text-center border-l border-neutral-100 dark:border-[#1e1e30]">
              <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e] block">Revisi</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-[#c8c8d8] mt-0.5 block">{statusDistribution.Revisi}</span>
            </div>
            <div className="text-center border-l border-neutral-100 dark:border-[#1e1e30]">
              <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e] block">Batal</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-[#c8c8d8] mt-0.5 block">{statusDistribution.Cancel}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] p-6 sm:p-8 rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-neutral-50 dark:bg-[#141422] rounded border border-neutral-150 dark:border-[#232338]">
                <TrendingUp className="w-4 h-4 text-neutral-600 dark:text-[#8b8b9e]" />
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-800 dark:text-[#c8c8d8] block">Pendapatan Bulanan</span>
                <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] block">Riwayat pendapatan per bulan</span>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e] block">Tertinggi</span>
              <span className="text-sm font-light text-neutral-950 dark:text-[#e4e4ed] tracking-tight block">{formatCurrency(maxIncome)}</span>
            </div>
          </div>

          <div className="mt-8 flex gap-4 h-48 w-full items-stretch">
            <div className="flex flex-col justify-between text-[8px] text-neutral-400 dark:text-[#5a5a6e] font-mono w-14 pr-2 text-right">
              {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                <span key={idx} className="block translate-y-[4px]">{formatCurrency(ratio * maxIncome)}</span>
              ))}
            </div>
            <div className="flex-1 relative h-full">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                <div key={idx} className="absolute left-0 right-0 border-t border-neutral-100 dark:border-[#1e1e30]/40 pointer-events-none" style={{ bottom: `${ratio * 100}%` }} />
              ))}
              <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="appleInkShadow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="150" x2="500" y2="150" stroke="#e5e5ea" className="dark:stroke-[#1e1e30]" strokeWidth="1" />
                {(() => {
                  const points = monthlyData.map((d, idx) => {
                    const x = idx * 83.3
                    const y = 150 - (d.income / maxIncome) * 135
                    return { x, y }
                  })
                  let dPath = `M ${points[0].x},${points[0].y}`
                  for (let i = 0; i < points.length - 1; i++) {
                    dPath += ` C ${points[i].x + 35},${points[i].y} ${points[i + 1].x - 35},${points[i + 1].y} ${points[i + 1].x},${points[i + 1].y}`
                  }
                  return (
                    <>
                      <path d={`${dPath} L 500,150 L 0,150 Z`} fill="url(#appleInkShadow)" className="transition-all duration-500" />
                      <path d={dPath} fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )
                })()}
                {monthlyData.map((d, idx) => {
                  const x = idx * 83.3
                  const y = 150 - (d.income / maxIncome) * 135
                  const isHovered = hoveredMonth === idx
                  return (
                    <g key={idx} className="cursor-pointer">
                      {isHovered && <line x1={x} y1="150" x2={x} y2={y} stroke="#7c5cfc" strokeWidth="0.8" strokeDasharray="2,2" className="opacity-50" />}
                      <circle cx={x} cy={y} r={isHovered ? "4.5" : "3"} fill={isHovered ? "#7c5cfc" : (darkMode ? "#0f0f1a" : "#ffffff")} stroke="#7c5cfc" strokeWidth="1.5" onMouseEnter={() => setHoveredMonth(idx)} onMouseLeave={() => setHoveredMonth(null)} className="transition-all duration-150" />
                    </g>
                  )
                })}
              </svg>
              {hoveredMonth !== null && (
                <div className="absolute z-40 bg-white/95 dark:bg-[#141422]/95 border border-neutral-200 dark:border-[#2a2a44] rounded-lg px-3 py-2.5 shadow-xl pointer-events-none backdrop-blur-md animate-fade-in" style={{ left: `${(hoveredMonth / 6) * 100}%`, transform: "translateX(-50%)", bottom: "35%" }}>
                  <div className="text-[9px] text-neutral-400 dark:text-[#5a5a6e] tracking-wider uppercase font-medium">{monthlyData[hoveredMonth].name}</div>
                  <div className="text-xs font-semibold text-neutral-950 dark:text-[#e4e4ed] mt-1">{formatCurrency(monthlyData[hoveredMonth].income)}</div>
                  <div className="text-[10px] text-neutral-550 dark:text-[#8b8b9e] mt-0.5">{monthlyData[hoveredMonth].count} Proyek</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 px-1 mt-4">
            <div className="w-14 shrink-0" />
            <div className="flex-1 flex justify-between border-t border-neutral-100 dark:border-[#1e1e30] pt-3">
              {monthlyData.map((d, idx) => (
                <span key={idx} className={`text-[9.5px] tracking-wide uppercase ${hoveredMonth === idx ? "text-neutral-950 dark:text-[#e4e4ed] font-semibold" : "text-neutral-400"}`}>{d.shortName}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] p-6 sm:p-8 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-neutral-55 dark:bg-[#141422] rounded border border-neutral-200/50 dark:border-[#232338]">
            <BarChart3 className="w-4 h-4 text-neutral-400" />
          </div>
          <div>
            <span className="text-xs font-medium text-neutral-800 dark:text-[#c8c8d8] block">Kategori</span>
            <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] block">Sebaran proyek berdasarkan kategori</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          {categoryDistribution.map(([catName, count], idx) => {
            const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-800 dark:text-[#a0a0b4] font-medium">{catName}</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-neutral-450 dark:text-[#5a5a6e] text-[10px]">{count} proyek</span>
                    <span className="text-neutral-850 dark:text-[#a0a0b4] font-mono text-[10px]">({Math.round(ratio)}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 dark:bg-[#1e1e30] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c5cfc] dark:bg-[#7c5cfc] rounded-full transition-all duration-700" style={{ width: `${Math.min(ratio, 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
