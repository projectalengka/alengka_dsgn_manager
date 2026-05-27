"use client"

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react"
import type { Project, Category, ProjectFormData, ProjectStatus, Client } from "@/types"
import { X, Search, Users, Link as LinkIcon } from "lucide-react"
import { searchClients } from "@/actions/clients"

interface ProjectFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProjectFormData) => void
  projectToEdit?: Project | null
  categories: Category[]
  clients?: Client[]
}

const STATUS_OPTS = [
  { value: "On Progress" as ProjectStatus, label: "Berjalan" },
  { value: "Revisi" as ProjectStatus, label: "Revisi" },
  { value: "Done" as ProjectStatus, label: "Selesai" },
  { value: "Cancel" as ProjectStatus, label: "Batal" },
]

export default function ProjectForm({ isOpen, onClose, onSave, projectToEdit, categories }: ProjectFormProps) {
  const [clientName, setClientName]   = useState("")
  const [clientId, setClientId]       = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const clientInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [projectTitle, setProjectTitle] = useState("")
  const [categoryId, setCategoryId]   = useState("")
  const [price, setPrice]             = useState<number | "">("")
  const [status, setStatus]           = useState<ProjectStatus>("On Progress")
  const [deadline, setDeadline]       = useState("")
  const [notes, setNotes]             = useState("")
  const [referenceLink, setReferenceLink] = useState("")
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (projectToEdit) {
      setClientName(projectToEdit.clientName)
      setClientId(projectToEdit.clientId ?? null)
      setClientSearch(projectToEdit.clientName)
      setProjectTitle(projectToEdit.projectTitle)
      setCategoryId(projectToEdit.categoryId)
      setPrice(projectToEdit.price)
      setStatus(projectToEdit.status)
      setDeadline(new Date(projectToEdit.deadline).toISOString().split("T")[0])
      setNotes(projectToEdit.notes)
      setReferenceLink(projectToEdit.referenceLink || "")
    } else {
      setClientName("")
      setClientId(null)
      setClientSearch("")
      setProjectTitle("")
      setCategoryId(categories[0]?.id || "")
      setPrice("")
      setStatus("On Progress")
      setDeadline("")
      setNotes("")
      setReferenceLink("")
    }
    setShowSuggestions(false)
  }, [projectToEdit, isOpen, categories])

  // Debounced client search
  useEffect(() => {
    // Jika clientId sudah terset = klien sudah dipilih, tidak perlu search lagi
    if (clientId !== null) {
      setClientSuggestions([])
      return
    }
    // Input kosong: clear suggestions
    if (!clientSearch.trim()) {
      setClientSuggestions([])
      setShowSuggestions(false)
      return
    }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchClients(clientSearch)
        setClientSuggestions(results)
        setShowSuggestions(results.length > 0)
      } finally { setSearchLoading(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [clientSearch, clientId])

  // Tampilkan semua klien saat input difokus & kosong
  const handleClientFocus = async () => {
    if (clientId || clientSearch.trim()) {
      if (clientSuggestions.length > 0) setShowSuggestions(true)
      return
    }
    setSearchLoading(true)
    try {
      const results = await searchClients("")  // empty = return all (max 10)
      setClientSuggestions(results)
      setShowSuggestions(results.length > 0)
    } finally { setSearchLoading(false) }
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!suggestionsRef.current?.contains(e.target as Node) &&
          !clientInputRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectClient = (c: Client) => {
    setClientName(c.name)
    setClientId(c.id)
    setClientSearch(c.name)
    setShowSuggestions(false)
    setClientSuggestions([])
  }

  const handleClientInputChange = (val: string) => {
    setClientSearch(val)
    setClientName(val)
    setClientId(null)  // unlink jika user mengetik manual
  }

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !projectTitle.trim() || price === "" || !deadline) return
    setSaving(true)
    try {
      await onSave({
        clientName: clientName.trim(),
        clientId: clientId || null,
        projectTitle: projectTitle.trim(),
        categoryId,
        price: Number(price),
        status,
        deadline,
        notes: notes.trim(),
        referenceLink: referenceLink.trim() || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-[#09090b]/40 dark:bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0d0d0f] border border-neutral-200/70 dark:border-neutral-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in transition-colors duration-500">
        <div className="sticky top-0 bg-white/95 dark:bg-[#0d0d0f]/95 backdrop-blur-md px-8 py-5 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between z-20">
          <div>
            <h2 className="text-[10px] font-medium text-neutral-400 dark:text-neutral-550 uppercase tracking-[0.2em]">
              {projectToEdit ? "Edit Proyek" : "Tambah Proyek"}
            </h2>
            <p className="text-xs text-neutral-450 dark:text-neutral-400 mt-0.5">Isi detail proyek yang mau dikerjain.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Client search field */}
            <div className="space-y-1.5 relative">
              <label className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
                Nama Klien *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                <input
                  ref={clientInputRef}
                  id="client-name"
                  type="text"
                  placeholder="Cari atau ketik nama klien..."
                  value={clientSearch}
                  onChange={e => handleClientInputChange(e.target.value)}
                  onFocus={handleClientFocus}
                  required
                  className="w-full bg-[#f5f5f7] dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-850 rounded-lg text-xs pl-9 pr-4 py-2.5 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-350 dark:focus:border-neutral-700 transition-all"
                />
                {searchLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />}
              </div>
              {/* Linked badge */}
              {clientId && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 rounded-full">
                    <Users className="w-2.5 h-2.5" /> Tertaut dari CRM
                  </span>
                  <button type="button" onClick={() => { setClientId(null) }} className="text-[9px] text-neutral-400 hover:text-neutral-600 cursor-pointer">Lepas</button>
                </div>
              )}
              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0d0d0f] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                  {clientSuggestions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectClient(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ background: `hsl(${c.name.split("").reduce((a,ch)=>a+ch.charCodeAt(0),0)%360}, 55%, 48%)` }}>
                        {c.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{c.name}</div>
                        <div className="text-[9px] text-neutral-400 truncate">{c.company || c.phone || c.email}</div>
                      </div>
                      <span className="ml-auto text-[9px] text-neutral-400 shrink-0">{c._count?.projects ?? 0} proyek</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="project-title" className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Judul Proyek *</label>
              <input id="project-title" type="text" placeholder="cth: Desain Logo" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required className="w-full bg-[#f5f5f7] dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-850 rounded-lg text-xs px-4 py-2.5 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-350 dark:focus:border-neutral-700 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="category-select" className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Kategori</label>
              <select id="category-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-[#f5f5f7] dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-850 rounded-lg text-xs px-4 py-2.5 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-neutral-350 dark:focus:border-neutral-700 cursor-pointer transition-all">
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="project-price" className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Harga *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-mono font-medium">Rp</span>
                <input id="project-price" type="number" min="0" placeholder="3000000" value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} required className="w-full bg-[#f5f5f7] dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-850 rounded-lg text-xs pl-11 pr-4 py-2.5 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-350 dark:focus:border-neutral-700 font-mono transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="project-deadline" className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Deadline *</label>
              <input id="project-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="w-full bg-[#f5f5f7] dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-850 rounded-lg text-xs px-4 py-2.5 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-neutral-350 dark:focus:border-neutral-700 cursor-pointer transition-all" />
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Status</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-neutral-100 dark:border-neutral-900 p-1 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-lg">
              {STATUS_OPTS.map((item) => (
                <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`px-3 py-2 text-xs font-medium text-center rounded transition-all cursor-pointer ${status === item.value ? "bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 shadow-sm border border-neutral-150 dark:border-neutral-800 font-semibold" : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-350"}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-notes" className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Catatan</label>
            <textarea id="project-notes" rows={4} placeholder="Catatan tambahan..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#f5f5f7] dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-850 rounded-lg text-xs px-4 py-2.5 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-350 dark:focus:border-neutral-700 resize-y leading-relaxed" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-link" className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Link Referensi (Opsional)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                id="project-link"
                type="url"
                placeholder="Contoh: https://docs.google.com/..."
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                className="w-full bg-[#f5f5f7] dark:bg-[#121214] border border-neutral-200/60 dark:border-neutral-850 rounded-lg text-xs pl-10 pr-4 py-2.5 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-350 dark:focus:border-neutral-700 transition-all"
              />
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-900/60 pt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 border border-neutral-200 dark:border-neutral-850 text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-neutral-50 hover:text-neutral-850 dark:hover:text-neutral-100 dark:hover:bg-neutral-900 transition-all text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Batal</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 font-semibold rounded-lg hover:opacity-90 transition-all text-xs cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {saving ? (
                <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />{projectToEdit ? "Menyimpan..." : "Menambah..."}</>
              ) : (
                projectToEdit ? "Simpan" : "Tambah Proyek"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
