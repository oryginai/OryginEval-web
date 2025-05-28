import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, User } from 'lucide-react'

interface AppLayoutProps {
    children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { user, loading, signOut } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-lg">Loading your workspace...</span>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/auth" replace />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <header className="bg-black/40 border-b border-gray-800 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                                OryginEval
                            </h1>
                            <div className="hidden sm:block w-px h-6 bg-gray-700"></div>
                            <span className="hidden sm:block text-gray-400 text-sm">Evaluation Platform</span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-white text-sm font-medium">
                                    {user.user_metadata?.full_name || user.email}
                                </span>
                            </div>

                            <button
                                onClick={signOut}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all duration-200"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Sign out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-gray-800 min-h-[calc(100vh-12rem)] p-6">
                    {children}
                </div>
            </main>
        </div>
    )
} 