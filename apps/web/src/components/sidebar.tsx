import type React from "react"
import { FileIcon, TextIcon, GlobeIcon, HelpCircleIcon, FileTextIcon } from 'lucide-react'
import Link from "next/link"

interface SidebarProps {
  activeTab: "files" | "text" | "website" | "qa" | "notion"
  onTabChange: (tab: "files" | "text" | "website" | "qa" | "notion") => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 border-r border-gray-200 bg-white py-6 hidden md:block">
      <nav className="space-y-1 px-3">
        <SidebarItem 
          icon={<FileIcon className="h-5 w-5" />} 
          label="Files" 
          active={activeTab === "files"} 
          onClick={() => onTabChange("files")}
        />
        <SidebarItem 
          icon={<TextIcon className="h-5 w-5" />} 
          label="Text" 
          active={activeTab === "text"} 
          onClick={() => onTabChange("text")}
        />
        <SidebarItem 
          icon={<GlobeIcon className="h-5 w-5" />} 
          label="Website" 
          active={activeTab === "website"} 
          onClick={() => onTabChange("website")}
        />
        <SidebarItem 
          icon={<HelpCircleIcon className="h-5 w-5" />} 
          label="Q&A" 
          active={activeTab === "qa"} 
          onClick={() => onTabChange("qa")}
        />
        <SidebarItem 
          icon={<FileTextIcon className="h-5 w-5" />} 
          label="Notion" 
          active={activeTab === "notion"} 
          onClick={() => onTabChange("notion")}
        />
      </nav>
    </div>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-left ${
        active ? "bg-purple-50 text-purple-600" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className={active ? "text-purple-600" : "text-gray-500"}>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )
}
