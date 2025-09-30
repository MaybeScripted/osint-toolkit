import { useState, useEffect } from 'react'
import { Home, Mail, User, MapPin, Globe, FileText, Hash, Shield, Menu, X } from 'lucide-react'

const Layout = ({ children, activeTool, onToolSelect }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationCategories = [
    {
      title: 'Core Tools',
      items: [
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
                <div>
                  <button
                    onClick={() => handleToolClick('home')}
                    className={`
                      w-full text-left nav-item rounded-xl px-4 py-3 group
                      ${activeTool === 'home' ? 'active' : ''}
                    `}
                  >
                    <Home className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium truncate">Home</span>
                  </button>
                </div>
                  {navigationCategories.map((category) => (
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
                                w-full text-left nav-item rounded-xl px-4 py-3 group
                                ${isActive ? 'active' : ''}
                              `}
                            >
                              <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
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

      {/* desktop sidebar bruh */}
      <div className="hidden lg:block w-72 bg-dark-950/90 backdrop-blur-xl border-r border-dark-600/30 fixed left-0 top-0 h-full z-30 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* branding */}
          <div className="p-5 border-b border-dark-600/30 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary-400/20 border border-primary-400/30 grid place-items-center shadow-inner">
                <Shield className="w-5 h-5 text-primary-300" />
              </div>
                <div className="leading-tight">
                  <div className="text-base text-dark-300">OSINT Toolkit</div>
                </div>
            </div>
          </div>

          {/* navi thing */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-5">
                <div>
                  <button
                    onClick={() => handleToolClick('home')}
                    className={`
                      w-full text-left nav-item rounded-lg px-4 py-3 group
                      ${activeTool === 'home' ? 'active' : ''}
                    `}
                  >
                    <Home className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-semibold truncate text-base">Home</span>
                  </button>
                </div>
                {navigationCategories.map((category) => (
                  <div key={category.title}>
                    <h3 className="text-xs font-semibold text-dark-300/80 uppercase tracking-widest mb-2.5 px-3">
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
                              w-full text-left nav-item rounded-lg px-4 py-3 group
                              ${isActive ? 'active' : ''}
                            `}
                          >
                            <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                            <span className="font-semibold truncate text-base">{item.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </nav>
          {/* footer here, yup */}
          <div className="mt-auto p-4 border-t border-dark-600/30 text-xs text-dark-400">
            <div className="flex items-center justify-between">
              <span>v2.0</span>
              <span className="text-dark-500">© {new Date().getFullYear()} MaybeScripted</span>
            </div>
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        <header className="sticky top-0 z-30 bg-dark-950/70 backdrop-blur-xl border-b border-dark-600/30 px-4 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-dark-300 hover:text-white transition-colors rounded-lg hover:bg-dark-800/50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-white truncate">OSINT Toolkit</h1>
            <div className="w-10" /> {/* spacer for centering, that literall all that this is lol*/}
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
