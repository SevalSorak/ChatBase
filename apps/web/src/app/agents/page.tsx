"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { useToast } from "@/hooks/use-toast"
import { Source } from '@/app/agents/create/page'

interface Agent {
  id: string
  name: string
  description: string
  createdAt: string
  sources: Source[]
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"files" | "text" | "website" | "qa" | "notion">("files")

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/agents')
      setAgents(response.data.agents || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleCreateAgent = () => {
    router.push('/agents/create')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Your AI Agents</h1>
            <Button onClick={handleCreateAgent}>Create New Agent</Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-16 h-16 border-4 border-t-primary border-opacity-50 rounded-full animate-spin"></div>
            </div>
          ) : agents.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AI agent to get started
                  </p>
                  <Button onClick={handleCreateAgent}>Create New Agent</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{agent.name}</CardTitle>
                      <CardDescription>
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {agent.description || 'No description'}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="text-sm text-muted-foreground">
                        {agent.sources?.length || 0} sources
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}