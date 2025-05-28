"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Source } from "@/app/page"

interface NotionIntegrationProps {
  onAddSource: (sources: Source[]) => void
}

export function NotionIntegration({ onAddSource }: NotionIntegrationProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  const handleImportFromNotion = () => {
    setShowConnectDialog(true)
  }

  const handleConnectNotion = () => {
    // Simulate connecting to Notion and adding a source
    const source: Source = {
      id: generateId(),
      type: "notion",
      name: "Notion Integration",
      size: 0,
      isNew: true,
    }

    onAddSource([source])
    setShowConnectDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-medium text-gray-800 mb-4">Notion</h2>
        
        <p className="text-gray-600 mb-6">
          Add and process Notion sources to train your AI Agent with precise information. 
          <a href="#" className="text-blue-600 hover:underline ml-1">Learn more</a>
        </p>
        
        <div className="flex justify-center py-12">
          <Button 
            variant="secondary" 
            onClick={handleImportFromNotion}
          >
            Import from Notion
          </Button>
        </div>
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Notion</DialogTitle>
            <DialogDescription>
              Please note that the pages you select will affect the Notion pages Chatbase has access to across all your agents, as well as any other Chatbase accounts connected to the same Notion account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              If you have any previously selected pages for other active agents. Please leave them selected.
            </p>
            <p className="text-sm font-medium">Note: Please do not unselect already selected pages.</p>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-black text-white hover:bg-gray-800" onClick={handleConnectNotion}>
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
