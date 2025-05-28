import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

// Pages
import Auth from '@/pages/Auth'
import Projects from '@/pages/Projects'
import { AppLayout } from '@/components/AppLayout'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public route */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes */}
          <Route path="/projects" element={
            <AppLayout>
              <Projects />
            </AppLayout>
          } />

          {/* Redirect root to projects */}
          <Route path="/" element={<Navigate to="/projects" replace />} />

          {/* Catch all - redirect to projects */}
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>

        <Toaster />
      </div>
    </Router>
  )
}

export default App
