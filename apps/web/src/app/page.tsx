"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SourcesSidebar } from "@/components/sources-sidebar"
import { FileUpload } from "@/components/file-upload"
import { TextEditor } from "@/components/text-editor"
import { WebsiteCrawler } from "@/components/website-crawler"
import { QAEditor } from "@/components/qa-editor"
import { NotionIntegration } from "@/components/notion-integration"
import { PurchaseAddon } from "@/components/purchase-addon"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import axios from "@/lib/axios"
import { useRouter } from "next/navigation"

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
  fileSize?: number
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"files" | "text" | "website" | "qa" | "notion">("files")
  const [sources, setSources] = useState<Source[]>([])
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [agentDescription, setAgentDescription] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const totalSize = sources.reduce((total, source) => total + source.size, 0)
  const maxSize = 400 * 1024 // 400 KB

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      let isLoggedIn = false;

      if (token && token !== 'undefined') {
        isLoggedIn = true;
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        isLoggedIn = await login();
        setIsAuthenticated(isLoggedIn);
      }
    };

    checkAuth();
  }, []);

  const handleAddSource = (newSources: Source[]) => {
    const formattedSources = newSources.map(source => ({
      ...source,
      size: source.fileSize || 0,
    }));
    setSources((prev) => [...prev, ...formattedSources]);
    formattedSources.forEach(source => {
      toast({
        title: "Source added",
        description: `Added ${source.name} (${formatFileSize(source.size)})`,
      });
    });
  }

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((source) => source.id !== id))
  }

  const handleCreateAgent = async () => {
    if (sources.length === 0) {
      toast({
        title: "No sources added",
        description: "Please add at least one source to create an agent",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true);

      const { data: agent } = await axios.post('/agents', {
        name: agentName || 'New Agent',
        description: agentDescription || `Agent created with ${sources.length} sources`,
      })

      for (const source of sources) {
        try {
          switch (source.type) {
            case 'text':
              await axios.post(`/agents/${agent.id}/sources/text`, {
                title: source.name,
                content: source.content,
              })
              break

            case 'link':
              await axios.post(`/agents/${agent.id}/sources/links`, {
                url: source.url,
                includePaths: source.metadata?.includePaths,
                excludePaths: source.metadata?.excludePaths,
              })
              break

            case 'qa':
              await axios.post(`/agents/${agent.id}/sources/qa`, {
                title: source.name,
                questions: source.metadata?.questions,
              })
              break

            case 'file':
              // Files are already uploaded and associated with the agent
              // during the initial file upload process
              // Backend logic suggests files are added via POST /api/agents/:id/sources/file
              // This might be redundant if already linked on upload, need backend confirm
              // For now, assuming file is linked during initial upload and no action needed here.
              break
            case 'notion':
              // Notion sources might need specific handling
              console.warn('Notion source type not fully implemented in handleCreateAgent');
              break;
          }

        } catch (error: any) {
          console.error(`Error adding source ${source.name}:`, error)
          toast({
            title: "Error adding source",
            description: `Failed to add ${source.name}: ${error.response?.data?.message || error.message}`,
            variant: "destructive",
          })
        }
      }

      setSources([]);
      setAgentName("");
      setAgentDescription("");

      toast({
        title: "Agent created successfully",
        description: `Created agent with ${sources.length} sources`,
      })

      router.push(`/agents/${agent.id}`);

    } catch (error: any) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error creating agent",
        description: error.response?.data?.message || "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getSourcesByType = (type: SourceType) => {
    return sources.filter((source) => source.type === type);
  }

  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return <FileUpload 
          agentId={sources[0]?.id || 'new'} 
          onUploadComplete={handleAddSource} 
          sources={getSourcesByType("file")} 
          onRemoveSource={handleRemoveSource} 
          isAuthenticated={isAuthenticated}
          onFilesSelected={(files) => {
            const newSources = files.map(file => ({
              id: Math.random().toString(),
              type: "file",
              name: file.name,
              size: file.size,
              isNew: true,
              file: file,
            }));
            handleAddSource(newSources as any);
          }}
        />
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

  const login = async () => {
    try {
      const response = await axios.post('/auth/login', {
        email: 'testseval1@gmail.com',
        password: 'testseval'
      });

      const token = response.data.accessToken;

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast({
        title: "Login successful",
        description: "You are now logged in",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Failed to login",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-8">Create new agent</h1>
          {renderContent()}
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

      <Toaster />
    </div>
  )
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}
