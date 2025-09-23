import React, { useState, useEffect } from 'react'
import { Home, Mail, User, MapPin, Globe, FileText, Hash, Key, Shield, Database, Clock, Menu, X } from 'lucide-react'

const Layout = ({ children, activeTool, onToolSelect }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationCategories = [
    {
      title: 'Core Tools',
      items: [
        {
          id: 'home',
          name: 'Home',
          icon: Home
        },
        {
          id: 'email-lookup',
          name: 'Email Lookup',
          icon: Mail
        },
        {
          id: 'username-search',
          name: 'Username Search',
          icon: User
        }
      ]
    },
    {
      title: 'Network Intelligence',
      items: [
        {
          id: 'ip-lookup',
          name: 'IP Lookup',
          icon: MapPin
        },
        {
          id: 'domain-lookup',
          name: 'Domain Lookup',
          icon: Globe
        },
        {
          id: 'url-analyzer',
          name: 'URL Analyzer',
          icon: Globe
        }
      ]
    },
    {
      title: 'Digital Forensics',
      items: [
        {
          id: 'document-analysis',
          name: 'Document Analysis',
          icon: FileText
        }
      ]
    },
    {
      title: 'Utilities',
      items: [
        {
          id: 'easy-id',
          name: 'Easy-ID Generator',
          icon: Hash
        },
        {
          id: 'base64-decoder',
          name: 'Base64 Decoder',
          icon: FileText
        }
      ]
    }
  ]

  // random emoji's because my friend says emojis in code is a crime 
  // he is wrong, emojis are great
  // 😀😃😄😁😆😅😂🤣🥲🥹☺️😊😇🙂🙃😉😌

  
  const handleToolClick = (toolId) => {
    onToolSelect(toolId)
    setSidebarOpen(false) // for mobile overlay, closed state thingy
  }

  // disabling body scroll when modal is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Mobile Modal thingy. i like it :) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden">
          <div className="bg-dark-950/70 backdrop-blur-xl rounded-xl border border-dark-600/30 w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Modal Header for the sidebar */}
              <div className="p-8 border-b border-dark-600/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h1 className="text-xl font-bold text-white">Navigation</h1>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-3 text-dark-300 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* modal content stuff for the sidebar */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {navigationCategories.map((category, categoryIndex) => (
                  <div key={category.title}>
                    <h3 className="text-base font-semibold text-dark-300 uppercase tracking-wider mb-3 px-3">
                      {category.title}
                    </h3>
                      <div className="space-y-1">
                        {category.items.map((item) => {
                          const Icon = item.icon
                          const isActive = activeTool === item.id

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleToolClick(item.id)}
                              className={`
                                w-full text-left nav-item rounded-lg px-4 py-3
                                ${isActive ? 'active' : ''}
                              `}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="font-medium truncate">{item.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* desktop sidebar (needs work. reminder for whenever bruh, its looks hella meh) */}
      <div className="hidden lg:block w-64 bg-black/60 backdrop-blur-xl border-r border-dark-600/30 fixed left-0 top-0 h-full z-20">
        <div className="flex flex-col h-full">
          {/* branding */}
          <div className="p-6 border-b border-dark-600/30 flex-shrink-0">
            <h1 className="text-xl font-bold text-white">OSINT-Toolkit</h1>
          </div>

          {/* navi thing */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-6">
                {navigationCategories.map((category, categoryIndex) => (
                  <div key={category.title}>
                    <h3 className="text-base font-semibold text-dark-300 uppercase tracking-wider mb-3 px-3">
                      {category.title}
                    </h3>
                    <div className="space-y-0">
                      {category.items.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTool === item.id
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleToolClick(item.id)}
                            className={`
                              w-full text-left nav-item rounded-lg px-4 py-3
                              ${isActive ? 'active' : ''}
                            `}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium truncate">{item.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 bg-dark-950/70 backdrop-blur-xl border-b border-dark-600/30 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 text-dark-300 hover:text-white transition-colors"
            >
              <Menu className="w-7 h-7" />
            </button>
            <h1 className="text-xl font-semibold text-white">OSINT-Toolkit</h1>
            <div className="w-12" /> {/* literally just aspacer for centering */}
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
