"use client"

import { useEffect, useState } from "react"

/**
 * The current instant, re-read on an interval.
 *
 * Starts at 0 and fills in after mount ON PURPOSE: `Date.now()` in the
 * initial render differs between server and client, which is a
 * hydration mismatch. Callers treat 0 as "not known yet" and draw
 * nothing, which is also the correct first frame.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
