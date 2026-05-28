"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Project, Category, Client, Tab, ProjectFormData, ProjectStatus, DashboardStats, FinanceSummary } from "@/types"
import { getProjects, createProject, updateProject, deleteProject, updateProjectStatus } from "@/actions/projects"
import { getCategories } from "@/actions/categories"
import { getClients } from "@/actions/clients"
import { getFinanceSummary } from "@/actions/keuangan"
import Sidebar from "@/components/layout/Sidebar"
import StatsGrid from "@/components/dashboard/StatsGrid"
import QuickActions from "@/components/dashboard/QuickActions"
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines"
import AnalyticsSection from "@/components/dashboard/AnalyticsSection"
import ProjectList from "@/components/projects/ProjectList"
import ProjectForm from "@/components/projects/ProjectForm"
import ConfirmModal from "@/components/projects/ConfirmModal"
import CategoryManager from "@/components/categories/CategoryManager"
import CRMManager from "@/components/crm/CRMManager"
import FinanceDashboard from "@/components/keuangan/FinanceDashboard"
import Toast, { type ToastType } from "@/components/ui/Toast"
import ErrorBoundary from "@/components/ErrorBoundary"
import { PlusCircle, RefreshCw, Sun, Moon, Columns, Sparkles } from "lucide-react"


