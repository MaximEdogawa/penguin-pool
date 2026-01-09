'use client'

import { useThemeClasses } from '@/shared/hooks'
import { ReactNode } from 'react'

export interface DataTableColumn<T = unknown> {
  key: string
  header: ReactNode
  cell: (row: T, index: number) => ReactNode
  className?: string
  headerClassName?: string
  align?: 'left' | 'right' | 'center'
  span?: number
}

export interface DataTableProps<T = unknown> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string
  className?: string
  headerClassName?: string
  rowClassName?: string | ((row: T, index: number) => string)
  onRowClick?: (row: T, index: number) => void
  emptyMessage?: string
  stickyHeader?: boolean
}

/**
 * Reusable DataTable component with proper column alignment
 * Ensures headers and cells align perfectly using consistent padding and alignment
 */
export default function DataTable<T = unknown>({
  columns,
  data,
  keyExtractor,
  className = '',
  headerClassName = '',
  rowClassName = '',
  onRowClick,
  emptyMessage = 'No data available',
  stickyHeader = false,
}: DataTableProps<T>) {
  const { t } = useThemeClasses()

  const getRowClassName = (row: T, index: number): string => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row, index)
    }
    return rowClassName || ''
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div
        className={`grid grid-cols-12 gap-2 px-2 py-1 backdrop-blur-xl ${t.card} border-b ${t.border} text-[10px] font-medium ${t.textSecondary} ${
          stickyHeader ? 'sticky top-0 z-10' : ''
        } ${headerClassName}`}
        style={{
          boxShadow: stickyHeader
            ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
            : undefined,
        }}
      >
        {columns.map((column) => {
          const span = column.span || 1
          const alignClass =
            column.align === 'right'
              ? 'text-right justify-end'
              : column.align === 'center'
                ? 'text-center justify-center'
                : 'text-left justify-start'

          return (
            <div
              key={column.key}
              className={`col-span-${span} flex items-center ${alignClass} ${column.headerClassName || ''}`}
            >
              {column.header}
            </div>
          )
        })}
      </div>

      {/* Rows */}
      {data.length === 0 ? (
        <div className={`px-2 py-4 text-center text-sm ${t.textSecondary}`}>{emptyMessage}</div>
      ) : (
        <div>
          {data.map((row, index) => (
            <div
              key={keyExtractor(row, index)}
              className={`grid grid-cols-12 gap-2 px-2 py-1.5 items-center ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
              } ${getRowClassName(row, index)}`}
              onClick={() => onRowClick?.(row, index)}
            >
              {columns.map((column) => {
                const span = column.span || 1
                const alignClass =
                  column.align === 'right'
                    ? 'text-right justify-end'
                    : column.align === 'center'
                      ? 'text-center justify-center'
                      : 'text-left justify-start'

                return (
                  <div
                    key={column.key}
                    className={`col-span-${span} flex items-center ${alignClass} ${column.className || ''}`}
                  >
                    {column.cell(row, index)}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
