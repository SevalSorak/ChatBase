import { Button } from "@/components/ui/button"
import type { Source } from "@/app/page"
import { formatFileSize } from "@/app/page"

interface SourcesSidebarProps {
  sources: Source[]
  totalSize: number
  maxSize: number
  onCreateAgent?: () => void
  readOnly?: boolean
  isCreating?: boolean
}

export function SourcesSidebar({ sources, totalSize, maxSize, onCreateAgent }: SourcesSidebarProps) {
  const fileCount = sources.filter(s => s.type === "file").length
  const textCount = sources.filter(s => s.type === "text").length
  const linkCount = sources.filter(s => s.type === "link").length
  const qaCount = sources.filter(s => s.type === "qa").length

  return (
    <div className="w-72 border-l border-gray-200 bg-white p-6 hidden lg:block">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">SOURCES</h3>

      {sources.length > 0 && (
        <div className="space-y-2 mb-6">
          {fileCount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{fileCount} {fileCount === 1 ? "File" : "Files"}</span>
              </div>
              <span className="text-sm font-medium">{formatFileSize(sources.filter(s => s.type === "file").reduce((acc, s) => acc + s.size, 0))}</span>
            </div>
          )}
          
          {textCount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <TextIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{textCount} Text {textCount === 1 ? "File" : "Files"}</span>
              </div>
              <span className="text-sm font-medium">{formatFileSize(sources.filter(s => s.type === "text").reduce((acc, s) => acc + s.size, 0))}</span>
            </div>
          )}
          
          {linkCount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <GlobeIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{linkCount} {linkCount === 1 ? "Link" : "Links"}</span>
              </div>
              <span className="text-sm font-medium">{formatFileSize(sources.filter(s => s.type === "link").reduce((acc, s) => acc + s.size, 0))}</span>
            </div>
          )}
          
          {qaCount > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <HelpCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{qaCount} Q&A</span>
              </div>
              <span className="text-sm font-medium">{formatFileSize(sources.filter(s => s.type === "qa").reduce((acc, s) => acc + s.size, 0))}</span>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-dashed border-gray-200 my-4"></div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-700">Total size:</span>
            <span className="text-sm font-medium">{formatFileSize(totalSize)}</span>
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">/ {formatFileSize(maxSize)}</span>
          </div>
        </div>

        <Button
          className="w-full bg-black text-white hover:bg-gray-800"
          disabled={sources.length === 0 || totalSize > maxSize}
          onClick={onCreateAgent}
        >
          Create agent
        </Button>
      </div>
    </div>
  )
}

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
  )
}

function TextIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M14 2v6h6" />
      <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2z" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
      <path d="M10 8h1" />
    </svg>
  )
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function HelpCircleIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
}
