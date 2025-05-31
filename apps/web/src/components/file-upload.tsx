'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import type { Source } from '@/app/page';
import { formatFileSize } from '@/app/page';
import { Checkbox } from '@/components/ui/checkbox';

interface FileUploadProps {
  agentId: string;
  onUploadComplete: (sources: Source[]) => void;
  sources?: any[];
  onRemoveSource?: (id: string) => void;
  isAuthenticated: boolean;
  onFilesSelected?: (files: File[]) => void;
  selectedFiles?: File[];
}

// New type to hold file and its checked state
type FileWithChecked = { file: File; checked: boolean };

export function FileUpload(props: FileUploadProps) {
  console.log("FileUpload received ALL props:", props);
  const { agentId, onUploadComplete, sources = [], onRemoveSource, isAuthenticated, onFilesSelected } = props;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Initialize with empty array
  const isFirstRender = useRef(true);
  const prevSelectedFilesRef = useRef<File[]>([]);
  
  console.log("FileUpload internal selectedFiles state:", selectedFiles);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAuthenticated: authIsAuthenticated } = useAuth();
  const router = useRouter();

  // Use a local state for dragging/uploading if needed, or manage externally
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Effect to notify parent when selectedFiles changes
  useEffect(() => {
    console.log("FileUpload useEffect triggered by selectedFiles change:", selectedFiles);
    
    // Skip the first render
    if (isFirstRender.current) {
      console.log("Skipping first render notification");
      isFirstRender.current = false;
      prevSelectedFilesRef.current = selectedFiles;
      return;
    }

    // Check if files actually changed
    const filesChanged = selectedFiles.length !== prevSelectedFilesRef.current.length ||
      selectedFiles.some((file, index) => file !== prevSelectedFilesRef.current[index]);

    if (filesChanged && onFilesSelected) {
      console.log("Files changed, notifying parent:", selectedFiles);
      onFilesSelected(selectedFiles);
      prevSelectedFilesRef.current = selectedFiles;
    }
  }, [selectedFiles, onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Instead of setting internal state, pass files up via a new prop or re-use onFilesSelected
      // Let's re-use onFilesSelected for now, assuming parent will update the selectedFiles prop
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange called, files:", e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      console.log("First file details:", {
        name: e.target.files[0].name,
        type: e.target.files[0].type,
        size: e.target.files[0].size
      });
      // Instead of setting internal state, pass files up via onFilesSelected
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    console.log("handleFiles called with files:", files);
    console.log("First file details in handleFiles:", {
      name: files[0].name,
      type: files[0].type,
      size: files[0].size
    });
    const token = localStorage.getItem('accessToken');
    
    if (!token || !isAuthenticated) {
      console.warn('User not authenticated, redirecting to login.');
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload files',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Only PDF, DOCX, and TXT files are allowed',
          variant: 'destructive',
        });
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        continue;
      }
      
      validFiles.push(file);
    }

    // Update internal state only
    setSelectedFiles(prevFiles => {
      const updatedFiles = [...prevFiles, ...validFiles];
      console.log("Updating selectedFiles state with:", updatedFiles);
      return updatedFiles;
    });

    // Reset file input value to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prevFiles => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      console.log("Removing file at index:", index, "Updated files:", updatedFiles);
      return updatedFiles;
    });
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-muted rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-base font-medium">Drag and drop files here, or click to select</p>
          <p className="text-sm text-muted-foreground mt-1">Supported file types: PDF, DOCX, TXT</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button 
          variant="outline" 
          onClick={() => {
            console.log("Select Files button clicked, attempting to click file input");
            fileInputRef.current?.click();
          }}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Select Files'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        If you're uploading a PDF, make sure the text is selectable/highlightable.
      </p>
      
      {selectedFiles && selectedFiles.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Selected Files</h3>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="p-4 flex items-center justify-between text-sm text-gray-700"
              >
                {/* 1. Sol taraf: Checkbox + ikon + isim */}
                <div className="flex items-center space-x-2">
                  {/* Checkbox - Checkbox state should probably be managed by parent if using selectedFiles prop */}
                  {/* Keeping checkbox for now, but its state management needs reconsideration in this prop-based approach */}
                  {/* Maybe a separate prop like onFileCheckedChange is needed if checkbox state is managed externally */}
                  {/* <Checkbox\n                    checked={true} // Assuming files in selectedFiles are conceptually checked for adding\n                    onCheckedChange={(checked) => { */}
                    {/* This needs to inform the parent to update the checked state of a specific file */}
                    {/* This flow becomes complicated without a clear state management strategy */}
                    {/* console.log("Checkbox checked change for file index", index, ":", checked);\n                    }}\n                  /> */}
                  {/* File ikonu */}
                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  {/* Dosya adı ve boyut */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                {/* 2. Sağ taraf: Remove butonu */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  onClick={() => removeSelectedFile(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Uploaded Files</h3>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
            {sources.map(source => (
              <div key={source.id} className="p-4 flex items-center justify-between text-sm text-gray-700">
                <div className="flex-1 flex items-center min-w-0">
                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{source.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(source.size)}</p>
                  </div>
                </div>
                {onRemoveSource && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                    onClick={() => onRemoveSource(source.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  );
}