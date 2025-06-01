"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { SourcesSidebar } from "@/components/sources-sidebar";
import { FileUpload } from "@/components/file-upload";
import { TextEditor } from "@/components/text-editor";
import { WebsiteCrawler } from "@/components/website-crawler";
import { QAEditor } from "@/components/qa-editor";
import { NotionIntegration } from "@/components/notion-integration";
import { PurchaseAddon } from "@/components/purchase-addon";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { formatFileSize } from "@/lib/utils"

export type SourceType = "file" | "text" | "link" | "qa" | "notion";

export type Source = {
  id: string;
  type: SourceType;
  name: string;
  size: number;
  content?: string;
  url?: string;
  isNew?: boolean;
  metadata?: {
    includePaths?: string[];
    excludePaths?: string[];
    questions?: { question: string; answer: string }[];
    lastCrawled?: string;
    lastScraped?: string;
    type?: string;
    links?: number;
  };
  fileSize?: number;
};

/**
 * Yardımcı fonksiyon: unknown tipindeki hatanın AxiosError olup olmadığını kontrol eder
 */
function isAxiosError(
  error: unknown
): error is { response?: { data?: { message?: string } }; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "config" in error
  );
}

export default function Home() {
  const [activeTab, setActiveTab] =
    useState<"files" | "text" | "website" | "qa" | "notion">("files");
  const [sources, setSources] = useState<Source[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const totalSize = sources.reduce((total, source) => total + source.size, 0);
  const maxSize = 400 * 1024; // 400 KB

  // -------------------------------
  // 1) Sayfa yüklendiğinde kimlik doğrulama kontrolü
  //    `login` fonksiyonunu doğrudan useEffect içine aldık
  // -------------------------------
  useEffect(() => {
    const login = async (): Promise<boolean> => {
      try {
        const response = await axios.post<{ accessToken: string }>(
          "/auth/login",
          {
            email: "testseval1@gmail.com",
            password: "testseval",
          }
        );
        const token = response.data.accessToken;
        if (!token) {
          throw new Error("Sunucudan token alınamadı");
        }
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        toast({
          title: "Giriş başarılı",
          description: "Artık giriş yaptınız",
        });
        return true;
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.data?.message) {
          toast({
            title: "Giriş başarısız",
            description: error.response.data.message,
            variant: "destructive",
          });
        } else if (error instanceof Error) {
          toast({
            title: "Giriş başarısız",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Giriş başarısız",
            description: "Beklenmeyen bir hata oluştu",
            variant: "destructive",
          });
        }
        return false;
      }
    };

    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token && token !== "undefined") {
        setIsAuthenticated(true);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        const result = await login();
        setIsAuthenticated(result);
      }
    };

    checkAuth();
  }, [toast]);

  // -------------------------------
  // 2) Yeni kaynak ekleme (FileUpload, TextEditor vb. komponentlerden gelir)
  // -------------------------------
  const handleAddSource = (newSources: Source[]) => {
    // fileSize varsa onu kullan; yoksa 0
    const formattedSources = newSources.map((source) => ({
      ...source,
      size: source.fileSize || 0,
    }));
    setSources((prev) => [...prev, ...formattedSources]);
    formattedSources.forEach((source) => {
      toast({
        title: "Kaynak eklendi",
        description: `Eklendi: ${source.name} (${formatFileSize(source.size)})`,
      });
    });
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((source) => source.id !== id));
  };

  // -------------------------------
  // 3) "Agent oluştur" + kaynakları backend'e toplu ekleme
  // -------------------------------
  const handleCreateAgent = async () => {
    if (sources.length === 0) {
      toast({
        title: "Kaynak yok",
        description: "En az bir kaynak ekleyin",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);

      // 3.1) Yeni agent yaratalım
      const { data: agent } = await axios.post<{ id: string }>("/agents", {
        name: agentName || "New Agent",
        description:
          agentDescription || `Agent, ${sources.length} kaynaktan oluşuyor`,
      });

      // 3.2) Pending kaynakları türüne göre ilgili endpoint'e gönder
      for (const source of sources) {
        try {
          switch (source.type) {
            case "text":
              await axios.post(`/agents/${agent.id}/sources/text`, {
                title: source.name,
                content: source.content,
              });
              break;
            case "link":
              await axios.post(`/agents/${agent.id}/sources/links`, {
                url: source.url,
                includePaths: source.metadata?.includePaths,
                excludePaths: source.metadata?.excludePaths,
              });
              break;
            case "qa":
              await axios.post(`/agents/${agent.id}/sources/qa`, {
                title: source.name,
                questions: source.metadata?.questions,
              });
              break;
            case "file":
              // File zaten FileUpload aşamasında yüklendi ve bağlandı varsayılıyor
              break;
            case "notion":
              console.warn(
                "Notion kaynağı handleCreateAgent içinde eksik"
              );
              break;
          }
        } catch (error: unknown) {
          console.error(`Kaynak ekleme hatası ${source.name}:`, error);
          if (isAxiosError(error) && error.response?.data?.message) {
            toast({
              title: "Kaynak ekleme hatası",
              description: `Başarısız: ${source.name} – ${error.response.data.message}`,
              variant: "destructive",
            });
          } else if (error instanceof Error) {
            toast({
              title: "Kaynak ekleme hatası",
              description: `Başarısız: ${source.name} – ${error.message}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Kaynak ekleme hatası",
              description: `Başarısız: ${source.name}`,
              variant: "destructive",
            });
          }
        }
      }

      // 3.3) State'i sıfırla, form alanlarını temizle
      setSources([]);
      setAgentName("");
      setAgentDescription("");

      toast({
        title: "Agent başarıyla oluşturuldu",
        description: `${sources.length} kaynakla agent oluşturuldu`,
      });

      // 3.4) Yönlendirme
      router.push(`/agents/${agent.id}`);
    } catch (error: unknown) {
      console.error("Agent oluşturma hatası:", error);
      if (isAxiosError(error) && error.response?.data?.message) {
        toast({
          title: "Agent oluşturma hatası",
          description: error.response.data.message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Agent oluşturma hatası",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Agent oluşturma hatası",
          description: "Agent oluşturma başarısız",
          variant: "destructive",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // -------------------------------
  // 4) Kaynakları tura göre filtrele (her sekmede kullanılıyor)
  // -------------------------------
  const getSourcesByType = (type: SourceType) => {
    return sources.filter((source) => source.type === type);
  };

  // -------------------------------
  // 5) aktif sekmeye göre bileşen render et
  // -------------------------------
  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return (
          <FileUpload
            agentId={sources[0]?.id || "new"}
            onUploadComplete={handleAddSource}
            sources={getSourcesByType("file")}
            onRemoveSource={handleRemoveSource}
            isAuthenticated={isAuthenticated}
            onFilesSelected={(files: File[]) => {
              // Dosyalardan Source[] üret ve handleAddSource'a geçir
              const newSources: Source[] = files.map((file) => ({
                id: Math.random().toString(),
                type: "file",
                name: file.name,
                size: file.size,
                fileSize: file.size,
                isNew: true,
              }));
              handleAddSource(newSources);
            }}
          />
        );
      case "text":
        return (
          <TextEditor
            onAddSource={handleAddSource}
            sources={getSourcesByType("text")}
            onRemoveSource={handleRemoveSource}
          />
        );
      case "website":
        return (
          <WebsiteCrawler
            onAddSource={handleAddSource}
            sources={getSourcesByType("link")}
            onRemoveSource={handleRemoveSource}
          />
        );
      case "qa":
        return (
          <QAEditor
            onAddSource={handleAddSource}
            sources={getSourcesByType("qa")}
            onRemoveSource={handleRemoveSource}
          />
        );
      case "notion":
        return <NotionIntegration onAddSource={handleAddSource} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sol Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Ana İçerik */}
        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-8">Create new agent</h1>
          {renderContent()}
        </main>

        {/* Sağ Sidebar */}
        <SourcesSidebar
          sources={sources}
          totalSize={totalSize}
          maxSize={maxSize}
          onCreateAgent={handleCreateAgent}
          isCreating={isCreating}
        />
      </div>

      {showPurchaseModal && <PurchaseAddon onClose={() => setShowPurchaseModal(false)} />}

      <Toaster />
    </div>
  );
}
