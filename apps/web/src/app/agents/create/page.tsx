"use client"

import { useState, useEffect, useCallback } from "react"
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
import { formatFileSize } from '@/app/page'

export type SourceType = "file" | "text" | "link" | "qa" | "notion"

// Define interfaces for different source types before they are added to backend
interface FileSource { type: "file", file: File }
interface TextSource { type: "text", title: string, content: string }
interface LinkSource { type: "link", url: string, includePaths?: string[], excludePaths?: string[] }
interface QASource { type: "qa", title: string, questions: { question: string, answer: string }[] }
// Add other source types as needed

type PendingSource = FileSource | TextSource | LinkSource | QASource; // Union type of all pending sources

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
  const [uploadedSources, setUploadedSources] = useState<Source[]>([]) // Sources successfully uploaded to backend
  const [pendingSources, setPendingSources] = useState<PendingSource[]>([]) // Sources selected/entered but not yet added to backend
  const [checkedFiles, setCheckedFiles] = useState<File[]>([]); // Add this state for checked files
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [agentDescription, setAgentDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Calculate total size of uploaded sources for display
  const totalSize = uploadedSources.reduce((total, source) => total + source.size, 0)
  const maxSize = 400 * 1024 * 1024 // Example max size: 400 MB - Adjust as needed

  // Function to add sources to the list of pending sources
  const handleAddPendingSource = (source: PendingSource) => {
    console.log("handleAddPendingSource called with source:", source); // Add this log
    setPendingSources(prev => {
      const newPendingSources = [...prev, source];
      console.log("Pending sources updated:", newPendingSources); // Kontrol için log
      return newPendingSources;
    });
    let message = "Source added";
    if (source.type === "file") message = `File ${source.file.name} selected`;
    if (source.type === "text") message = `Text source "${source.title}" added`;
    if (source.type === "link") message = `Website link "${source.url}" added`;
    if (source.type === "qa") message = `Q&A source "${source.title}" added`;
    
    toast({
      title: "Source added",
      description: message,
    });
  };

  // Function to remove a source from the list of pending sources
  const handleRemovePendingSource = (index: number) => {
    setPendingSources(prev => prev.filter((_, i) => i !== index));
  };

  // Function to add sources that were successfully processed by backend to the uploaded list
  const handleAddUploadedSource = (sources: Source[]) => {
    setUploadedSources(prev => [...prev, ...sources]);
  };

  const handleRemoveUploadedSource = (id: string) => {
    // This would typically involve a backend call to remove the source
    // For now, just remove from the list for UI consistency
    setUploadedSources(prev => prev.filter(source => source.id !== id));
    // TODO: Implement backend call to remove source
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      toast({
        title: "Missing agent name",
        description: "Please provide a name for your agent",
        variant: "destructive",
      })
      return
    }

    if (pendingSources.length === 0 && uploadedSources.length === 0) {
      toast({
        title: "No sources added",
        description: "Please add at least one source to create an agent",
        variant: "destructive",
      })
      return
    }

    // Simulate checking if user can create more agents
    // if (Math.random() > 0.7) { // Keep this if needed for pricing/limits
    //   setShowPurchaseModal(true)
    //   return
    // }

    try {
      setIsCreating(true)
      
      // 1. Create agent first
      const { data: agent } = await axios.post('/agents', {
        name: agentName,
        description: agentDescription,
      })

      const newAgentId = agent.id;
      const successfullyAddedSources: Source[] = [];

      // 2. Add pending sources to the created agent
      for (const source of pendingSources) {
        try {
          if (source.type === 'file') {
            const formData = new FormData();
            formData.append('files', source.file);
            
            // Assuming backend returns the created Source object(s)
            const { data } = await axios.post(`/agents/${newAgentId}/sources/files`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            successfullyAddedSources.push(...(Array.isArray(data) ? data : [data]));

          } else if (source.type === 'text') {
            // Assuming backend returns the created Source object(s)
            const { data } = await axios.post(`/agents/${newAgentId}/sources/text`, {
              title: source.title,
              content: source.content,
            });
            successfullyAddedSources.push(...(Array.isArray(data) ? data : [data]));

          } else if (source.type === 'link') {
            // Assuming backend returns the created Source object(s)
            const { data } = await axios.post(`/agents/${newAgentId}/sources/links`, {
              url: source.url,
              includePaths: source.includePaths,
              excludePaths: source.excludePaths,
            });
            successfullyAddedSources.push(...(Array.isArray(data) ? data : [data]));

          } else if (source.type === 'qa') {
            // Assuming backend returns the created Source object(s)
            const { data } = await axios.post(`/agents/${newAgentId}/sources/qa`, {
              title: source.title,
              questions: source.questions,
            });
            successfullyAddedSources.push(...(Array.isArray(data) ? data : [data]));

          } 
          // Handle other types like 'notion' here if needed

        } catch (sourceError: any) {
           console.error(`Error adding source ${source.type}:`, sourceError);
           toast({
             title: `Failed to add ${source.type} source`,
             description: sourceError.response?.data?.message || `Could not add source: ${sourceError.message}`,
             variant: "destructive",
           });
           // Continue adding other sources even if one fails
        }
      }
      
      // Update the list of uploaded sources with the newly added ones
      handleAddUploadedSource(successfullyAddedSources);
      // Clear the list of pending sources
      setPendingSources([]);

      toast({
        title: "Agent created",
        description: `Successfully created agent "${agentName}" and added ${successfullyAddedSources.length} sources.`,
      })
      
      // Redirect to the new agent page
      router.push(`/agents/${newAgentId}`)
    } catch (error: any) {
      console.error('Error creating agent or adding sources:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create agent or add sources. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false)
    }
  }

  const getSourcesByType = (type: SourceType) => {
    return uploadedSources.filter((source) => source.type === type)
  }

  const handleFilesSelected = useCallback((files: File[]) => {
    console.log("Files received in create/page.tsx handleFilesSelected (via useCallback):", files);
    // Update checkedFiles state first
    setCheckedFiles(files);
    // Then add each file to pendingSources
    files.forEach(file => {
      console.log("Adding file to pendingSources:", file.name);
      handleAddPendingSource({ type: "file", file });
    });
  }, [handleAddPendingSource]);

  const renderContent = () => {
    console.log("handleFilesSelected inside renderContent:", handleFilesSelected); // Add this log
    switch (activeTab) {
      case "files":
        console.log("Rendering FileUpload with props:", {
          agentId: "new",
          onUploadComplete: handleAddUploadedSource,
          sources: uploadedSources.filter(s => s.type === "file"),
          onRemoveSource: handleRemoveUploadedSource,
          isAuthenticated: true,
          onFilesSelected: handleFilesSelected
        });
        return (
          <FileUpload 
            agentId="new"
            onUploadComplete={handleAddUploadedSource}
            sources={uploadedSources.filter(s => s.type === "file")}
            onRemoveSource={handleRemoveUploadedSource}
            isAuthenticated={true}
            onFilesSelected={handleFilesSelected}
          />
        )
      case "text":
        return <TextEditor 
          onAddSource={(sources) => sources.forEach(source => 
            handleAddPendingSource({ type: "text", title: source.name, content: source.content || '' }) // Pass individual source as PendingSource
          )}
          sources={uploadedSources.filter(s => s.type === "text")}
          onRemoveSource={handleRemoveUploadedSource} 
        />
      case "website":
        return <WebsiteCrawler 
          onAddSource={(sources) => sources.forEach(source => {
            // Ensure url is a string and is not empty
            if (source.url && typeof source.url === 'string') {
              const url = source.url;
              // Ensure includePaths and excludePaths are string arrays or undefined
              const includePaths = Array.isArray(source.metadata?.includePaths) ? source.metadata.includePaths : (typeof source.metadata?.includePaths === 'string' ? source.metadata.includePaths.split(',').map(p => p.trim()) : undefined);
              const excludePaths = Array.isArray(source.metadata?.excludePaths) ? source.metadata.excludePaths : (typeof source.metadata?.excludePaths === 'string' ? source.metadata.excludePaths.split(',').map(p => p.trim()) : undefined);

              handleAddPendingSource({ type: "link", url, includePaths, excludePaths }); // Pass individual source as PendingSource
            }
            // If url is not valid, the source is not added to pendingSources
          })}
          sources={uploadedSources.filter(s => s.type === "link")}
          onRemoveSource={handleRemoveUploadedSource} 
        />
      case "qa":
        return <QAEditor 
          onAddSource={(sources) => sources.forEach(source => 
            handleAddPendingSource({ type: "qa", title: source.name, questions: source.metadata?.questions }) // Pass individual source as PendingSource
          )}
          sources={uploadedSources.filter(s => s.type === "qa")}
          onRemoveSource={handleRemoveUploadedSource} 
        />
      case "notion":
        // Notion might require a different flow as it's an integration
        return <NotionIntegration onAddSource={(source) => console.log("Notion source added to pending:", source)} /> // Adjust as needed
      default:
        return null
    }
  }

  // Get combined list of pending and uploaded sources for the sidebar display
  const pendingSourceDisplayList = pendingSources.map(s => {
      // Convert pending sources to a display format similar to Source interface
      if (s.type === "file") {
          const fileSource = s as FileSource; // Type assertion for clarity
          return { id: `pending-${fileSource.file.name}`, type: fileSource.type, name: fileSource.file.name, size: fileSource.file.size, isNew: true } as Source; // Assert return type
      }
      if (s.type === "text") {
          const textSource = s as TextSource; // Type assertion for clarity
          return { id: `pending-${textSource.title}`, type: textSource.type, name: textSource.title, size: textSource.content.length, isNew: true } as Source; // Assert return type
      }
      if (s.type === "link") {
           const linkSource = s as LinkSource; // Type assertion for clarity
          return { id: `pending-${linkSource.url}`, type: linkSource.type, name: linkSource.url, size: 0, isNew: true } as Source; // Assert return type
      }
      if (s.type === "qa") {
           const qaSource = s as QASource; // Type assertion for clarity
          return { id: `pending-${qaSource.title}`, type: qaSource.type, name: qaSource.title, size: 0, isNew: true } as Source; // Assert return type
      }
      // Fallback for any unhandled types in the union (should not happen if all covered)
      // Return a default Source structure
       const unknownSource = s as { type: SourceType; [key: string]: any }; // Assert to a more general type
       return { id: `pending-unknown`, type: unknownSource.type, name: "Unknown Source", size: 0, isNew: true, content: undefined, url: undefined, metadata: undefined } as Source; // Assert return type

  });

   const uploadedSourceDisplayList = uploadedSources.map(s => ({ ...s, isNew: false })) as Source[]; // Ensure uploaded sources also match Source type

  console.log("pendingSourceDisplayList:", pendingSourceDisplayList); // Add this log
  console.log("uploadedSourceDisplayList:", uploadedSourceDisplayList); // Add this log

  const allSources: Source[] = [...pendingSourceDisplayList, ...uploadedSourceDisplayList];
  console.log("allSources:", allSources); // Add this log

  // Calculate total size for the sidebar display from all sources (including pending file size)
  const totalDisplaySize = allSources.reduce((total, source) => total + (source.type === "file" ? source.size : 0), 0) // Sum up file sizes for now
  // Adjust totalDisplaySize calculation if other source types have meaningful size before upload

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
              <TabsTrigger value="files">Files ({pendingSources.filter(s => s.type === "file").length})</TabsTrigger>
              <TabsTrigger value="text">Text ({pendingSources.filter(s => s.type === "text").length})</TabsTrigger>
              <TabsTrigger value="website">Website ({pendingSources.filter(s => s.type === "link").length})</TabsTrigger>
              <TabsTrigger value="qa">Q&A ({pendingSources.filter(s => s.type === "qa").length})</TabsTrigger>
              <TabsTrigger value="notion">Notion</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {renderContent()}
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar */}
        <SourcesSidebar 
          sources={allSources} // Pass combined list to sidebar
          totalSize={totalDisplaySize} // Pass calculated display size
          maxSize={maxSize} 
          onCreateAgent={handleCreateAgent}
          isCreating={isCreating}
          // onRemoveSource={handleRemovePendingSource} // Sidebar needs to know which source list to modify
        />
      </div>

      {showPurchaseModal && (
        <PurchaseAddon onClose={() => setShowPurchaseModal(false)} />
      )}
    </div>
  )
}

// Helper function, ensure this is defined or imported
// import { formatFileSize } from '@/app/page'; // Assuming it's in this path

// Dummy FileIcon component if not imported
function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}