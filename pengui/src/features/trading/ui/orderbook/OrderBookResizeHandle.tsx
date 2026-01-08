import { useThemeClasses } from '@/shared/hooks'

interface OrderBookResizeHandleProps {
  averagePrice: string
  onMouseDown: (event: React.MouseEvent) => void
}

export default function OrderBookResizeHandle({
  averagePrice,
  onMouseDown,
}: OrderBookResizeHandleProps) {
  const { t } = useThemeClasses()

  return (
    <div
      className={`resize-handle ${t.card} hover:bg-gray-300 dark:hover:bg-gray-500 cursor-row-resize transition-colors flex items-center justify-center relative`}
      onMouseDown={onMouseDown}
      title="Drag to resize sections"
    >
      <div className="w-full flex items-center justify-between px-3">
        <div className="flex items-center gap-1"></div>
      </div>

      {/* Invisible larger hit area */}
      <div className="absolute inset-0 w-full h-6 -top-1 pr-2"></div>
      <div className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono pr-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
        {averagePrice}
      </div>
    </div>
  )
}
