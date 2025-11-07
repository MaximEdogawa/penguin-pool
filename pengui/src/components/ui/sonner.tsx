'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      offset="16px"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            'backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/20 text-white shadow-2xl shadow-black/20 rounded-xl',
          title: 'font-medium text-base text-white',
          description: 'text-white/90',
          success:
            'backdrop-blur-xl bg-green-500/20 dark:bg-green-500/10 border-green-400/30 dark:border-green-500/20 text-green-100 dark:text-green-200',
          error:
            'backdrop-blur-xl bg-red-500/20 dark:bg-red-500/10 border-red-400/30 dark:border-red-500/20 text-red-100 dark:text-red-200',
          info: 'backdrop-blur-xl bg-blue-500/20 dark:bg-blue-500/10 border-blue-400/30 dark:border-blue-500/20 text-blue-100 dark:text-blue-200',
          warning:
            'backdrop-blur-xl bg-yellow-500/20 dark:bg-yellow-500/10 border-yellow-400/30 dark:border-yellow-500/20 text-yellow-100 dark:text-yellow-200',
          actionButton: 'bg-white/20 hover:bg-white/30 text-white',
          cancelButton: 'bg-white/10 hover:bg-white/20 text-white/80',
        },
        ...toastOptions,
      }}
      {...props}
    />
  )
}

export { Toaster }
