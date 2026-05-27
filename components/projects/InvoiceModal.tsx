"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Project, Category } from "@/types"
import { X, Printer, Loader2, Edit3, Plus, Minus, Eye, ZoomIn, ZoomOut, Maximize2, Building2, ChevronDown, Upload } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getStudioProfile, updateStudioProfile, type StudioProfileFormData } from "@/actions/studio"

// ── Studio Profile (loaded from DB) ──
const DEFAULT_STUDIO: StudioProfileFormData = {
  name: "Design Studio",
  tagline: "Creative Design Solutions",
  address: "Jakarta, Indonesia",
  contact: "studio@example.com | +62 812-3456-7890",
  bankInfo: "BCA 872-0492-911 a.n. Design Studio",
  logo: "",
}

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProjects: Project[]
  categories: Category[]
}

// ── A4 dimensions in px at 96dpi ──
const A4_W_PX = 794   // 210mm
const A4_H_PX = 1123  // 297mm

export default function InvoiceModal({ isOpen, onClose, selectedProjects, categories }: InvoiceModalProps) {
  const [invoiceNo, setInvoiceNo]       = useState("")
  const [issueDate, setIssueDate]       = useState("")
  const [dueDate, setDueDate]           = useState("")
  const [clientName, setClientName]     = useState("")
  const [clientContact, setClientContact] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [taxPercent, setTaxPercent]     = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [progress, setProgress]         = useState(0)
  const [scale, setScale]               = useState(1)   // auto-fit base scale
  const [zoomLevel, setZoomLevel]       = useState(1)   // user zoom multiplier
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [isPaid, setIsPaid]             = useState(false)

  // ── Studio Profile ──
  const [studio, setStudio]             = useState<StudioProfileFormData>(DEFAULT_STUDIO)
  const [showStudioSection, setShowStudioSection] = useState(false)
  const [isSavingStudio, setIsSavingStudio] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const wrapperRef   = useRef<HTMLDivElement>(null)   // scrollable preview area
  const sheetRef     = useRef<HTMLDivElement>(null)   // the A4 sheet (always full size)
  const hiddenRef    = useRef<HTMLDivElement>(null)   // off-screen clone for PDF

  // ── Load studio profile from Database ──
  useEffect(() => {
    async function load() {
      try {
        const data = await getStudioProfile()
        if (data) {
          setStudio({
            name: data.name,
            tagline: data.tagline || "",
            address: data.address || "",
            contact: data.contact || "",
            bankInfo: data.bankInfo || "",
            logo: data.logo || "",
          })
        }
      } catch (err) {
        console.error("Failed to load studio profile:", err)
      }
    }
    load()
  }, [])

  const updateStudioField = (key: keyof StudioProfileFormData, val: string) => {
    setStudio(s => ({ ...s, [key]: val }))
  }

  // ── Save studio profile to Database ──
  const saveStudioProfile = async () => {
    setIsSavingStudio(true)
    try {
      await updateStudioProfile(studio)
    } catch (err) {
      console.error("Failed to save studio profile:", err)
    } finally {
      setIsSavingStudio(false)
    }
  }

  // Auto-save on specific fields change is too aggressive for DB, better to use debounce
  // or explicit save. We'll use a debounce approach for DB save.
  useEffect(() => {
    const t = setTimeout(() => {
      saveStudioProfile()
    }, 1500) // debounce 1.5s
    return () => clearTimeout(t)
  }, [studio])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === "string") updateStudioField("logo", reader.result) }
    reader.readAsDataURL(file)
  }

  // ── Auto-fill on open ──
  useEffect(() => {
    if (!isOpen || selectedProjects.length === 0) return
    const unique = Array.from(new Set(selectedProjects.map(p => p.clientName)))
    setClientName(unique.length === 1 ? unique[0] : unique.join(", "))
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const ymd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    setInvoiceNo(`INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(100 + Math.random() * 900)}`)
    setIssueDate(ymd)
    const due = new Date(); due.setDate(due.getDate() + 14)
    setDueDate(`${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`)
  }, [isOpen, selectedProjects])

  // ── Responsive scale: fit A4 into the wrapper ──
  const recalcScale = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    const pad = 32
    const sw = (el.clientWidth - pad) / A4_W_PX
    const sh = (el.clientHeight - pad) / A4_H_PX
    setScale(Math.min(sw, sh, 1))
  }, [])

  useEffect(() => {
    if (!isOpen) return
    recalcScale()
    const ro = new ResizeObserver(recalcScale)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [isOpen, recalcScale, showMobilePreview])

  // ── Ctrl+Wheel zoom ──
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoomLevel(z => Math.min(Math.max(z + delta, 0.3), 3))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [isOpen, showMobilePreview])

  const ZOOM_STEP   = 0.15
  const zoomIn      = () => setZoomLevel(z => Math.min(+(z + ZOOM_STEP).toFixed(2), 3))
  const zoomOut     = () => setZoomLevel(z => Math.max(+(z - ZOOM_STEP).toFixed(2), 0.3))
  const zoomReset   = () => setZoomLevel(1)
  const totalScale  = scale * zoomLevel

  if (!isOpen || selectedProjects.length === 0) return null

  const subtotal    = selectedProjects.reduce((a, p) => a + p.price, 0)
  const taxAmount   = (subtotal * taxPercent) / 100
  const totalAmount = subtotal + taxAmount - discountAmount

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name ?? id

  // ── PDF: capture the HIDDEN full-size clone ──
  const handlePrint = async () => {
    setIsGeneratingPdf(true); setProgress(10)
    try {
      const { default: html2canvas } = await import("html2canvas")
      setProgress(30)
      const { default: jsPDF } = await import("jspdf")
      setProgress(50)

      const el = hiddenRef.current
      if (!el) { setIsGeneratingPdf(false); return }

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: A4_W_PX,
        height: el.scrollHeight,
        windowWidth: A4_W_PX,
      })
      setProgress(75)

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [A4_W_PX, A4_H_PX] })
      const pdfW = A4_W_PX
      const pdfH = A4_H_PX
      const imgH = (canvas.height * pdfW) / canvas.width

      pdf.addImage(canvas.toDataURL("image/png", 1.0), "PNG", 0, 0, pdfW, imgH, "", "FAST")

      let remaining = imgH - pdfH
      let yOffset   = -pdfH
      while (remaining > 0.5) {
        pdf.addPage()
        pdf.addImage(canvas.toDataURL("image/png", 1.0), "PNG", 0, yOffset, pdfW, imgH, "", "FAST")
        yOffset   -= pdfH
        remaining -= pdfH
      }

      setProgress(95)
      pdf.save(`Invoice_${invoiceNo.replace(/\s+/g, "_")}.pdf`)
    } catch (err) {
      console.error("PDF error:", err)
      window.print()
    } finally {
      setIsGeneratingPdf(false); setProgress(0)
    }
  }

  // ── Shared invoice content (rendered in both visible + hidden) ──
  const InvoiceContent = () => (
    <div
      style={{
        width: "100%",
        minHeight: `${A4_H_PX}px`,
        padding: "64px 60px 48px",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: "12px",
        lineHeight: 1.6,
        color: "#111",
        background: "#fff",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* ── CAP PAID ── */}
      {isPaid && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-32deg)",
          border: "6px solid #16a34a",
          borderRadius: 8,
          padding: "10px 28px",
          color: "#16a34a",
          fontSize: 52,
          fontWeight: 900,
          letterSpacing: 10,
          textTransform: "uppercase",
          opacity: 0.18,
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          zIndex: 10,
          fontFamily: "'Arial Black', Arial, sans-serif",
        }}>
          PAID
        </div>
      )}
      {/* Top bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg,#1a1a2e,#0f3460)", borderRadius: 2, marginBottom: 28 }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {/* Logo */}
            {studio.logo ? (
              <img src={studio.logo} alt="logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 38, height: 38, background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: 13, fontWeight: 800, letterSpacing: 2, fontStyle: "italic", flexShrink: 0 }}>
                {studio.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>{studio.name}</div>
              {studio.tagline && <div style={{ fontSize: 10, color: "#999" }}>{studio.tagline}</div>}
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.7 }}>
            {studio.address && <div>{studio.address}</div>}
            {studio.contact && <div>{studio.contact}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 5, color: "#1a1a2e", lineHeight: 1 }}>INVOICE</div>
          <div style={{ fontSize: 10, color: "#bbb", marginTop: 8 }}>
            No: <span style={{ fontWeight: 700, color: "#555", fontFamily: "monospace" }}>{invoiceNo}</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "#eee", marginBottom: 24 }} />

      {/* Bill to / Dates */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
        <div style={{ maxWidth: "55%" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>Ditagihkan Kepada</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e", marginBottom: 3 }}>{clientName || "—"}</div>
          {clientContact && <div style={{ fontSize: 10, color: "#888" }}>{clientContact}</div>}
          {clientAddress && <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>{clientAddress}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>Tanggal</div>
          <div style={{ color: "#777", marginBottom: 3 }}>Terbit: <span style={{ fontWeight: 700, color: "#444", fontFamily: "monospace" }}>{issueDate}</span></div>
          <div style={{ color: "#777" }}>Jatuh Tempo: <span style={{ fontWeight: 700, color: "#444", fontFamily: "monospace" }}>{dueDate}</span></div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 28 }}>
        <thead>
          <tr style={{ borderBottom: "2.5px solid #1a1a2e" }}>
            <th style={{ padding: "9px 12px", textAlign: "left", width: 36, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa" }}>No</th>
            <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa" }}>Proyek</th>
            <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa" }}>Kategori</th>
            <th style={{ padding: "9px 12px", textAlign: "right", width: 130, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa" }}>Harga</th>
          </tr>
        </thead>
        <tbody>
          {selectedProjects.map((p, i) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "12px 12px", fontFamily: "monospace", color: "#ccc", fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</td>
              <td style={{ padding: "12px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#1a1a2e" }}>{p.projectTitle}</div>
                <div style={{ fontSize: 9, color: "#bbb", marginTop: 1 }}>{p.clientName}</div>
              </td>
              <td style={{ padding: "12px 12px", color: "#999", fontSize: 10 }}>{getCatName(p.categoryId)}</td>
              <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>{formatCurrency(p.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 36 }}>
        <div style={{ width: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 10, color: "#999" }}>
            <span>Subtotal</span>
            <span style={{ fontFamily: "monospace" }}>{formatCurrency(subtotal)}</span>
          </div>
          {taxPercent > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 10, color: "#2e7d32" }}>
              <span>Pajak ({taxPercent}%)</span>
              <span style={{ fontFamily: "monospace" }}>+{formatCurrency(taxAmount)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 10, color: "#c62828" }}>
              <span>Diskon</span>
              <span style={{ fontFamily: "monospace" }}>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div style={{ borderTop: "2.5px solid #1a1a2e", margin: "8px 0 6px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: "#1a1a2e" }}>
            <span>Total Tagihan</span>
            <span style={{ fontFamily: "monospace" }}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Bank */}
      <div style={{ border: "1px solid #eee", background: "#fafafa", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 32, height: 32, background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 14, flexShrink: 0 }}>⬢</div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#bbb", marginBottom: 3 }}>Rekening Pembayaran</div>
          <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#555" }}>{studio.bankInfo || "—"}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: 10, color: "#ccc", fontStyle: "italic", borderTop: "1px solid #f0f0f0", paddingTop: 18 }}>
        Terima kasih atas kepercayaan Anda. Harap selesaikan pembayaran sebelum tanggal jatuh tempo.
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
      <div className="relative bg-neutral-50 dark:bg-neutral-950 w-full max-w-6xl h-full md:h-[92vh] flex flex-col md:rounded-2xl border border-neutral-200 dark:border-neutral-900 shadow-2xl overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-neutral-200 dark:border-neutral-900 bg-white dark:bg-[#0d0d0f] shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[9px] font-bold rounded-md uppercase tracking-widest">DS</div>
            <div>
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-neutral-400" /> Invoice
              </h2>
              <p className="text-[9.5px] text-neutral-400">
                {selectedProjects.length} proyek &middot; Total <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(totalAmount)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: toggle preview */}
            <button
              onClick={() => setShowMobilePreview(v => !v)}
              className="lg:hidden p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-all"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-60 text-white dark:text-neutral-950 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.97] shadow-sm"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {progress < 60 ? "Merender…" : progress < 85 ? "Menyusun…" : "Menyimpan…"}
                  <span className="font-mono text-[9px] opacity-60">{progress}%</span>
                </>
              ) : (
                <><Printer className="w-3.5 h-3.5" /> Cetak PDF</>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

          {/* ── SIDEBAR ── */}
          <div className={`
            lg:w-72 xl:w-80 shrink-0 bg-white dark:bg-[#0d0d0f]/50
            border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-900
            overflow-y-auto
            ${showMobilePreview ? "hidden lg:block" : "block"}
          `}>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                <Edit3 className="w-3 h-3" /> Atur Invoice
              </div>

              {/* No Invoice */}
              <Field label="No. Invoice">
                <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
                  className="input-base font-mono" />
              </Field>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Tgl. Terbit">
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="input-base" />
                </Field>
                <Field label="Jatuh Tempo">
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-base" />
                </Field>
              </div>

              {/* Client */}
              <Field label="Nama Klien">
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="input-base" />
              </Field>
              <Field label="Kontak Klien">
                <input type="text" value={clientContact} onChange={e => setClientContact(e.target.value)} placeholder="Email / No. HP" className="input-base" />
              </Field>
              <Field label="Alamat Klien">
                <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={2} placeholder="Opsional" className="input-base resize-none" />
              </Field>

              <hr className="border-neutral-100 dark:border-neutral-900" />

              {/* ── Studio Profile Section ── */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowStudioSection(v => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-3 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <Building2 className="w-3 h-3" /> Profil Studio
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${showStudioSection ? "rotate-180" : ""}`} />
                </button>

                {showStudioSection && (
                  <div className="p-3.5 space-y-3 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Simpan otomatis info */}
                    <p className="text-[9px] text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-lg px-2.5 py-1.5">
                      💾 Tersimpan otomatis — tidak perlu isi ulang setiap kali.
                    </p>

                    {/* Logo */}
                    <div className="space-y-1.5">
                      <span className="block text-[8.5px] font-bold uppercase tracking-widest text-neutral-400">Logo Perusahaan</span>
                      <div className="flex items-center gap-2">
                        {studio.logo ? (
                          <img src={studio.logo} alt="logo" className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400">
                            <Building2 className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-[9px] font-semibold cursor-pointer transition-all"
                          >
                            <Upload className="w-2.5 h-2.5" /> Upload Logo
                          </button>
                          {studio.logo && (
                            <button type="button" onClick={() => updateStudioField("logo", "")} className="text-[9px] text-red-400 hover:text-red-600 cursor-pointer text-left">
                              Hapus logo
                            </button>
                          )}
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </div>
                    </div>

                    <Field label="Nama Perusahaan">
                      <input type="text" value={studio.name} onChange={e => updateStudioField("name", e.target.value)}
                        placeholder="Design Studio" className="input-base" />
                    </Field>
                    <Field label="Tagline">
                      <input type="text" value={studio.tagline} onChange={e => updateStudioField("tagline", e.target.value)}
                        placeholder="Creative Design Solutions" className="input-base" />
                    </Field>
                    <Field label="Alamat Studio">
                      <textarea value={studio.address} onChange={e => updateStudioField("address", e.target.value)}
                        rows={2} placeholder="Jakarta, Indonesia" className="input-base resize-none" />
                    </Field>
                    <Field label="Kontak Studio">
                      <input type="text" value={studio.contact} onChange={e => updateStudioField("contact", e.target.value)}
                        placeholder="email | no. HP" className="input-base" />
                    </Field>
                    <Field label="Rekening Bank">
                      <input type="text" value={studio.bankInfo} onChange={e => updateStudioField("bankInfo", e.target.value)}
                        placeholder="BCA 123-456-789 a.n. Nama" className="input-base" />
                    </Field>
                  </div>
                )}
              </div>

              {/* ── Toggle PAID ── */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <div>
                  <span className="block text-xs font-bold text-neutral-700 dark:text-neutral-200">Status Lunas</span>
                  <span className="block text-[9px] text-neutral-400 mt-0.5">Tampilkan cap &ldquo;PAID&rdquo; di invoice</span>
                </div>
                <button
                  onClick={() => setIsPaid(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                    isPaid ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    isPaid ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Adjustments */}
              <div className="rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-3.5 space-y-3">
                <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Penyesuaian</span>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-medium">Pajak (%)</span>
                  <div className="flex items-center gap-1.5">
                    <StepBtn onClick={() => setTaxPercent(p => Math.max(0, p - 1))}><Minus className="w-3 h-3" /></StepBtn>
                    <span className="w-10 text-center text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-md py-1">
                      {taxPercent}%
                    </span>
                    <StepBtn onClick={() => setTaxPercent(p => Math.min(50, p + 1))}><Plus className="w-3 h-3" /></StepBtn>
                  </div>
                </div>

                <Field label="Diskon (Rp)">
                  <input type="number" value={discountAmount || ""} min={0}
                    onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value)) || 0)}
                    className="input-base font-mono text-right" />
                </Field>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-neutral-100/60 dark:bg-white/5 p-3.5 space-y-1.5">
                <Row label="Subtotal" value={formatCurrency(subtotal)} />
                {taxPercent > 0 && <Row label={`Pajak ${taxPercent}%`} value={`+${formatCurrency(taxAmount)}`} colored="green" />}
                {discountAmount > 0 && <Row label="Diskon" value={`-${formatCurrency(discountAmount)}`} colored="red" />}
                <hr className="border-neutral-200 dark:border-neutral-800 my-1" />
                <div className="flex justify-between text-xs font-bold text-neutral-900 dark:text-white">
                  <span>Total Tagihan</span>
                  <span className="font-mono text-sm">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── PREVIEW AREA ── */}
          <div
            className={`flex-1 min-w-0 min-h-0 bg-[#e8e8ec] dark:bg-[#080809] flex items-start justify-center overflow-auto p-4 md:p-6 relative
              ${!showMobilePreview ? "hidden lg:flex" : "flex"}
            `}
            ref={wrapperRef}
          >
            {/* ── Zoom toolbar ── */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg px-2 py-1.5">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 0.3}
                title="Zoom Out"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={zoomReset}
                title="Reset zoom"
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 min-w-[48px] text-center transition-all cursor-pointer"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                title="Zoom In"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

              <button
                onClick={zoomReset}
                title="Fit to screen"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <span className="hidden sm:block text-[9px] text-neutral-400 pl-1 pr-0.5 border-l border-neutral-200 dark:border-neutral-700 ml-0.5">
                Ctrl+Scroll
              </span>
            </div>

            {/* Scaled preview wrapper — ONLY for display */}
            <div
              style={{
                width: A4_W_PX * totalScale,
                height: A4_H_PX * totalScale,
                flexShrink: 0,
                position: "relative",
                marginBottom: 60, // ruang untuk toolbar zoom
              }}
            >
              <div
                ref={sheetRef}
                style={{
                  width: A4_W_PX,
                  height: A4_H_PX,
                  transformOrigin: "top left",
                  transform: `scale(${totalScale})`,
                  boxShadow: "0 4px 40px rgba(0,0,0,0.18)",
                  overflow: "hidden",
                }}
              >
                <InvoiceContent />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HIDDEN CLONE for PDF (full size, off-screen) ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          width: A4_W_PX,
          pointerEvents: "none",
          zIndex: -1,
          background: "#fff",
        }}
        ref={hiddenRef}
      >
        <InvoiceContent />
      </div>

      {/* Global input style */}
      <style>{`
        .input-base {
          display: block;
          width: 100%;
          background: #f5f5f7;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 12px;
          color: #111;
          outline: none;
          transition: border 0.2s;
        }
        .dark .input-base {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
          color: #e5e5e5;
        }
        .input-base:focus {
          border-color: #555;
        }
        .dark .input-base:focus {
          border-color: #666;
        }
      `}</style>
    </div>
  )
}

// ── Tiny helpers ──
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[8.5px] font-bold uppercase tracking-[0.15em] text-neutral-400">{label}</label>
      {children}
    </div>
  )
}

function StepBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
    >
      {children}
    </button>
  )
}

function Row({ label, value, colored }: { label: string; value: string; colored?: "green" | "red" }) {
  const cls = colored === "green" ? "text-green-600 dark:text-green-400"
            : colored === "red"   ? "text-red-500"
            : "text-neutral-500 dark:text-neutral-400"
  return (
    <div className={`flex justify-between text-[10px] ${cls}`}>
      <span>{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  )
}
