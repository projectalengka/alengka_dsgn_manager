"use client"

import { LayoutDashboard, FolderDot, BarChart3, Tag, Columns, Users, Wallet } from "lucide-react"
import type { Tab } from "@/types"

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

const navItems = [
  { id: "dashboard" as Tab, label: "Beranda",  icon: <LayoutDashboard className="w-4 h-4 stroke-[1.5]" /> },
  { id: "projects"  as Tab, label: "Proyek",   icon: <FolderDot className="w-4 h-4 stroke-[1.5]" /> },
  { id: "keuangan"  as Tab, label: "Keuangan", icon: <Wallet className="w-4 h-4 stroke-[1.5]" /> },
  { id: "crm"       as Tab, label: "Klien",    icon: <Users className="w-4 h-4 stroke-[1.5]" /> },
  { id: "categories" as Tab, label: "Kategori", icon: <Tag className="w-4 h-4 stroke-[1.5]" /> },
]

export default function Sidebar({ activeTab, onTabChange, sidebarOpen, onToggleSidebar }: SidebarProps) {
  return (
    <>
      <aside className={`hidden md:flex flex-col bg-white dark:bg-[#0c0c16] border-r border-[#e5e5eb] dark:border-[#1e1e30] h-screen sticky top-0 text-neutral-800 dark:text-[#c8c8d8] transition-all duration-300 select-none flex-shrink-0 z-40 overflow-hidden ${sidebarOpen ? "w-64" : "w-0 !border-r-0"}`}>
        <div className="w-64 flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-neutral-100 dark:border-[#1e1e30] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#a78bfa] text-white flex items-center justify-center font-serif italic text-sm">ds</div>
              <div>
                <h1 className="text-xs font-medium text-neutral-950 dark:text-[#e4e4ed]">Design Studio</h1>
                <p className="text-[9px] text-neutral-400 dark:text-[#5a5a6e]">Manajemen Proyek</p>
              </div>
            </div>
            <button onClick={onToggleSidebar} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-[#141422] text-neutral-400 hover:text-neutral-950 dark:text-[#5a5a6e] dark:hover:text-[#e4e4ed] rounded-lg transition-colors cursor-pointer" title="Sembunyikan Sidebar">
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-0.5">
            <span className="px-3 text-[9px] text-neutral-400 dark:text-[#5a5a6e] font-medium block mb-3">Menu</span>
            {navItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                    isActive
                      ? "bg-[#7c5cfc]/10 dark:bg-[#7c5cfc]/15 text-[#7c5cfc] dark:text-[#a78bfa] font-medium"
                      : "text-neutral-500 dark:text-[#8b8b9e] hover:bg-neutral-100/50 dark:hover:bg-[#141422]/80 hover:text-neutral-800 dark:hover:text-[#c8c8d8]"
                  }`}
                >
                  <span className={isActive ? "text-[#7c5cfc]" : "text-neutral-400 dark:text-[#5a5a6e]"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="p-5 border-t border-neutral-100 dark:border-[#1e1e30]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#a78bfa] flex items-center justify-center text-white text-[9px] font-medium flex-shrink-0">
                DS
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e] block truncate">Admin Studio</span>
              </div>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#0a0a12]/90 border-t border-neutral-200/50 dark:border-[#1e1e30] text-neutral-500 py-3 px-6 flex items-center justify-around z-50 shadow-sm backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button key={item.id} onClick={() => onTabChange(item.id)} className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-[#7c5cfc] dark:text-[#a78bfa] font-medium" : "text-neutral-400 dark:text-[#5a5a6e]"}`}>
              <div className="p-1 rounded-lg">{item.icon}</div>
              <span className="text-[8px] uppercase tracking-wider">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
