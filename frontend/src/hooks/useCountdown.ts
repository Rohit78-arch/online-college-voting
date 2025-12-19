import * as React from "react"

export function useCountdown(targetIso?: string) {
  const targetMs = targetIso ? new Date(targetIso).getTime() : undefined

  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    if (!targetMs) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  if (!targetMs) {
    return {
      totalMs: null,
      isEnded: false,
      text: "--:--:--"
    }
  }

  const diff = targetMs - now
  const totalMs = diff
  const isEnded = diff <= 0

  const clamped = Math.max(0, diff)
  const totalSeconds = Math.floor(clamped / 1000)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const text = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  return { totalMs, isEnded, text }
}
