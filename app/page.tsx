"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Project, Category, Tab, ProjectFormData, ProjectStatus, DashboardStats } from "@/types"
import { getProjects, createProject, updateProject, deleteProject, updateProjectStatus } from "@/actions/projects"
import { getCategories } from "@/actions/categories"
import Sidebar from "@/components/layout/Sidebar"
import StatsGrid from "@/components/dashboard/StatsGrid"
import AnalyticsSection from "@/components/dashboard/AnalyticsSection"
import ProjectList from "@/components/projects/ProjectList"
import ProjectForm from "@/components/projects/ProjectForm"
import ConfirmModal from "@/components/projects/ConfirmModal"
import CategoryManager from "@/components/categories/CategoryManager"
import Toast, { type ToastType } from "@/components/ui/Toast"
import ErrorBoundary from "@/components/ErrorBoundary"
import { PlusCircle, RefreshCw, Sun, Moon, Columns } from "lucide-react"


export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<DashboardStats>({ total: 0, onProgress: 0, revisi: 0, done: 0, cancel: 0, totalIncome: 0, pipelineIncome: 0 })
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
      const [p, c] = await Promise.all([getProjects(), getCategories()])
      setProjects(p)
      setCategories(c)
      setStats(computeStats(p))
      setLastSync(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }, [computeStats])

  useEffect(() => { loadData(true) }, [loadData])

  useEffect(() => {
    intervalRef.current = setInterval(() => loadData(), 15000)

    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      } else {
        if (!intervalRef.current) { loadData(); intervalRef.current = setInterval(() => loadData(), 15000) }
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
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
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded bg-neutral-950 dark:bg-neutral-100 text-white dark:text-neutral-950 flex items-center justify-center font-serif italic text-xs font-medium uppercase animate-pulse">ds</div>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono tracking-widest uppercase">Memuat...</span>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col md:flex-row font-sans transition-colors duration-500">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6 overflow-y-auto mb-16 md:mb-0 transition-all duration-300 mx-auto ${sidebarOpen ? "max-w-6xl" : "max-w-7xl"}`}>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-200/30 dark:border-neutral-900 pb-6">
          <div>
            <div className="flex items-center gap-2" title={`Terakhir sinkron: ${lastSync}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8.5px] text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-[0.2em] font-medium">Live</span>
              {lastSync && <span className="text-[8px] text-neutral-400/60 dark:text-neutral-600 font-mono">{lastSync}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-neutral-950 dark:text-neutral-50 tracking-tight mt-1.5 flex items-center gap-2">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="hidden md:inline-flex p-1.5 mr-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-400 hover:text-neutral-950 dark:hover:text-white rounded-lg transition-colors cursor-pointer">
                  <Columns className="w-4 h-4" />
                </button>
              )}
              {activeTab === "dashboard" && <>Beranda <span className="font-serif italic font-normal text-neutral-400 dark:text-neutral-500">Desk</span></>}
              {activeTab === "projects" && <>Proyek <span className="font-serif italic font-normal text-neutral-400 dark:text-neutral-500">Desain</span></>}
              {activeTab === "analytics" && <>Laporan <span className="font-serif italic font-normal text-neutral-400 dark:text-neutral-500">Keuangan</span></>}
              {activeTab === "categories" && <>Kategori <span className="font-serif italic font-normal text-neutral-400 dark:text-neutral-500">Layanan</span></>}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-neutral-400 hover:text-neutral-950 dark:hover:text-white rounded-lg transition-all cursor-pointer bg-neutral-100/10 hover:bg-neutral-100/30 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/30">
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-500" />}
            </button>
            <button onClick={() => loadData()} className="px-3 py-1.5 text-neutral-400 hover:text-neutral-950 dark:hover:text-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-neutral-100/30 dark:hover:bg-neutral-900/30">
              <RefreshCw className="w-3 h-3" />Refresh
            </button>
            <button onClick={() => { setProjectToEdit(null); setIsModalOpen(true) }} className="px-4 py-1.5 bg-neutral-950 dark:bg-neutral-100 hover:bg-neutral-850 dark:hover:bg-white text-white dark:text-neutral-950 font-medium rounded-full text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]">
              <PlusCircle className="w-3.5 h-3.5" />Baru
            </button>
          </div>
        </header>

        <div className="space-y-6 min-h-[50vh] transition-all duration-300">
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              <StatsGrid stats={stats} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-12">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">Proyek Terbaru</h3>
                      <p className="text-xs text-neutral-450 dark:text-neutral-400 mt-0.5">5 proyek terbaru</p>
                    </div>
                    <button onClick={() => setActiveTab("projects")} className="text-xs text-neutral-500 hover:text-neutral-950 dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer">
                      Lihat Semua &rarr;
                    </button>
                  </div>
                  <ProjectList projects={projects} categories={categories} onEdit={handleEditClick} onDelete={handleDeleteClick} onStatusChange={handleStatusChange} isDashboard={true} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="animate-fade-in">
              <div className="mb-5">
                <h3 className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">Semua Proyek</h3>
                <p className="text-xs text-neutral-450 dark:text-neutral-400 mt-0.5">Semua proyek yang pernah dikerjain.</p>
              </div>
              <ProjectList projects={projects} categories={categories} onEdit={handleEditClick} onDelete={handleDeleteClick} onStatusChange={handleStatusChange} />
            </div>
          )}

          {activeTab === "analytics" && <AnalyticsSection projects={projects} darkMode={darkMode} />}

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
