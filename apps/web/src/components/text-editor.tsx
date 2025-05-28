"use client"

import { useState } from "react"
import { Bold, Italic, Link, List, ListOrdered, MoreHorizontal, ChevronRight, Trash2, Maximize2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Source } from "@/app/page"
import { formatFileSize } from "@/app/page"

interface TextEditorProps {
  onAddSource: (sources: Source[]) => void
  sources: Source[]
  onRemoveSource: (id: string) => void
}

export function TextEditor({ onAddSource, sources, onRemoveSource }: TextEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedSources, setSelectedSources] = useState<string[]>([])

  const handleAddTextSnippet = () => {
    if (!title.trim()) return

    const source: Source = {
      id: generateId(),
      type: "text",
      name: title,
      size: content.length,
      content,
      isNew: true,
    }

    onAddSource([source])
    setTitle("")
    setContent("")
  }

  const handleSelectSource = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSources([...selectedSources, id])
    } else {
      setSelectedSources(selectedSources.filter((sourceId) => sourceId !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSources(sources.map((source) => source.id))
    } else {
      setSelectedSources([])
    }
  }

  const handleDeleteSelected = () => {
    selectedSources.forEach(id => onRemoveSource(id))
    setSelectedSources([])
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-medium text-gray-800 mb-4">Text</h2>
        
        <p className="text-gray-600 mb-6">
          Add and process plain text-based sources to train your AI Agent with precise information. 
          <a href="#" className="text-blue-600 hover:underline ml-1">Learn more</a>
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input 
              id="title" 
              placeholder="Ex: Refund requests" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="flex items-center border-b border-gray-200 p-2 bg-gray-50">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Link className="h-4 w-4" />
                </Button>
                <div className="h-4 border-l border-gray-300 mx-2"></div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="flex-1"></div>
                <span className="text-xs text-gray-500">{content.length} B</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <textarea
                className="w-full p-3 min-h-[200px] resize-none focus:outline-none"
                placeholder="Enter your text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="secondary" 
              onClick={handleAddTextSnippet}
              disabled={!title.trim()}
            >
              Add text snippet
            </Button>
          </div>
        </div>
      </div>
      
      {sources.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Checkbox
                id="select-all-text"
                checked={selectedSources.length === sources.length && sources.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                className="mr-3"
              />
              <h3 className="font-medium">Text sources</h3>
            </div>
            
            {selectedSources.length > 0 && (
              <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 text-sm">
                <span className="mr-2">{selectedSources.length} selected</span>
                <Button variant="ghost" size="sm" className="h-6 p-0 text-red-500 hover:text-red-700" onClick={handleDeleteSelected}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mb-4">{sources.length} item{sources.length !== 1 ? 's' : ''} on this page {selectedSources.length > 0 ? `(${selectedSources.length} selected)` : 'is selected'}</p>
          
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
            {sources.map((source) => (
              <div key={source.id} className="p-4 flex items-center">
                <Checkbox
                  id={`text-${source.id}`}
                  checked={selectedSources.includes(source.id)}
                  onCheckedChange={(checked) => handleSelectSource(source.id, checked as boolean)}
                  className="mr-3"
                />
                <div className="flex-1 flex items-center">
                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-gray-600">TXT</span>
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
                      <DropdownMenuItem onClick={() => onRemoveSource(source.id)}>
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
      )}
    </div>
  )
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
