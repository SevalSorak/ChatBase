"use client"

import { useState, useEffect } from "react"
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
  const { toast } = useToast()
  const router = useRouter()

  const totalSize = sources.reduce((total, source) => total + source.size, 0)
  const maxSize = 400 * 1024 // 400 KB

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        const isLoggedIn = await login();
        setIsAuthenticated(isLoggedIn);
      }
    };

    checkAuth();
  }, []);

  const handleAddSource = (newSources: Source[]) => {
    console.log('handleAddSource called with:', newSources);
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

  const handleCreateAgent = () => {
    if (sources.length === 0) {
      toast({
        title: "No sources added",
        description: "Please add at least one source to create an agent",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Agent created",
      description: `Created agent with ${sources.length} source${sources.length !== 1 ? "s" : ""}`,
    })
  }

  const getSourcesByType = (type: SourceType) => {
    const filtered = sources.filter((source) => source.type === type);
    console.log(`Sources of type ${type}:`, filtered);
    return filtered;
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

      const token = response.data.access_token;
      localStorage.setItem('token', token);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast({
        title: "Login successful",
        description: "You are now logged in",
      });

      return true;
    } catch (error: any) {
      console.error("Login error:", error);
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
