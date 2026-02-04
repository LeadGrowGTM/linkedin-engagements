import { useState, useCallback } from 'react'

interface ExportableData {
  [key: string]: string | number | boolean | null | undefined
}

export function useExportCSV() {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = useCallback((data: ExportableData[], filename: string) => {
    if (data.length === 0) return

    setIsExporting(true)
    try {
      // Get headers from first object
      const headers = Object.keys(data[0])

      // Convert data to CSV rows
      const csvRows = [
        headers.join(','), // Header row
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            const stringValue = String(value)
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          }).join(',')
        ),
      ]

      // Create blob and download
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { exportToCSV, isExporting }
}