export default function Home() {
  const [projects, setProjects]   = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [clients, setClients]     = useState<Client[]>([])
  const [stats, setStats] = useState<DashboardStats>({ total: 0, onProgress: 0, revisi: 0, done: 0, cancel: 0, totalIncome: 0, pipelineIncome: 0 })
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string>("")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [darkMode])

  const triggerToast = (message: string, type: ToastType = "success") => setToast({ message, type })

  const computeStats = useCallback((projects: Project[]): DashboardStats => ({
    total: projects.length,
    onProgress: projects.filter((p) => p.status === "On Progress").length,
    revisi: projects.filter((p) => p.status === "Revisi").length,
    done: projects.filter((p) => p.status === "Done").length,
    cancel: projects.filter((p) => p.status === "Cancel").length,
    totalIncome: projects.filter((p) => p.status === "Done").reduce((sum, p) => sum + p.price, 0),
    pipelineIncome: projects.filter((p) => p.status === "On Progress" || p.status === "Revisi").reduce((sum, p) => sum + p.price, 0),
  }), [])

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const [p, c, cl, fs] = await Promise.all([getProjects(), getCategories(), getClients(), getFinanceSummary()])
      setProjects(p)
      setCategories(c)
      setClients(cl)
      setStats(computeStats(p))
      setFinanceSummary(fs)
      setLastSync(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }, [computeStats])

  useEffect(() => { loadData(true) }, [loadData])

  // Ref untuk track apakah modal sedang terbuka — dibaca di dalam interval
  // tanpa perlu deps array berubah ukuran (fix: Rules of Hooks)
  const modalOpenRef = useRef(false)
  modalOpenRef.current = isModalOpen || isConfirmOpen

  useEffect(() => {
    const INTERVAL_MS = 20000

    intervalRef.current = setInterval(() => {
      // Baca dari ref — tidak perlu tambah deps
      if (modalOpenRef.current) return
      loadData()
    }, INTERVAL_MS)

    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      } else {
        if (!modalOpenRef.current) loadData()
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            if (modalOpenRef.current) return
            loadData()
          }, INTERVAL_MS)
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [loadData])

  const handleSaveProject = async (data: ProjectFormData) => {
    try {
      if (projectToEdit) {
        await updateProject(projectToEdit.id, data)
        triggerToast("Proyek berhasil diperbarui!")
      } else {
        await createProject(data)
        triggerToast("Proyek berhasil ditambahkan!")
      }
      setProjectToEdit(null)
      await loadData()
    } catch {
      triggerToast("Gagal simpan proyek.", "warning")
    }
  }

  const handleStatusChange = async (id: string, status: ProjectStatus) => {
    try {
      await updateProjectStatus(id, status)
      triggerToast(`Status diganti jadi ${status}.`)
      await loadData()
    } catch {
      triggerToast("Gagal ubah status.", "warning")
    }
  }

  const handleDeleteClick = (project: Project) => { setProjectToDelete(project); setIsConfirmOpen(true) }
  const handleEditClick = (project: Project) => { setProjectToEdit(project); setIsModalOpen(true) }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return
    try {
      await deleteProject(projectToDelete.id)
      triggerToast(`"${projectToDelete.projectTitle}" berhasil dihapus.`, "warning")
      await loadData()
    } catch {
      triggerToast("Gagal hapus proyek.", "warning")
    }
    setIsConfirmOpen(false)
    setProjectToDelete(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#a78bfa] text-white flex items-center justify-center font-serif italic text-base shadow-lg animate-pulse">
              ds
            </div>
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#7c5cfc]/20 to-[#a78bfa]/20 blur-lg animate-pulse" />
          </div>
          <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e]">Memuat...</span>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a12] text-[#1d1d1f] dark:text-[#e4e4ed] flex flex-col md:flex-row font-sans transition-colors duration-500">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6 overflow-y-auto mb-16 md:mb-0 transition-all duration-300 mx-auto ${sidebarOpen ? "max-w-6xl" : "max-w-7xl"}`}>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200/30 dark:via-[#1e1e30] to-transparent" />
          <div>
            <div className="flex items-center gap-2" title={`Terakhir sinkron: ${lastSync}`}>
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                <span className="relative w-1 h-1 rounded-full bg-emerald-500 m-auto" />
              </span>
              <span className="text-[9px] text-neutral-400 dark:text-[#5a5a6e]">Live</span>
              {lastSync && <span className="text-[8px] text-neutral-400/60 dark:text-[#5a5a6e]/60">{lastSync}</span>}
            </div>
            <h1 className="text-xl sm:text-2xl font-light text-neutral-950 dark:text-[#e4e4ed] mt-1">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="hidden md:inline-flex p-1 mr-1 hover:bg-neutral-100 dark:hover:bg-[#141422] text-neutral-400 hover:text-neutral-950 dark:hover:text-[#e4e4ed] rounded-lg transition-colors cursor-pointer">
                  <Columns className="w-4 h-4" />
                </button>
              )}
              {activeTab === "dashboard" && <>Beranda <span className="font-serif italic text-[#7c5cfc] dark:text-[#a78bfa]">Studio</span></>}
              {activeTab === "projects" && <>Proyek <span className="font-serif italic text-[#7c5cfc] dark:text-[#a78bfa]">Desain</span></>}
              {activeTab === "keuangan" && <>Keuangan <span className="font-serif italic text-[#7c5cfc] dark:text-[#a78bfa]">Bisnis</span></>}
              {activeTab === "crm" && <>Klien <span className="font-serif italic text-[#7c5cfc] dark:text-[#a78bfa]">CRM</span></>}
              {activeTab === "analytics" && <>Laporan <span className="font-serif italic text-[#7c5cfc] dark:text-[#a78bfa]">Keuangan</span></>}
              {activeTab === "categories" && <>Kategori <span className="font-serif italic text-[#7c5cfc] dark:text-[#a78bfa]">Layanan</span></>}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 text-neutral-400 hover:text-neutral-950 dark:hover:text-[#e4e4ed] rounded-lg transition-all cursor-pointer hover:bg-neutral-100/30 dark:hover:bg-[#141422]/60">
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { setProjectToEdit(null); setIsModalOpen(true) }} className="px-4 py-1.5 bg-[#7c5cfc] hover:bg-[#6b4fe0] text-white text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.97]">
              <PlusCircle className="w-3.5 h-3.5" />Baru
            </button>
          </div>
        </header>

        <div className="space-y-4 min-h-[50vh] transition-all duration-300">
          {activeTab === "dashboard" && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <StatsGrid stats={stats} financeSummary={financeSummary} />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
                {/* Kolom Kiri: Proyek Terbaru (Lebih Lebar) */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                  <div className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-2xl p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#7c5cfc]/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-[#7c5cfc]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#e4e4ed]">Proyek Terbaru</h3>
                          <p className="text-[10px] text-neutral-500 dark:text-[#8b8b9e]">Proyek yang baru saja ditambahkan</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab("projects")} className="text-xs font-medium text-[#7c5cfc] hover:text-[#6b4fe0] dark:text-[#a78bfa] dark:hover:text-[#c4b5fd] transition-colors cursor-pointer flex items-center gap-1 bg-[#7c5cfc]/5 hover:bg-[#7c5cfc]/10 px-3 py-1.5 rounded-lg">
                        Lihat semua &rarr;
                      </button>
                    </div>
                    <ProjectList projects={projects} categories={categories} onEdit={handleEditClick} onDelete={handleDeleteClick} onStatusChange={handleStatusChange} isDashboard={true} />
                  </div>
                </div>

                {/* Kolom Kanan: Quick Actions & Deadlines */}
                <div className="xl:col-span-1 space-y-4 sm:space-y-6">
                  <QuickActions
                    onNewProject={() => { setProjectToEdit(null); setIsModalOpen(true) }}
                    onNavigate={setActiveTab}
                  />
                  <UpcomingDeadlines
                    projects={projects}
                    onViewAll={() => setActiveTab("projects")}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <h3 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e]">Semua Proyek</h3>
                <p className="text-xs text-neutral-400 dark:text-[#8b8b9e] mt-0.5">Semua proyek yang pernah dikerjain.</p>
              </div>
              <ProjectList projects={projects} categories={categories} onEdit={handleEditClick} onDelete={handleDeleteClick} onStatusChange={handleStatusChange} />
            </div>
          )}

          {activeTab === "keuangan" && <FinanceDashboard />}

          {activeTab === "analytics" && <AnalyticsSection projects={projects} darkMode={darkMode} />}

          {activeTab === "crm" && <CRMManager clients={clients} onChange={loadData} />}

          {activeTab === "categories" && <CategoryManager categories={categories} onChange={loadData} />}
        </div>
      </main>

      <ProjectForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setProjectToEdit(null) }}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
        categories={categories}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Hapus Proyek"
        projectName={projectToDelete?.projectTitle || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsConfirmOpen(false); setProjectToDelete(null) }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
    </ErrorBoundary>
  )
}
