import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

// Toast context
const ToastContext = createContext()

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = {
      id,
      ...toast,
      createdAt: Date.now()
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    const duration = toast.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      addToast, 
      removeToast, 
      removeAllToasts 
    }}>
      {children}
    </ToastContext.Provider>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  const { addToast, removeToast, removeAllToasts } = context
  
  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ title: options, variant: 'default' })
    }
    return addToast(options)
  }, [addToast])
  
  // Convenience methods
  toast.success = useCallback((title, description) => 
    addToast({ title, description, variant: 'success' }), [addToast])
  
  toast.error = useCallback((title, description) => 
    addToast({ title, description, variant: 'destructive' }), [addToast])
  
  toast.warning = useCallback((title, description) => 
    addToast({ title, description, variant: 'warning' }), [addToast])
  
  toast.info = useCallback((title, description) => 
    addToast({ title, description, variant: 'info' }), [addToast])
  
  toast.dismiss = removeToast
  toast.dismissAll = removeAllToasts
  
  return toast
}

// Toast component
const Toast = ({ toast, onRemove }) => {
  const getIcon = (variant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'destructive':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  const getStyles = (variant) => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'destructive':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-white border-gray-200 text-gray-900'
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-200 ease-in-out animate-fade-in',
        getStyles(toast.variant)
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon(toast.variant)}
          </div>
          <div className="ml-3 w-0 flex-1">
            {toast.title && (
              <p className="text-sm font-medium">
                {toast.title}
              </p>
            )}
            {toast.description && (
              <p className={cn(
                "text-sm",
                toast.title ? "mt-1 text-opacity-90" : ""
              )}>
                {toast.description}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                {toast.action}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
              onClick={() => onRemove(toast.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toaster component to render all toasts
export const Toaster = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

// Export everything wrapped in ToastProvider for convenience
export default function ToastSystem({ children }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  )
}