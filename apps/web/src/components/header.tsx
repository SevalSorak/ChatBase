import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export function Header() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="bg-black text-white w-8 h-8 rounded-md flex items-center justify-center">
          <span className="font-medium">C</span>
        </div>
        <span className="font-medium text-gray-800">My Workspace</span>
      </div>

      <div className="flex items-center space-x-6">
        <nav className="flex items-center space-x-6">
          <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
            Docs
          </Link>
          <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
            Help
          </Link>
          <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
            Changelog
          </Link>
        </nav>

        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
