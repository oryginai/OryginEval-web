import React, { useState, useEffect } from 'react'
import { Plus, Folder, Calendar, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/sonner'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await api.getProjects()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    try {
      const projectData = {
        name: `Project ${projects.length + 1}`,
        description: 'A new evaluation project'
      }

      const newProject = await api.createProject(projectData)
      setProjects([...projects, newProject])
      toast.success('Project created successfully')
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-lg">Loading projects...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Your Projects</h1>
          <p className="text-gray-400 text-lg">
            Manage and evaluate your LLM models with precision
          </p>
        </div>
        <Button
          onClick={createProject}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="bg-gray-900/50 border border-gray-700 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Ready to start evaluating?</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create your first project and begin comprehensive LLM evaluation with our advanced tools.
            </p>
            <Button
              onClick={createProject}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group bg-gray-900/50 border border-gray-700 hover:border-red-500/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 cursor-pointer transform hover:-translate-y-1"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                    <Folder className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <CardTitle className="text-xl text-white group-hover:text-red-300 transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    {project.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Section */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-red-400">{projects.length}</div>
            <div className="text-gray-400 text-sm">Total Projects</div>
          </div>
          <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-gray-400 text-sm">Active Evaluations</div>
          </div>
          <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-gray-400 text-sm">Completed Tests</div>
          </div>
        </div>
      )}
    </div>
  )
}
