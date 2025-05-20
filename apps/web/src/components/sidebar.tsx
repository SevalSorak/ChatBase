import type React from "react"
import { FileIcon, TextIcon, GlobeIcon, HelpCircleIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"

export function Sidebar() {
  return (
    <div className="w-64 border-r border-gray-200 bg-white py-6 hidden md:block">
      <nav className="space-y-1 px-3">
        <SidebarItem icon={<FileIcon className="h-5 w-5" />} label="Files" active />
        <SidebarItem icon={<TextIcon className="h-5 w-5" />} label="Text" />
        <SidebarItem icon={<GlobeIcon className="h-5 w-5" />} label="Website" />
        <SidebarItem icon={<HelpCircleIcon className="h-5 w-5" />} label="Q&A" />
        <SidebarItem icon={<FileTextIcon className="h-5 w-5" />} label="Notion" />
      </nav>
    </div>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
}

function SidebarItem({ icon, label, active }: SidebarItemProps) {
  return (
    <Link
      href="#"
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className={active ? "text-blue-600" : "text-gray-500"}>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}
