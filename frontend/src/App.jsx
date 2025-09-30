import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ToolWrapper from './components/ToolWrapper'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const [activeTool, setActiveTool] = useState('home')

  const handleToolSelect = (toolId) => {
    setActiveTool(toolId)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-900">
        <Layout activeTool={activeTool} onToolSelect={handleToolSelect}>
          <div className="p-6">
            {activeTool === 'home' ? (
              <HomePage onToolSelect={handleToolSelect} />
            ) : (
              <ToolWrapper toolId={activeTool} />
            )}
          </div>
        </Layout>

        <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #333333',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      </div>
    </ErrorBoundary>
  )
}

export default App
