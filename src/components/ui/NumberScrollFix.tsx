'use client'

import { useEffect } from 'react'

/**
 * Prevents <input type="number"> values from changing when the user
 * scrolls while the input is focused. Attaches a single passive-false
 * wheel listener on the document (capture phase) and blurs the input
 * if the wheel event target is a number input.
 *
 * Mount this once at the root layout level — no other files need changing.
 */
export function NumberScrollFix() {
  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement && target.type === 'number') {
        target.blur()
      }
    }

    // Non-passive so we can reliably blur before the browser updates the value
    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [])

  return null
}
