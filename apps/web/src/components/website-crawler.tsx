"use client"

import { useState } from "react"
import { AlertCircle, Globe, LinkIcon, MoreHorizontal, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Source } from "@/app/page"
import { formatFileSize } from "@/app/page"

interface WebsiteCrawlerProps {
  onAddSource: (sources: Source[]) => void
  sources: Source[]
  onRemoveSource: (id: string) => void
}

export function WebsiteCrawler({ onAddSource, sources, onRemoveSource }: WebsiteCrawlerProps) {
  const [url, setUrl] = useState("")
  const [protocol, setProtocol] = useState("https://")
  const [includePaths, setIncludePaths] = useState("")
  const [excludePaths, setExcludePaths] = useState("")
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("crawl-links")

  const handleFetchLinks = () => {
    if (!url.trim()) return

    // Simulate adding a link source
    const source: Source = {
      id: generateId(),
      type: "link",
      name: `${protocol}${url}`,
      size: 0, // Links don't have a size initially
      url: `${protocol}${url}`,
      isNew: true,
      metadata: {
        lastCrawled: "Just now",
        links: 1,
      }
    }

    onAddSource([source])
    setUrl("")
  }

  const handleAddLink = () => {
    if (!url.trim()) return

    // Simulate adding a single link
    const source: Source = {
      id: generateId(),
      type: "link",
      name: `${protocol}${url}`,
      size: 0,
      url: `${protocol}${url}`,
      isNew: true,
      metadata: {
        lastScraped: "Just now",
      }
    }

    onAddSource([source])
    setUrl("")
  }

  const handleLoadSitemap = () => {
    if (!url.trim()) return

    // Simulate adding a sitemap
    const source: Source = {
      id: generateId(),
      type: "link",
      name: `${protocol}${url}`,
      size: 0,
      url: `${protocol}${url}`,
      isNew: true,
      metadata: {
        type: "sitemap",
      }
    }

    onAddSource([source])
    setUrl("")
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
        <h2 className="text-xl font-medium text-gray-800 mb-4">Link</h2>
        
        <p className="text-gray-600 mb-6">
          Crawl specific web pages or submit sitemaps to continuously update your AI with the latest content.
          Configure included and excluded paths to refine what your AI learns. 
          <a href="#" className="text-blue-600 hover:underline ml-1">Learn more</a>
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="crawl-links">Crawl links</TabsTrigger>
            <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
            <TabsTrigger value="individual-link">Individual link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="crawl-links" className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <div className="flex">
                <select 
                  className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                >
                  <option value="https://">https://</option>
                  <option value="http://">http://</option>
                </select>
                <Input 
                  id="url" 
                  className="rounded-l-none"
                  placeholder="www.example.com" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <p className="text-sm text-amber-800">
                If you add multiple crawl links, they will all be marked as "pending" and will not overwrite one another.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="include-paths" className="block text-sm font-medium text-gray-700 mb-1">Include only paths</label>
                <Input 
                  id="include-paths" 
                  placeholder="Ex: blog/* , dev/*" 
                  value={includePaths}
                  onChange={(e) => setIncludePaths(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="exclude-paths" className="block text-sm font-medium text-gray-700 mb-1">Exclude paths</label>
                <Input 
                  id="exclude-paths" 
                  placeholder="Ex: blog/* , dev/*" 
                  value={excludePaths}
                  onChange={(e) => setExcludePaths(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="secondary" 
                onClick={handleFetchLinks}
                disabled={!url.trim()}
              >
                Fetch links
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="sitemap" className="space-y-4">
            <div>
              <label htmlFor="sitemap-url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <div className="flex">
                <select 
                  className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                >
                  <option value="https://">https://</option>
                  <option value="http://">http://</option>
                </select>
                <Input 
                  id="sitemap-url" 
                  className="rounded-l-none"
                  placeholder="www.example.com/sitemap.xml" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sitemap-include-paths" className="block text-sm font-medium text-gray-700 mb-1">Include only paths</label>
                <Input 
                  id="sitemap-include-paths" 
                  placeholder="Ex: blog/* , dev/*" 
                  value={includePaths}
                  onChange={(e) => setIncludePaths(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="sitemap-exclude-paths" className="block text-sm font-medium text-gray-700 mb-1">Exclude paths</label>
                <Input 
                  id="sitemap-exclude-paths" 
                  placeholder="Ex: blog/* , dev/*" 
                  value={excludePaths}
                  onChange={(e) => setExcludePaths(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="secondary" 
                onClick={handleLoadSitemap}
                disabled={!url.trim()}
              >
                Load sitemap
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="individual-link" className="space-y-4">
            <div>
              <label htmlFor="individual-url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <div className="flex">
                <select 
                  className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                >
                  <option value="https://">https://</option>
                  <option value="http://">http://</option>
                </select>
                <Input 
                  id="individual-url" 
                  className="rounded-l-none"
                  placeholder="www.example.com/page" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="secondary" 
                onClick={handleAddLink}
                disabled={!url.trim()}
              >
                Add link
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {sources.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Checkbox
                id="select-all-links"
                checked={selectedSources.length === sources.length && sources.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                className="mr-3"
              />
              <h3 className="font-medium">Link sources</h3>
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
                  id={`link-${source.id}`}
                  checked={selectedSources.includes(source.id)}
                  onCheckedChange={(checked) => handleSelectSource(source.id, checked as boolean)}
                  className="mr-3"
                />
                <div className="flex-1 flex items-center">
                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3">
                    {source.metadata?.type === "sitemap" ? (
                      <LinkIcon className="h-4 w-4 text-gray-500" />
                    ) : source.metadata?.links ? (
                      <Globe className="h-4 w-4 text-gray-500" />
                    ) : (
                      <LinkIcon className="h-4 w-4 text-gray-500" />
                    )}
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
                    <p className="text-xs text-gray-500">
                      {source.metadata?.lastCrawled && `Last crawled ${source.metadata.lastCrawled}`}
                      {source.metadata?.lastCrawled && source.metadata?.links && ` • Links: ${source.metadata.links}`}
                      {source.metadata?.lastScraped && `Last scraped ${source.metadata.lastScraped}`}
                    </p>
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
