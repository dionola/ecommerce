import { useEffect, useState } from "react"
import { Toast } from "./toast"
import { createPortal } from "react-dom"

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

let toastIdCounter = 0
const toasts: ToastData[] = []
const listeners: Array<() => void> = []

export function toast(data: Omit<ToastData, "id">) {
  const id = `toast-${++toastIdCounter}`
  const toastData: ToastData = { ...data, id }
  toasts.push(toastData)
  listeners.forEach((listener) => listener())

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(id)
  }, 5000)

  return id
}

export function dismissToast(id: string) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index > -1) {
    toasts.splice(index, 1)
    listeners.forEach((listener) => listener())
  }
}

export function Toaster() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1)
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  if (typeof window === "undefined") return null

  return createPortal(
    <div className="pointer-events-none fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map((toastData) => (
          <Toast
            key={toastData.id}
            {...toastData}
            onClose={() => dismissToast(toastData.id)}
          />
        ))}
      </div>
    </div>,
    document.body
  )
}

