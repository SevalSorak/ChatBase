"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { SourcesSidebar } from "@/components/sources-sidebar"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/sidebar"
import type { Source } from "@/app/page"

interface Agent {
  id: string
  name: string
  description: string
  createdAt: string
  sources: Source[]
  settings: {
    model: string
    temperature: number
    systemPrompt: string
  }
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"files" | "text" | "website" | "qa" | "notion">("files")

  useEffect(() => {
    if (params.id) {
      fetchAgent(params.id as string)
    }
  }, [params.id])

  const fetchAgent = async (id: string) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/agents/${id}`)
      setAgent(response.data)
    } catch (error) {
      console.error('Error fetching agent:', error)
      toast({
        title: "Error",
        description: "Failed to fetch agent details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agent) return
    
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      return
    }
    
    try {
      await axios.delete(`/api/agents/${agent.id}`)
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      })
      router.push('/agents')
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      })
    }
  }

  const handleEditAgent = () => {
    if (!agent) return
    router.push(`/agents/${agent.id}/edit`)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="flex justify-center items-center h-64">
              <div className="w-16 h-16 border-4 border-t-primary border-opacity-50 rounded-full animate-spin"></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-2">Agent not found</h2>
              <p className="text-muted-foreground mb-6">The agent you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => router.push('/agents')}>Back to Agents</Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEditAgent}>Edit Agent</Button>
              <Button variant="destructive" onClick={handleDeleteAgent}>Delete Agent</Button>
            </div>
          </div>
          
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "files" | "text" | "website" | "qa" | "notion")}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                        <p>{agent.description || "No description"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                        <p>{new Date(agent.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Model</h3>
                        <p>{agent.settings?.model || "Default"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Sources ({agent.sources?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agent.sources?.length > 0 ? (
                      <ul className="space-y-2">
                        {agent.sources.map((source) => (
                          <li key={source.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-sm">{source.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(source.size)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No sources added</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle>Chat with {agent.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-muted-foreground">Chat interface will be implemented here</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-muted-foreground">Settings interface will be implemented here</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-muted-foreground">Analytics interface will be implemented here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        
        <SourcesSidebar 
          sources={agent.sources || []} 
          totalSize={agent.sources?.reduce((total, source) => total + source.size, 0) || 0}
          maxSize={400 * 1024} // 400 KB
          readOnly
        />
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}