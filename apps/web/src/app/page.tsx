"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { FileUpload, type UploadedFile } from "@/components/file-upload"
import { SourcesSidebar } from "@/components/sources-sidebar"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles)
  }

  const handleCreateAgent = async () => {
    setIsCreating(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "Agent created successfully",
      description: `Created agent with ${files.length} file${files.length !== 1 ? "s" : ""}`,
    })

    setIsCreating(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8">Create new agent</h1>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-medium text-gray-800 mb-6">Files</h2>
            <FileUpload onFilesChange={handleFilesChange} />
          </div>
        </main>

        {/* Right Sidebar */}
        <SourcesSidebar files={files} onCreateAgent={handleCreateAgent} />
      </div>

      <Toaster />
    </div>
  )
}
