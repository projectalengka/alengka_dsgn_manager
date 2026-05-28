"use client"

import { useState } from "react"
import type { Category } from "@/types"
import { Plus, Trash2, AlertTriangle, X, Check } from "lucide-react"
import { renderIcon } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories"

const AVAILABLE_ICONS = [
  { name: "Sparkles", label: "Kreatif" }, { name: "Shirt", label: "Pakaian" },
  { name: "PenTool", label: "Vektor" }, { name: "Laptop", label: "UI/Web" },
  { name: "Compass", label: "Branding" }, { name: "ImageIcon", label: "Ilustrasi" },
  { name: "Video", label: "Animasi" }, { name: "Layers", label: "Umum" },
  { name: "Palette", label: "Warna" }, { name: "Briefcase", label: "Bisnis" },
  { name: "Brush", label: "Lukisan" }, { name: "Smartphone", label: "Aplikasi" },
  { name: "BookOpen", label: "Editorial" }, { name: "Tag", label: "Label" },
  { name: "Scissors", label: "Kerajinan" },
]



interface CategoryManagerProps {
  categories: Category[]
  onChange?: () => void
}

export default function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [newName, setNewName] = useState("")
  const [defaultPrice, setDefaultPrice] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("Tag")
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const name = newName.trim()
    if (!name) { setError("Nama kategori harus diisi."); return }
    const exists = categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editing?.id)
    if (exists) { setError("Nama kategori sudah ada."); return }
    try {
      const priceNum = parseFloat(defaultPrice) || 0
      if (editing) {
        await updateCategory(editing.id, name, selectedIcon, priceNum); setEditing(null)
      } else {
        await createCategory(name, selectedIcon, priceNum)
      }
      setNewName(""); setDefaultPrice(""); setSelectedIcon("Tag")
      onChange?.()
    } catch {
      setError("Gagal simpan kategori.")
    }
  }

  const startEdit = (cat: Category) => { setEditing(cat); setNewName(cat.name); setDefaultPrice(cat.defaultPrice?.toString() || ""); setSelectedIcon(cat.iconName); setError("") }
  const cancelEdit = () => { setEditing(null); setNewName(""); setDefaultPrice(""); setSelectedIcon("Tag"); setError("") }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e] tracking-[0.2em] uppercase">Kategori</h2>
        <p className="text-xs text-neutral-450 dark:text-[#8b8b9e] mt-0.5">Tambah atau edit kategori proyek.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200/60 dark:border-[#1e1e30] rounded-xl p-6 shadow-xs h-fit space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-850 dark:text-[#c8c8d8] block">{editing ? "Edit Kategori" : "Tambah Kategori"}</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-550 block mt-0.5">{editing ? "Ubah nama dan ikon." : "Kasih nama dan pilih ikon."}</span>
            </div>
            {editing && <button onClick={cancelEdit} className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-[#c8c8d8] rounded-lg bg-neutral-100 dark:bg-[#141422] transition-all cursor-pointer"><X className="w-3.5 h-3.5" /></button>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-450 dark:text-[#5a5a6e]">Nama Kategori</label>
              <input type="text" required placeholder="cth: Desain Logo" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-[#f5f5f7] dark:bg-[#141422] border border-neutral-200/60 dark:border-[#232338] text-xs px-3.5 py-2.5 rounded-lg text-neutral-800 dark:text-[#c8c8d8] placeholder-neutral-400 focus:outline-none focus:border-neutral-350 dark:focus:border-[#7c5cfc]/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-450 dark:text-[#5a5a6e]">Harga Default (Opsional)</label>
              <input type="number" placeholder="cth: 500000" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} className="w-full bg-[#f5f5f7] dark:bg-[#141422] border border-neutral-200/60 dark:border-[#232338] text-xs px-3.5 py-2.5 rounded-lg text-neutral-800 dark:text-[#c8c8d8] placeholder-neutral-400 focus:outline-none focus:border-neutral-350 dark:focus:border-[#7c5cfc]/50 transition-all" />
            </div>
            <div className="space-y-2.5">
              <label className="block text-[9px] uppercase font-medium tracking-[0.15em] text-neutral-450 dark:text-[#5a5a6e]">Pilih Ikon</label>
              <div className="grid grid-cols-4 gap-2 border border-neutral-200/50 dark:border-[#232338] p-3 rounded-lg bg-neutral-50/50 dark:bg-[#0a0a12]/50">
                {AVAILABLE_ICONS.map((ico) => (
                  <button key={ico.name} type="button" onClick={() => setSelectedIcon(ico.name)} title={ico.label}
                    className={`p-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      selectedIcon === ico.name ? "bg-[#7c5cfc] dark:bg-[#7c5cfc] border-transparent text-white dark:text-white scale-105 shadow-xs" : "bg-white dark:bg-[#141422]/60 border-neutral-200/70 dark:border-[#1e1e30] text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                    }`}>
                    {renderIcon(ico.name)}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-[10px] text-red-500 font-medium bg-red-500/10 p-2.5 rounded-lg flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
            <button type="submit" className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg bg-[#7c5cfc] hover:bg-[#6b4fe0] dark:bg-[#7c5cfc] dark:hover:bg-[#6b4fe0] text-white dark:text-white transition-all cursor-pointer">
              {editing ? <><Check className="w-3.5 h-3.5" />Simpan</> : <><Plus className="w-3.5 h-3.5" />Tambah</>}
            </button>
            {editing && <button type="button" onClick={cancelEdit} className="w-full py-2.5 text-xs font-medium rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-[#c8c8d8] transition-all cursor-pointer border border-neutral-200 dark:border-[#232338]">Batal</button>}
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <span className="text-xs font-semibold text-neutral-850 dark:text-[#c8c8d8] block">Semua Kategori ({categories.length})</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white dark:bg-[#0f0f1a]/60 border border-neutral-200/60 dark:border-[#1e1e30] rounded-xl p-5 flex items-center justify-between group transition-all hover:border-neutral-350 dark:hover:border-[#7c5cfc]/20">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-50 dark:bg-[#141422] border border-neutral-150 dark:border-[#232338] flex items-center justify-center text-neutral-600 dark:text-[#a0a0b4]">
                    {renderIcon(cat.iconName)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-[#e4e4ed] block truncate">{cat.name}</span>
                    <span className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] block">
                      {cat._count?.projects || 0} proyek {cat.defaultPrice > 0 && `• ${formatCurrency(cat.defaultPrice)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => startEdit(cat)} className={`p-2 rounded-lg transition-all cursor-pointer ${editing?.id === cat.id ? "bg-[#7c5cfc] dark:bg-[#7c5cfc] text-white dark:text-white scale-105 shadow-xs" : "text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#1a1a2e]"}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteTarget(cat)} className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-[#1a1a2e] transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#09090b]/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-[#0f0f1a] border border-neutral-200/70 dark:border-[#1e1e30] rounded-lg w-full max-w-sm p-6 sm:p-7 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-500 flex-shrink-0"><AlertTriangle className="w-4 h-4" /></div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-[#e4e4ed]">Hapus Kategori?</h3>
                <p className="mt-1.5 text-[11px] text-neutral-450 dark:text-[#8b8b9e] leading-relaxed">
                  Yakin mau hapus kategori <span className="font-semibold">&quot;{deleteTarget.name}&quot;</span>?
                  {(deleteTarget._count?.projects || 0) > 0 && (
                    <span className="block mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 p-2 rounded border border-amber-500/10">{deleteTarget._count?.projects} proyek di dalamnya bakal kehapus juga.</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-[#1e1e30]/60 pt-3.5">
              <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 border border-neutral-200 dark:border-[#232338] text-neutral-500 rounded-md hover:bg-neutral-50 dark:hover:bg-[#141422] transition-all text-[11px] font-medium cursor-pointer">Batal</button>
              <button onClick={async () => { await deleteCategory(deleteTarget.id); setDeleteTarget(null); onChange?.() }} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-all text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs">
                <Trash2 className="w-3 h-3" />Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
