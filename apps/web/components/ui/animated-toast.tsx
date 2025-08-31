'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Toast, ToastClose, ToastDescription, ToastTitle } from './toast'
import { toastVariants } from '@/lib/utils/animations'
import { useToast } from '@/lib/hooks/use-toast'

export function AnimatedToaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            layout
          >
            <Toast variant={toast.variant} className="mb-2">
              <div className="grid gap-1">
                {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                {toast.description && (
                  <ToastDescription>{toast.description}</ToastDescription>
                )}
              </div>
              <ToastClose onClick={() => dismiss(toast.id)} />
            </Toast>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
