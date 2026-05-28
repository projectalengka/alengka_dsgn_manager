"use client"

import { useEffect, useRef, useState } from "react"

export default function AnimatedCounter({
  value,
  duration = 1200,
  formatter,
  suffix = "",
  className,
}: {
  value: number
  duration?: number
  formatter?: (val: number) => string
  suffix?: string
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)

  useEffect(() => {
    const start = displayRef.current
    const diff = value - start
    if (diff === 0) return

    const startTime = performance.now()
    let frameId: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + diff * eased)
      
      setDisplay(current)
      displayRef.current = current

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }
    
    frameId = requestAnimationFrame(animate)
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [value, duration])

  const formatted = formatter ? formatter(display) : display.toLocaleString("id-ID")
  return <span className={className}>{formatted}{suffix}</span>
}
