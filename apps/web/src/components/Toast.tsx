import { useToastStore, type ToastType } from '../store/toast'

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
  error: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-lg animate-in slide-in-from-right ${styles[t.type]}`}
        >
          <span className="font-bold flex-shrink-0 mt-0.5">{icons[t.type]}</span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button onClick={() => remove(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity ml-1">✕</button>
        </div>
      ))}
    </div>
  )
}
