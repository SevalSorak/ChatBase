import Link from "next/link"
import { MobileSidebar } from "@/components/mobile-sidebar"

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
      <MobileSidebar />
      <Link href="/" className="text-xl font-bold">
        Chatbase
      </Link>
      <div className="relative ml-auto flex-1 md:grow-0"></div>
      {/* <ModeToggle /> */}
    </header>
  )
}
