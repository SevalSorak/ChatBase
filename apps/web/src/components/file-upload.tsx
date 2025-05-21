"use client"

import type React from "react"
import { useState, useRef } from "react"
import { UploadIcon, MoreHorizontal, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Source } from "@/app/page"
import { formatFileSize } from "@/app/page"

interface FileUploadProps {
  onAddSource: (source: Source) => void
  sources: Source[]
  onRemoveSource: (id: string) => void
}

export function FileUpload({ onAddSource, sources, onRemoveSource }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
    newFiles.forEach(file => {
      const source: Source = {
        id: generateId(),
        type: "file",
        name: file.name,
        size: file.size,
        isNew: true,
      }
      onAddSource(source)
    })
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleDeleteFile = (id: string) => {
    onRemoveSource(id)
    setSelectedFiles(selectedFiles.filter((fileId) => fileId !== id))
  }

  const handleSelectFile = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, id])
    } else {
      setSelectedFiles(selectedFiles.filter((fileId) => fileId !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(sources.map((source) => source.id))
    } else {
      setSelectedFiles([])
    }
  }

  const handleDeleteSelected = () => {
    selectedFiles.forEach(id => onRemoveSource(id))
    setSelectedFiles([])
  }

  const getFileTypeLabel = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || ""

    switch (extension) {
      case "pdf":
        return "PDF"
      case "doc":
      case "docx":
        return "DOC"
      case "txt":
        return "TXT"
      default:
        return "FILE"
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-medium text-gray-800 mb-6">Files</h2>
        
        {sources.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center h-56 cursor-pointer transition-colors ${
              isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt"
            />

            <UploadIcon className="h-10 w-10 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center font-medium">Drag & drop files here, or click to select files</p>
            <p className="text-gray-400 text-sm mt-2">Supported File Types: .pdf, .doc, .docx, .txt</p>
          </div>
        ) : (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt"
              />

              <UploadIcon className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-gray-600 text-center text-sm">Drag & drop files here, or click to select files</p>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Checkbox
                    id="select-all"
                    checked={selectedFiles.length === sources.length && sources.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    className="mr-3"
                  />
                  <h3 className="font-medium">File sources</h3>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 text-sm">
                    <span className="mr-2">{selectedFiles.length} selected</span>
                    <Button variant="ghost" size="sm" className="h-6 p-0 text-red-500 hover:text-red-700" onClick={handleDeleteSelected}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mb-4">{sources.length} item{sources.length !== 1 ? 's' : ''} on this page {selectedFiles.length > 0 ? `(${selectedFiles.length} selected)` : 'is selected'}</p>
              
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                {sources.map((source) => (
                  <div key={source.id} className="p-4 flex items-center">
                    <Checkbox
                      id={`file-${source.id}`}
                      checked={selectedFiles.includes(source.id)}
                      onCheckedChange={(checked) => handleSelectFile(source.id, checked as boolean)}
                      className="mr-3"
                    />
                    <div className="flex-1 flex items-center">
                      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">
                          {getFileTypeLabel(source.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate mr-2">{source.name}</p>
                          {source.isNew && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{formatFileSize(source.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteFile(source.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        <p className="text-gray-500 text-sm mt-4">
          If you are uploading a PDF, make sure you can select/highlight the text.
        </p>
      </div>
    </div>
  )
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
