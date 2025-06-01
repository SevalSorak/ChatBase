'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { MobileSidebar } from '@/components/mobile-sidebar';

interface Source {
  id: string;
  name: string;
  type: string;
  fileSize?: number;
  mimeType?: string;
  url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  metadata?: {
    sources?: string[];
  };
}

interface Agent {
  id: string;
  name: string;
  description: string;
  settings: {
    model: string;
    temperature: number;
    systemPrompt: string;
  };
  sources: Source[];
}

type TabOption = 'chat' | 'sources' | 'settings';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabOption>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1) agent detaylarını çekmek için useEffect içine fetchAgent'ı koyuyoruz ---
  useEffect(() => {
    if (!params.id) {
      setLoading(false);
      return;
    }

    const fetchAgent = async (id: string) => {
      try {
        setLoading(true);
        const response = await axios.get<Agent>(`/agents/${id}`);
        setAgent(response.data);

        // Hoş geldin mesajını ekleyelim
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm ${response.data.name}. How can I help you today?`,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Error fetching agent:', error);
        toast({
          title: 'Error',
          description: 'Failed to load agent details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgent(params.id as string);
  }, [params.id, toast]);

  // --- 2) Mesaj listesini güncelleyince kaydırmak için useEffect ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !agent || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await axios.post<{
        message: Message;
        conversationId: string;
      }>(`/agents/${agent.id}/chat`, {
        message: input,
        conversationId,
      });

      const { message, conversationId: newConversationId } = response.data;
      if (!conversationId) {
        setConversationId(newConversationId);
      }

      setMessages(prev => [
        ...prev,
        {
          ...message,
          createdAt: message.createdAt || new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });

      // Hata durumunda kullanıcıya gösterilecek yanıt
      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <MobileSidebar />
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <MobileSidebar />
          <main className="flex-1 p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Agent not found</h2>
              <Button onClick={() => router.push('/agents')}>Back to Agents</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <MobileSidebar />

        <main className="flex-1 overflow-hidden">
          <div className="border-b p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <Button variant="outline" onClick={() => router.push('/agents')}>
                Back to Agents
              </Button>
            </div>
            {agent.description && (
              <p className="text-muted-foreground mt-1">{agent.description}</p>
            )}
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={(val: string) => setActiveTab(val as TabOption)} 
            className="h-[calc(100vh-120px)]"
          >
            <TabsList className="px-4 pt-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* --- Chat Sekmesi --- */}
            <TabsContent value="chat" className="flex flex-col h-full p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs mt-1 opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>

                      {message.metadata?.sources && message.metadata.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                          <p className="text-xs font-medium">Sources:</p>
                          <ul className="text-xs mt-1">
                            {message.metadata.sources.map((sourceId, index) => (
                              <li key={index} className="truncate">
                                Source {index + 1}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !input.trim()}>
                    Send
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* --- Sources Sekmesi --- */}
            <TabsContent value="sources" className="p-4 overflow-y-auto h-full">
              <Card>
                <CardHeader>
                  <CardTitle>Sources ({agent.sources.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {agent.sources.length > 0 ? (
                    <div className="space-y-2">
                      {agent.sources.map((source) => (
                        <div
                          key={source.id}
                          className="flex justify-between items-center p-3 border rounded-md"
                        >
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {source.type}
                              {source.fileSize && ` • ${formatFileSize(source.fileSize)}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No sources added yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Settings Sekmesi --- */}
            <TabsContent value="settings" className="p-4 overflow-y-auto h-full">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  {agent.settings ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1">Model</h3>
                        <p className="text-muted-foreground">{agent.settings.model}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Temperature</h3>
                        <p className="text-muted-foreground">{agent.settings.temperature}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">System Prompt</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{agent.settings.systemPrompt}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Settings not available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Yardımcı fonksiyon: bayt cinsinden dosya boyutunu insan okunabilir hale çevirir
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
