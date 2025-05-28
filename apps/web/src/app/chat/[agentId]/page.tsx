'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';

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
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.agentId) {
      fetchAgent(params.agentId as string);
    }
  }, [params.agentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAgent = async (id: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/agents/${id}`);
      setAgent(response.data);
      
      // Add welcome message
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
      const response = await axios.post(`/api/agents/${agent.id}/chat`, {
        message: input,
        conversationId,
      });
      
      const { message, conversationId: newConversationId } = response.data;
      
      // Set conversation ID if this is the first message
      if (!conversationId) {
        setConversationId(newConversationId);
      }
      
      setMessages(prev => [...prev, {
        ...message,
        createdAt: message.createdAt || new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      
      // Add error message
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Agent not found</h2>
            <Button onClick={() => router.push('/agents')}>
              Back to Agents
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <Button variant="outline" onClick={() => router.push('/agents')}>
              Back to Agents
            </Button>
          </div>
          {agent.description && (
            <p className="text-muted-foreground text-sm mt-1">{agent.description}</p>
          )}
        </div>
        
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
      </main>
    </div>
  );
}