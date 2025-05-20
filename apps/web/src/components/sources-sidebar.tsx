"use client"

import { Button } from "@/components/ui/button"
import type { UploadedFile } from "@/components/file-upload"

interface SourcesSidebarProps {
  files: UploadedFile[]
  onCreateAgent?: () => void
}

export function SourcesSidebar({ files = [], onCreateAgent }: SourcesSidebarProps) {
  const totalSize = files.reduce((total, file) => total + file.size, 0)
  const maxSize = 400 * 1024 // 400 KB in bytes

  return (
    <div className="w-72 border-l border-gray-200 bg-white p-6 hidden lg:block">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">SOURCES</h3>

      {files.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {files.length} {files.length === 1 ? "File" : "Files"}
            </span>
            <span className="text-sm font-medium">{formatFileSize(totalSize)}</span>
          </div>

          <div className="border-t border-dashed border-gray-200 my-4"></div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-700">Total size:</span>
            <span className="text-sm font-medium">{formatFileSize(totalSize)}</span>
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">/ {formatFileSize(maxSize)}</span>
          </div>
        </div>

        <Button
          className="w-full bg-black text-white hover:bg-gray-800"
          disabled={files.length === 0 || totalSize > maxSize}
          onClick={onCreateAgent}
        >
          Create agent
        </Button>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}
