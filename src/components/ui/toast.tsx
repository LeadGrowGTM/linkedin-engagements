import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, Send } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'action'
  actionType?: 'clay-webhook'
  persistent?: boolean
  onRetry?: () => void
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
  showActionToast: (message: string, actionType: 'clay-webhook', onRetry?: () => void) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const showActionToast = useCallback((message: string, actionType: 'clay-webhook', onRetry?: () => void) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type: 'action', actionType, persistent: true, onRetry }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, showActionToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ClayWebhookAction({ onSave, onDismiss, onRetry }: { onSave: () => void; onDismiss: () => void; onRetry?: () => void }) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!webhookUrl.trim()) return

    setIsSaving(true)
    // Get current settings from localStorage
    const savedSettings = localStorage.getItem('app-settings')
    const settings = savedSettings ? JSON.parse(savedSettings) : {}

    // Update clay webhook
    settings.clayWebhook = webhookUrl.trim()

    // Save back to localStorage
    localStorage.setItem('app-settings', JSON.stringify(settings))

    // Call onSave first to dismiss and show success
    onSave()

    // Then retry the push operation if callback provided
    if (onRetry) {
      // Small delay to let the toast update
      setTimeout(() => {
        onRetry()
      }, 500)
    }

    setIsSaving(false)
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://app.clay.com/api/v1/webhook/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="flex-1 h-9 text-sm bg-white dark:bg-navy-900"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') onDismiss()
          }}
          autoFocus
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-8 text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!webhookUrl.trim() || isSaving}
          className="h-8 text-xs gap-1"
        >
          <Send className="h-3 w-3" />
          {isSaving ? 'Saving...' : 'Save & Push'}
        </Button>
      </div>
    </div>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const { showToast } = useToast()

  if (toasts.length === 0) return null

  const handleWebhookSaved = (toastId: string) => {
    onDismiss(toastId)
    showToast('Clay webhook saved! Try pushing again.', 'success')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex flex-col px-4 py-3 rounded-lg shadow-lg border
            animate-in slide-in-from-right-5 fade-in duration-200
            ${toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : toast.type === 'action'
              ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200'
              : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            }
          `}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'action' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {toast.type === 'action' && toast.actionType === 'clay-webhook' && (
            <ClayWebhookAction
              onSave={() => handleWebhookSaved(toast.id)}
              onDismiss={() => onDismiss(toast.id)}
              onRetry={toast.onRetry}
            />
          )}
        </div>
      ))}
    </div>
  )
}
