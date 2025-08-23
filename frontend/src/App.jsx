import React from 'react'
import { Toaster } from 'react-hot-toast'
import HomePage from './pages/HomePage'

function App() {
  return (
    <div className="min-h-screen bg-dark-950">
      <main className="container mx-auto px-4 py-8">
        <HomePage />
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #475569',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f8fafc',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f8fafc',
            },
          },
        }}
      />
    </div>
  )
}

export default App
