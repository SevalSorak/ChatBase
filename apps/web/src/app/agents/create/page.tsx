"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { SourcesSidebar } from "@/components/sources-sidebar";
import { FileUpload } from "@/components/file-upload";
import { TextEditor } from "@/components/text-editor";
import { WebsiteCrawler } from "@/components/website-crawler";
import { QAEditor } from "@/components/qa-editor";
import { NotionIntegration } from "@/components/notion-integration";
import { PurchaseAddon } from "@/components/purchase-addon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { AxiosError } from "axios"; // AxiosError’ı değer olarak içe aktarıyoruz

export type SourceType = "file" | "text" | "link" | "qa" | "notion";

// Define interfaces for different source types before they are added to backend
interface FileSource { type: "file"; file: File }
interface TextSource { type: "text"; title: string; content: string }
interface LinkSource {
  type: "link";
  url: string;
  includePaths?: string[];
  excludePaths?: string[];
}
interface QASource {
  type: "qa";
  title: string;
  questions: { question: string; answer: string }[];
}

type PendingSource = FileSource | TextSource | LinkSource | QASource; // Union type of all pending sources

export type Source = {
  id: string;
  type: SourceType;
  name: string;
  size: number;
  content?: string;
  url?: string;
  isNew?: boolean;
  metadata?: Record<string, unknown>;  // <-- Burada `any` yerine `unknown` kullandık
};

