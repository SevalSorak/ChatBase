'use client';

import { useState, useRef } from 'react';
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
}

export function FileUpload({ agentId, onUploadComplete, sources = [], onRemoveSource, isAuthenticated }: FileUploadProps) {
  console.log('FileUpload rendered');
  console.log('FileUpload sources prop:', sources);
  console.log('FileUpload sources length:', sources.length);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAuthenticated: authIsAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!authIsAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload files',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
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
      
      await uploadFile(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    if (!authIsAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload files',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!agentId || agentId === 'new') {
      try {
        // Create new agent first
        const { data: agent } = await axios.post('/agents', {
          name: file.name.split('.')[0],
          description: `Agent created from ${file.name}`,
        });
        
        // Use the new agent's ID
        agentId = agent.id;
      } catch (error: any) {
        console.error('Agent creation error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create agent. Please try again.',
          variant: 'destructive',
        });
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const { data } = await axios.post(`/agents/${agentId}/sources/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'File uploaded',
        description: `${file.name} has been uploaded successfully`,
      });
      
      onUploadComplete(data);
    } catch (error: any) {
      console.error('Upload error:', error);
      
      if (error.response) {
        // Sunucu cevap verdi ama hata döndü
        toast({
          title: `Upload failed (${error.response.status})`,
          description: error.response.data?.error ?? 'Unknown server error',
          variant: 'destructive',
        });
      } else if (error.request) {
        // İstek atıldı ama cevap yok
        toast({
          title: 'Connection error',
          description: 'Could not reach the server. Is the backend running?',
          variant: 'destructive',
        });
      } else {
        // Axios hatası
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSelectAllFiles = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(sources.map(source => source.id));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleSelectFile = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, id]);
    } else {
      setSelectedFiles(selectedFiles.filter(i => i !== id));
    }
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
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Select Files'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        If you're uploading a PDF, make sure the text is selectable/highlightable.
      </p>
      {sources.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
           <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Checkbox
                id="select-all-files"
                 checked={selectedFiles.length === sources.length && sources.length > 0}
                 onCheckedChange={(checked) => handleSelectAllFiles(checked as boolean)}
                className="mr-3"
              />
               <h3 className="font-medium">Uploaded Files</h3>
             </div>
           </div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
            {sources.map(source => (
              <div key={source.id} className="p-4 flex items-center justify-between text-sm text-gray-700">
                 <Checkbox
                   id={`file-${source.id}`}
                   checked={selectedFiles.includes(source.id)}
                   onCheckedChange={(checked) => handleSelectFile(source.id, checked as boolean)}
                   className="mr-3 flex-shrink-0"
                 />
                  <div className="flex-1 flex items-center min-w-0">
                     <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <FileIcon className="h-4 w-4 text-gray-500" />
                     </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center">
                         <p className="text-sm font-medium text-gray-900 truncate mr-2">{source.name}</p>
                         {source.isNew && (
                           <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded flex-shrink-0">
                             New
                           </span>
                         )}
                       </div>
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