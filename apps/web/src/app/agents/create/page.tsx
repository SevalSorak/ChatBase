"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SourcesSidebar } from "@/components/sources-sidebar"
import { FileUpload } from "@/components/file-upload"
import { TextEditor } from "@/components/text-editor"
import { WebsiteCrawler } from "@/components/website-crawler"
import { QAEditor } from "@/components/qa-editor"
import { NotionIntegration } from "@/components/notion-integration"
import { PurchaseAddon } from "@/components/purchase-addon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import axios from "@/lib/axios"

export type SourceType = "file" | "text" | "link" | "qa" | "notion"

export type Source = {
  id: string
  type: SourceType
  name: string
  size: number
  content?: string
  url?: string
  isNew?: boolean
  metadata?: Record<string, any>
}

export default function CreateAgentPage() {
  const [activeTab, setActiveTab] = useState<"files" | "text" | "website" | "qa" | "notion">("files")
  const [sources, setSources] = useState<Source[]>([])
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [agentDescription, setAgentDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const totalSize = sources.reduce((total, source) => total + source.size, 0)
  const maxSize = 400 * 1024 // 400 KB

  const handleAddSource = (source: Source) => {
    setSources((prev) => [...prev, source])
    toast({
      title: "Source added",
      description: `Added ${source.name} (${formatFileSize(source.size)})`,
    })
  }

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((source) => source.id !== id))
  }

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      toast({
        title: "Missing agent name",
        description: "Please provide a name for your agent",
        variant: "destructive",
      })
      return
    }

    if (sources.length === 0) {
      toast({
        title: "No sources added",
        description: "Please add at least one source to create an agent",
        variant: "destructive",
      })
      return
    }

    // Simulate checking if user can create more agents
    if (Math.random() > 0.7) {
      setShowPurchaseModal(true)
      return
    }

    try {
      setIsCreating(true)
      
      // Create agent with sources
      const response = await axios.post('/api/agents', {
        name: agentName,
        description: agentDescription,
        sources: sources.map(source => ({
          type: source.type,
          name: source.name,
          size: source.size,
          content: source.content,
          url: source.url,
          metadata: source.metadata
        }))
      })
      
      toast({
        title: "Agent created",
        description: `Successfully created agent "${agentName}"`,
      })
      
      // Redirect to the new agent page
      router.push(`/agents/${response.data.id}`)
    } catch (error) {
      console.error('Error creating agent:', error)
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getSourcesByType = (type: SourceType) => {
    return sources.filter((source) => source.type === type)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return <FileUpload onAddSource={handleAddSource} sources={getSourcesByType("file")} onRemoveSource={handleRemoveSource} />
      case "text":
        return <TextEditor onAddSource={handleAddSource} sources={getSourcesByType("text")} onRemoveSource={handleRemoveSource} />
      case "website":
        return <WebsiteCrawler onAddSource={handleAddSource} sources={getSourcesByType("link")} onRemoveSource={handleRemoveSource} />
      case "qa":
        return <QAEditor onAddSource={handleAddSource} sources={getSourcesByType("qa")} onRemoveSource={handleRemoveSource} />
      case "notion":
        return <NotionIntegration onAddSource={handleAddSource} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-8">Create new agent</h1>
          
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="agent-name">Agent name</Label>
                  <Input 
                    id="agent-name" 
                    placeholder="My AI Agent" 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="agent-description">Description (optional)</Label>
                  <Input 
                    id="agent-description" 
                    placeholder="What this agent does..." 
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="website">Website</TabsTrigger>
              <TabsTrigger value="qa">Q&A</TabsTrigger>
              <TabsTrigger value="notion">Notion</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {renderContent()}
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar */}
        <SourcesSidebar 
          sources={sources} 
          totalSize={totalSize} 
          maxSize={maxSize} 
          onCreateAgent={handleCreateAgent}
          isCreating={isCreating}
        />
      </div>

      {showPurchaseModal && (
        <PurchaseAddon onClose={() => setShowPurchaseModal(false)} />
      )}
    </div>
  )
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}