export default function CreateAgentPage() {
  const [activeTab, setActiveTab] = useState<"files" | "text" | "website" | "qa" | "notion">("files");
  const [uploadedSources, setUploadedSources] = useState<Source[]>([]); // Successfully uploaded to backend
  const [pendingSources, setPendingSources] = useState<PendingSource[]>([]); // User-selected but not-yet-backed sources
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const maxSize = 400 * 1024 * 1024; // 400 MB

  // --- 1) pendingSources state güncellemeleri ---

  // Add a pending source
  const handleAddPendingSource = useCallback(
    (source: PendingSource) => {
      setPendingSources((prev) => [...prev, source]);
    },
    []
  );

  // Remove a pending source by its index
  const handleRemovePendingSource = useCallback(
    (index: number) => {
      setPendingSources((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  // --- 2) uploadedSources state güncellemeleri ---

  // Add uploaded (backed) sources into state
  const handleAddUploadedSource = (sources: Source[]) => {
    setUploadedSources((prev) => [...prev, ...sources]);
  };

  // Remove an uploaded source (UI only for now)
  const handleRemoveUploadedSource = (id: string) => {
    setUploadedSources((prev) => prev.filter((source) => source.id !== id));
    // TODO: Backend call to delete source if desired
  };

  // --- 3) Agent oluşturma işlemi ---

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      toast({
        title: "Missing agent name",
        description: "Please provide a name for your agent",
        variant: "destructive",
      });
      return;
    }

    if (pendingSources.length === 0 && uploadedSources.length === 0) {
      toast({
        title: "No sources added",
        description: "Please add at least one source to create an agent",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);

      // 3.1) Agent'ı backend'de oluştur
      const { data: agent } = await axios.post<{ id: string }>("/agents", {
        name: agentName,
        description: agentDescription,
      });
      const newAgentId = agent.id;

      const successfullyAddedSources: Source[] = [];

      // 3.2) pendingSources içindeki her kaynağı backend'e gönder
      for (const source of pendingSources) {
        try {
          if (source.type === "file") {
            const formData = new FormData();
            formData.append("files", source.file);

            const { data } = await axios.post<Source[]>(
              `/agents/${newAgentId}/sources/files`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            successfullyAddedSources.push(...data);
          } else if (source.type === "text") {
            const { data } = await axios.post<Source[]>(
              `/agents/${newAgentId}/sources/text`,
              { title: source.title, content: source.content }
            );
            successfullyAddedSources.push(...data);
          } else if (source.type === "link") {
            const { data } = await axios.post<Source[]>(
              `/agents/${newAgentId}/sources/links`,
              {
                url: source.url,
                includePaths: source.includePaths,
                excludePaths: source.excludePaths,
              }
            );
            successfullyAddedSources.push(...data);
          } else if (source.type === "qa") {
            const { data } = await axios.post<Source[]>(
              `/agents/${newAgentId}/sources/qa`,
              { title: source.title, questions: source.questions }
            );
            successfullyAddedSources.push(...data);
          }
          // (Extend for 'notion', vb.)
        } catch (err: unknown) {
          console.error(`Error adding source ${source.type}:`, err);
          if (err instanceof AxiosError && err.response) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            toast({
              title: `Failed to add ${source.type} source`,
              description: axiosErr.response?.data?.message || axiosErr.message,
              variant: "destructive",
            });
          } else if (err instanceof Error) {
            toast({
              title: `Failed to add ${source.type} source`,
              description: err.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: `Failed to add ${source.type} source`,
              description: "An unexpected error occurred",
              variant: "destructive",
            });
          }
          // Continue with other sources
        }
      }

      // 3.3) Başarılı eklenenleri state'e ekle, pendingSources'ı temizle
      handleAddUploadedSource(successfullyAddedSources);
      setPendingSources([]);

      toast({
        title: "Agent created",
        description: `Successfully created agent "${agentName}" and added ${successfullyAddedSources.length} sources.`,
      });

      // 3.4) Yönlendir
      router.push(`/agents/${newAgentId}`);
    } catch (err: unknown) {
      console.error("Error creating agent or adding sources:", err);
      if (err instanceof AxiosError && err.response) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        toast({
          title: "Error",
          description: axiosErr.response?.data?.message || axiosErr.message,
          variant: "destructive",
        });
      } else if (err instanceof Error) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // --- 4) FileUpload'dan seçili dosyaları alıp pendingSources'a ekleyen handler ---

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      console.log("Files received in CreateAgentPage handleFilesSelected:", files);
      files.forEach((file) => {
        console.log("Adding file to pendingSources:", file.name);
        handleAddPendingSource({ type: "file", file });
      });
    },
    [handleAddPendingSource]
  );

  // --- 5) renderContent: sekmelere göre içeriği döndürür ---

  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return (
          <FileUpload
            agentId="new"
            onUploadComplete={handleAddUploadedSource}
            sources={uploadedSources.filter((s): s is Source => s.type === "file")}
            onRemoveSource={handleRemoveUploadedSource}
            isAuthenticated={true}
            onFilesSelected={handleFilesSelected}
          />
        );
      case "text":
        return (
          <TextEditor
            onAddSource={(sources: Source[]) => {
              sources.forEach((source) => {
                handleAddPendingSource({
                  type: "text",
                  title: source.name,
                  content: source.content || "",
                });
              });
            }}
            sources={uploadedSources.filter((s): s is Source => s.type === "text")}
            onRemoveSource={handleRemoveUploadedSource}
          />
        );
      case "website":
        return (
          <WebsiteCrawler
            onAddSource={(sources: Source[]) => {
              sources.forEach((source) => {
                if (source.type === "link" && source.url) {
                  const includePaths = Array.isArray(source.metadata?.includePaths)
                    ? source.metadata.includePaths
                    : typeof source.metadata?.includePaths === "string"
                    ? source.metadata.includePaths.split(",").map((p) => p.trim())
                    : undefined;
                  const excludePaths = Array.isArray(source.metadata?.excludePaths)
                    ? source.metadata.excludePaths
                    : typeof source.metadata?.excludePaths === "string"
                    ? source.metadata.excludePaths.split(",").map((p) => p.trim())
                    : undefined;
                  handleAddPendingSource({
                    type: "link",
                    url: source.url,
                    includePaths,
                    excludePaths,
                  });
                }
              });
            }}
            sources={uploadedSources.filter((s): s is Source => s.type === "link")}
            onRemoveSource={handleRemoveUploadedSource}
          />
        );
      case "qa":
        return (
          <QAEditor
            onAddSource={(sources: Source[]) => {
              sources.forEach((source) => {
                if (source.type === "qa" && Array.isArray(source.metadata?.questions)) {
                  handleAddPendingSource({
                    type: "qa",
                    title: source.name,
                    questions: source.metadata.questions,
                  });
                }
              });
            }}
            sources={uploadedSources.filter((s): s is Source => s.type === "qa")}
            onRemoveSource={handleRemoveUploadedSource}
          />
        );
      case "notion":
        return (
          <NotionIntegration
            onAddSource={(sources: Source[]) => {
              // NotionIntegration’dan bir dizi Source dönüyorsa:
              sources.forEach((source) => {
                console.log("Notion source added to pending:", source);
                if (
                  source.type === "text" ||
                  source.type === "link" ||
                  source.type === "qa"
                ) {
                  handleAddPendingSource(source as PendingSource);
                } else {
                  console.warn("Unhandled source type from NotionIntegration:", source.type);
                }
              });
            }}
          />
        );
      default:
        return null;
    }
  };

  // --- 6) pendingSources → Source[] formatına dönüştürme (sidebar için) ---

  const pendingSourceDisplayList: Source[] = pendingSources.map((s) => {
    if (s.type === "file") {
      const f = s as FileSource;
      return {
        id: `pending-file-${f.file.name}`,
        type: f.type,
        name: f.file.name,
        size: f.file.size,
        isNew: true,
        content: undefined,
        url: undefined,
        metadata: undefined,
      } as Source;
    }
    if (s.type === "text") {
      const t = s as TextSource;
      return {
        id: `pending-text-${t.title}`,
        type: t.type,
        name: t.title,
        size: t.content.length,
        isNew: true,
        content: t.content,
        url: undefined,
        metadata: undefined,
      } as Source;
    }
    if (s.type === "link") {
      const l = s as LinkSource;
      return {
        id: `pending-link-${l.url}`,
        type: l.type,
        name: l.url,
        size: 0,
        isNew: true, 
        content: undefined,
        url: l.url,
        metadata: { includePaths: l.includePaths, excludePaths: l.excludePaths },
      } as Source;
    }
    if (s.type === "qa") {
      const q = s as QASource;
      return {
        id: `pending-qa-${q.title}`,
        type: q.type,
        name: q.title,
        size: 0,
        isNew: true,
        content: undefined,
        url: undefined,
        metadata: { questions: q.questions },
      } as Source;
    }
    // Fallback (tipi bilinmeyen)
    const unknownSource = s as PendingSource;
    return {
      id: `pending-unknown-${Date.now()}`,
      type: unknownSource.type || ("text" as SourceType),
      name: "Unknown Source",
      size: 0,
      isNew: true,
      content: undefined,
      url: undefined,
      metadata: undefined,
    } as Source;
  });

  const uploadedSourceDisplayList: Source[] = uploadedSources.map((s) => ({
    ...s,
    isNew: false,
  }));

  const allSources: Source[] = [...pendingSourceDisplayList, ...uploadedSourceDisplayList];

  // Toplam dosya boyutu (sadece "file" kaynakları)
  const totalDisplaySize = allSources.reduce((total, source) => {
    return total + (source.type === "file" ? source.size : 0);
  }, 0);

  // "Create Agent" butonunun enable/disable durumu
  const isCreateButtonEnabled =
    (pendingSources.length > 0 || uploadedSources.length > 0) && !isCreating;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sol tarafta tabları gösteren Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Ana içerik kısmı */}
        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-8">Create new agent</h1>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="agent-name">Agent name</Label>
                  <Input
                    id="agent-name"
                    placeholder="My AI Agent"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="agent-description">Description (optional)</Label>
                  <Input
                    id="agent-description"
                    placeholder="What this agent does..."
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(value: string) =>
              setActiveTab(value as "files" | "text" | "website" | "qa" | "notion")
            }
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="files">
                Files ({pendingSources.filter((s) => s.type === "file").length})
              </TabsTrigger>
              <TabsTrigger value="text">
                Text ({pendingSources.filter((s) => s.type === "text").length})
              </TabsTrigger>
              <TabsTrigger value="website">
                Website ({pendingSources.filter((s) => s.type === "link").length})
              </TabsTrigger>
              <TabsTrigger value="qa">
                Q&A ({pendingSources.filter((s) => s.type === "qa").length})
              </TabsTrigger>
              <TabsTrigger value="notion">Notion</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>{renderContent()}</TabsContent>
          </Tabs>
        </main>

        {/* Sağdaki kaynaklar sidebar'ı */}
        <SourcesSidebar
          sources={allSources}
          totalSize={totalDisplaySize}
          maxSize={maxSize}
          onCreateAgent={handleCreateAgent}
          isCreating={isCreating}
          onRemovePendingSource={handleRemovePendingSource}
        />
      </div>

      {showPurchaseModal && <PurchaseAddon onClose={() => setShowPurchaseModal(false)} />}

      {/* Ekranın altında sabit "Create Agent" butonu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end">
        <Button onClick={handleCreateAgent} disabled={!isCreateButtonEnabled}>
          {isCreating ? "Creating Agent..." : "Create Agent"}
        </Button>
      </div>
    </div>
  );
}
