import type React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SourcesSidebar } from "@/components/sources-sidebar"

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Hidden on mobile */}
        <Sidebar 
          activeTab="files"
          onTabChange={() => {}}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>

        {/* Right Sidebar - Hidden on mobile and tablet */}
        <SourcesSidebar 
          sources={[]}
          totalSize={0}
          maxSize={1000000}
        />
      </div>
    </div>
  )
}
