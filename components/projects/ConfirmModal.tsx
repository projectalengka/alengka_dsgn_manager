"use client"

import { Trash2, AlertOctagon } from "lucide-react"

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  projectName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ isOpen, title, projectName, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0a12]/40 dark:bg-[#0a0a12]/70 backdrop-blur-md" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#0f0f1a] border border-neutral-200/70 dark:border-[#1e1e30] rounded-lg w-full max-w-md p-6 sm:p-8 shadow-2xl animate-fade-in text-neutral-800 dark:text-neutral-200">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 flex-shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-[#e4e4ed]">{title}</h3>
            <p className="mt-2 text-xs text-neutral-450 dark:text-[#8b8b9e] leading-relaxed">
              Yakin mau hapus proyek{" "}
              <span className="font-semibold italic text-neutral-900 dark:text-[#e4e4ed]">&quot;{projectName}&quot;</span>? Data bakal kehapus permanen, lho.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-[#1e1e30] pt-4">
          <button onClick={onCancel} className="px-4 py-2 border border-neutral-200 dark:border-[#232338] text-neutral-500 dark:text-[#8b8b9e] rounded-lg hover:bg-neutral-50 dark:hover:bg-[#141422] transition-all text-xs font-medium cursor-pointer">
            Batal
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all text-xs flex items-center gap-2 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
