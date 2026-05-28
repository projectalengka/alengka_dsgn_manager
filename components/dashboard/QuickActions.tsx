"use client"

import { PlusCircle, UserPlus, FileSpreadsheet, Download } from "lucide-react"
import type { Tab } from "@/types"

interface QuickActionsProps {
  onNewProject: () => void
  onNavigate: (tab: Tab) => void
}

const actions = [
  { label: "Proyek Baru", icon: PlusCircle, action: "newProject", color: "text-[#7c5cfc] bg-[#7c5cfc]/10" },
  { label: "Tambah Klien", icon: UserPlus, action: "newClient", color: "text-blue-500 bg-blue-500/10" },
  { label: "Laporan", icon: FileSpreadsheet, action: "report", color: "text-emerald-500 bg-emerald-500/10" },
  { label: "Ekspor CSV", icon: Download, action: "export", color: "text-amber-500 bg-amber-500/10" },
]

export default function QuickActions({ onNewProject, onNavigate }: QuickActionsProps) {
  const handle = (action: string) => {
    if (action === "newProject") onNewProject()
    if (action === "newClient") onNavigate("crm" as Tab)
    if (action === "report") onNavigate("analytics" as Tab)
    if (action === "export") onNavigate("projects" as Tab)
  }

  return (
    <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-2xl p-5 sm:p-6 shadow-xs h-full flex flex-col">
      <h3 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e] mb-4">Aksi Cepat</h3>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {actions.map((item) => (
          <button
            key={item.action}
            onClick={() => handle(item.action)}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-neutral-200/50 dark:border-[#1e1e30] bg-neutral-50/50 dark:bg-[#141422]/30 hover:bg-white dark:hover:bg-[#1a1a2e] hover:border-neutral-300 dark:hover:border-[#7c5cfc]/30 transition-all duration-300 active:scale-[0.98] cursor-pointer h-full group"
          >
            <span className={`p-2.5 rounded-xl ${item.color} group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className="w-5 h-5" />
            </span>
            <span className="text-xs font-medium text-neutral-700 dark:text-[#c8c8d8]">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
