import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DESIGN STUDIO — Manajemen Proyek Desain",
  description: "Catat dan kelola proyek desain freelance dengan mudah",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a12] text-[#1d1d1f] dark:text-[#e4e4ed] font-sans transition-colors duration-500">
        {children}
      </body>
    </html>
  )
}
