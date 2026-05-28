"use client"

import { useState, useCallback } from "react"
import type { Client, ClientFormData } from "@/types"
import { createClient, updateClient, deleteClient } from "@/actions/clients"
import {
  Users, Plus, Search, Phone, Mail, MapPin, Building2,
  Edit2, Trash2, X, Loader2, FileText, ChevronRight
} from "lucide-react"

interface CRMManagerProps {
  clients: Client[]
  onChange: () => void
}

const EMPTY_FORM: ClientFormData = {
  name: "", phone: "", email: "", address: "", company: "", notes: "",
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 select-none"
      style={{ background: `hsl(${hue}, 55%, 48%)` }}
    >
      {initials || "?"}
    </div>
  )
}

export default function CRMManager({ clients, onChange }: CRMManagerProps) {
  const [search, setSearch]             = useState("")
  const [isFormOpen, setIsFormOpen]     = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [form, setForm]                 = useState<ClientFormData>(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [error, setError]               = useState("")

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q)
      || c.company.toLowerCase().includes(q)
      || c.email.toLowerCase().includes(q)
      || c.phone.includes(q)
  })

  const openCreate = () => {
    setEditingClient(null)
    setForm(EMPTY_FORM)
    setError("")
    setIsFormOpen(true)
  }

  const openEdit = (c: Client) => {
    setEditingClient(c)
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, company: c.company, notes: c.notes })
    setError("")
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Nama klien wajib diisi."); return }
    setSaving(true); setError("")
    try {
      if (editingClient) await updateClient(editingClient.id, form)
      else await createClient(form)
      onChange()
      setIsFormOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.")
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteClient(deleteTarget.id)
      onChange()
      if (selectedClient?.id === deleteTarget.id) setSelectedClient(null)
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  const fld = useCallback((key: keyof ClientFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  }), [form])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[10px] font-medium text-neutral-400 dark:text-[#5a5a6e] uppercase tracking-[0.2em]">Database Klien</h3>
          <p className="text-xs text-neutral-450 dark:text-[#8b8b9e] mt-0.5">{clients.length} klien terdaftar</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#7c5cfc] hover:bg-[#6b4fe0] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Klien
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Cari klien, perusahaan, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-800 dark:text-[#c8c8d8] placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-[#7c5cfc]/50 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-[#141422] border border-neutral-200 dark:border-[#2a2a44] flex items-center justify-center text-neutral-400 mx-auto mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-[#e4e4ed]">Belum ada klien</p>
          <p className="text-xs text-neutral-400 mt-1">Tambah klien pertamamu sekarang</p>
          <button onClick={openCreate} className="mt-4 px-4 py-2 bg-[#7c5cfc] hover:bg-[#6b4fe0] text-white rounded-xl text-xs font-semibold cursor-pointer transition-all">
            + Tambah Klien
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(c => (
            <div
              key={c.id}
              className="bg-white dark:bg-[#0f0f1a]/80 border border-neutral-200 dark:border-[#1e1e30] rounded-xl p-4 hover:border-neutral-300 dark:hover:border-[#7c5cfc]/20 transition-all cursor-pointer group"
              onClick={() => setSelectedClient(c.id === selectedClient?.id ? null : c)}
            >
              <div className="flex items-start gap-3">
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-[#e4e4ed] truncate">{c.name}</div>
                      {c.company && <div className="text-[10px] text-neutral-400 dark:text-[#8b8b9e] truncate flex items-center gap-1 mt-0.5"><Building2 className="w-2.5 h-2.5" />{c.company}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); openEdit(c) }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-[#e4e4ed] hover:bg-neutral-100 dark:hover:bg-[#1a1a2e] rounded-lg transition-all cursor-pointer">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(c) }}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline">
                        <Phone className="w-2.5 h-2.5" />{c.phone}
                      </a>
                    )}
                    {c.email && <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-[#8b8b9e]"><Mail className="w-2.5 h-2.5" />{c.email}</div>}
                    {c.address && <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-[#5a5a6e] truncate"><MapPin className="w-2.5 h-2.5 shrink-0" />{c.address}</div>}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-[#141422] text-[9px] font-medium text-neutral-500 dark:text-[#8b8b9e] rounded-full">
                      <FileText className="w-2.5 h-2.5" />{c._count?.projects ?? 0} proyek
                    </span>
                    <ChevronRight className={`w-3 h-3 text-neutral-400 transition-transform ${selectedClient?.id === c.id ? "rotate-90" : ""}`} />
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {selectedClient?.id === c.id && c.notes && (
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-[#1e1e30]">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">Catatan</p>
                  <p className="text-[11px] text-neutral-600 dark:text-[#8b8b9e] leading-relaxed">{c.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── FORM MODAL ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-white dark:bg-[#0f0f1a] border border-neutral-200 dark:border-[#1e1e30] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

            <div className="sticky top-0 bg-white dark:bg-[#0f0f1a] px-6 py-4 border-b border-neutral-100 dark:border-[#1e1e30] flex items-center justify-between z-10">
              <div>
                <h2 className="text-xs font-bold text-neutral-900 dark:text-[#e4e4ed]">{editingClient ? "Edit Klien" : "Tambah Klien Baru"}</h2>
                <p className="text-[10px] text-neutral-400 dark:text-[#5a5a6e] mt-0.5">Hanya nama yang wajib diisi</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl bg-neutral-100 dark:bg-[#141422] text-neutral-400 hover:text-neutral-800 dark:hover:text-[#e4e4ed] transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>}

              <FormField label="Nama Klien *">
                <input type="text" placeholder="cth: Budi Santoso" {...fld("name")}
                  className="form-input" autoFocus />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="No. WhatsApp (opsional)">
                  <input type="text" inputMode="tel" placeholder="+62 812-xxxx-xxxx" {...fld("phone")} className="form-input" />
                </FormField>
                <FormField label="Email (opsional)">
                  <input type="text" inputMode="email" placeholder="budi@email.com" {...fld("email")} className="form-input" />
                </FormField>
              </div>

              <FormField label="Perusahaan / Brand">
                <input type="text" placeholder="Nama perusahaan (opsional)" {...fld("company")} className="form-input" />
              </FormField>

              <FormField label="Alamat">
                <textarea rows={2} placeholder="Alamat lengkap (opsional)" {...fld("address")} className="form-input resize-none" />
              </FormField>

              <FormField label="Catatan">
                <textarea rows={3} placeholder="Catatan khusus tentang klien ini..." {...fld("notes")} className="form-input resize-none" />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={saving}
                  className="flex-1 py-2.5 border border-neutral-200 dark:border-[#232338] text-neutral-500 rounded-xl text-xs font-medium hover:bg-neutral-50 dark:hover:bg-[#141422] transition-all cursor-pointer">
                  Batal
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-[#7c5cfc] hover:bg-[#6b4fe0] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Menyimpan...</> : (editingClient ? "Simpan Perubahan" : "Tambah Klien")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-[#0f0f1a] border border-neutral-200 dark:border-[#1e1e30] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-[#e4e4ed]">Hapus Klien?</h3>
              <p className="text-xs text-neutral-500 dark:text-[#8b8b9e] mt-2">
                <span className="font-semibold text-neutral-700 dark:text-[#a0a0b4]">{deleteTarget.name}</span> akan dihapus.
                {(deleteTarget._count?.projects ?? 0) > 0 && (
                  <> Proyek terkait ({deleteTarget._count?.projects}) <strong>tidak</strong> akan ikut terhapus.</>
                )}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-neutral-200 dark:border-[#232338] text-neutral-500 rounded-xl text-xs font-medium cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#141422] transition-all">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60">
                {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Menghapus...</> : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input {
          display: block; width: 100%;
          background: #f5f5f7; border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px; padding: 8px 12px; font-size: 12px;
          color: #111; outline: none; transition: border 0.2s;
        }
        .dark .form-input {
          background: #141422;
          border-color: #232338; color: #e5e5e5;
        }
        .form-input:focus { border-color: #555; }
        .dark .form-input:focus { border-color: #7c5cfc; }
      `}</style>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[8.5px] font-bold uppercase tracking-[0.15em] text-neutral-400">{label}</label>
      {children}
    </div>
  )
}
