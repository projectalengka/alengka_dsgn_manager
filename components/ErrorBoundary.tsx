"use client"

import { Component } from "react"
import type { ReactNode } from "react"

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a12] flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded bg-neutral-200 dark:bg-[#141422] flex items-center justify-center text-neutral-500 mx-auto">!</div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-[#e4e4ed]">Terjadi Kesalahan</h2>
            <p className="text-xs text-neutral-500 dark:text-[#8b8b9e]">Coba refresh halaman.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
