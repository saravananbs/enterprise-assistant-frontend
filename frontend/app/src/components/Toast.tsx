import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

type ToastProps = {
  type: ToastType
  title: string
  message: string
  isOpen: boolean
  onClose: () => void
  duration?: number
}

export function Toast({
  type,
  title,
  message,
  isOpen,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const bgColor =
    type === 'success'
      ? 'bg-green-50'
      : type === 'error'
        ? 'bg-red-50'
        : 'bg-blue-50'

  const borderColor =
    type === 'success'
      ? 'border-green-200'
      : type === 'error'
        ? 'border-red-200'
        : 'border-blue-200'

  const textColor =
    type === 'success'
      ? 'text-green-800'
      : type === 'error'
        ? 'text-red-800'
        : 'text-blue-800'

  const iconColor =
    type === 'success'
      ? 'text-green-600'
      : type === 'error'
        ? 'text-red-600'
        : 'text-blue-600'

  const getIcon = () => {
    if (type === 'success') {
      return (
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
    if (type === 'error') {
      return (
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
    return (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4">
      <div
        className={`flex gap-3 rounded-lg border ${bgColor} ${borderColor} p-4 shadow-lg`}
      >
        <div className={`flex-shrink-0 ${iconColor}`}>{getIcon()}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor}`}>{title}</h3>
          <p className={`mt-1 text-sm ${textColor} opacity-90`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${textColor} opacity-70 hover:opacity-100 transition-opacity`}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
