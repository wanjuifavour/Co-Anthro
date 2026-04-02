// hooks/usePolling.ts
import { useEffect, useRef, useCallback } from 'react'

export function usePolling(fn: () => void | Promise<void>, interval = 5000) {
  const savedFn = useRef(fn)
  savedFn.current = fn

  const run = useCallback(() => {
    Promise.resolve(savedFn.current()).catch(console.error)
  }, [])

  useEffect(() => {
    run()
    const timer = setInterval(run, interval)
    return () => clearInterval(timer)
  }, [run, interval])
}
