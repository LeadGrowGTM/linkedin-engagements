import { Fragment, ReactNode } from 'react'
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Dialog({ open, onClose, children }: DialogProps) {
  return (
    <Transition show={open} as={Fragment}>
      <HeadlessDialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <HeadlessDialog.Panel className="w-full max-w-md rounded-lg bg-white dark:bg-navy-900 p-6 shadow-xl">
              {children}
            </HeadlessDialog.Panel>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <HeadlessDialog.Title className="text-lg font-semibold text-navy-900 dark:text-navy-50">
      {children}
    </HeadlessDialog.Title>
  )
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <HeadlessDialog.Description className="mt-2 text-sm text-navy-500 dark:text-navy-400">
      {children}
    </HeadlessDialog.Description>
  )
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-6 flex justify-end gap-3', className)}>
      {children}
    </div>
  )
}

