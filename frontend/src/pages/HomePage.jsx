import React, { useState } from 'react'
import { Search, Zap, Target, Network, Mail, User, Phone, Globe, MapPin, Shield, Image, FileText, Wifi, Key, Eye, Fingerprint, Database, Clock, Hash, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QuickLookup from '../components/QuickLookup'
import EasyIdGenerator from '../components/EasyIdGenerator'

const HomePage = () => {
  const [activeTool, setActiveTool] = useState(null)

  const handleToolClick = (toolName) => {
    if (toolName === 'Easy-ID Generator') {
      setActiveTool('easy-id')
    }
    // Add more tool handlers here as needed
  }

  // Tool categories for the OSINT toolkit
  const toolCategories = [
    {
      title: 'Email Intelligence',
      icon: Mail,
      color: 'bg-blue-600/10 border-blue-500/20 text-blue-400',
      tools: [
        { name: 'Email Lookup', description: 'Verify emails, Gravatar profiles & social intel', icon: Mail, status: 'active' },
        { name: 'Email Validator', description: 'Verify email deliverability with Hunter.io', icon: Shield, status: 'active' },
        { name: 'Person Finder', description: 'Find person details from email address', icon: User, status: 'active' },
        { name: 'Email Finder', description: 'Find email addresses for people at companies', icon: Search, status: 'active' },
      ]
    },
    {
      title: 'Social Media',
      icon: User,
      color: 'bg-purple-600/10 border-purple-500/20 text-purple-400',
      tools: [
        { name: 'Username Search', description: 'Find profiles across 400+ platforms', icon: User, status: 'active' },
        { name: 'Profile Analyzer', description: 'Extract metadata from social profiles', icon: Eye, status: 'coming-Planned' },
        { name: 'Social Graph', description: 'Map connections between accounts', icon: Network, status: 'coming-Planned' },
      ]
    },
    {
      title: 'Network Intelligence',
      icon: Globe,
      color: 'bg-green-600/10 border-green-500/20 text-green-400',
      tools: [
        { name: 'IP Lookup', description: 'Geolocation, ISP & reputation data', icon: MapPin, status: 'active' },
        { name: 'Domain Lookup', description: 'DNS records, WHOIS data & SSL certificates', icon: Globe, status: 'active' },
        { name: 'Company Finder', description: 'Find company details from domain', icon: Database, status: 'active' },
        { name: 'Port Scanner', description: 'Discover open ports & services', icon: Wifi, status: 'coming-Planned' },
      ]
    },
    {
      title: 'Identity Research',
      icon: Fingerprint,
      color: 'bg-orange-600/10 border-orange-500/20 text-orange-400',
      tools: [
        { name: 'Phone Lookup', description: 'Carrier, region & format validation', icon: Phone, status: 'coming-Planned' },
        { name: 'Reverse Image', description: 'Find sources of images online', icon: Image, status: 'coming-Planned' },
        { name: 'Document Analysis', description: 'Extract metadata from files', icon: FileText, status: 'coming-Planned' },
      ]
    },
    {
      title: 'Crypto & Security',
      icon: Key,
      color: 'bg-red-600/10 border-red-500/20 text-red-400',
      tools: [
        { name: 'Hash Lookup', description: 'MD5, SHA1, SHA256 cracking', icon: Key, status: 'coming-Planned' },
        { name: 'Bitcoin Tracker', description: 'Trace cryptocurrency transactions', icon: Database, status: 'coming-Planned' },
        { name: 'Breach Monitor', description: 'Check for data breaches', icon: Shield, status: 'coming-Planned' },
      ]
    },
    {
      title: 'Utility Tools',
      icon: Target,
      color: 'bg-gray-600/10 border-gray-500/20 text-gray-400',
      tools: [
        { name: 'Easy-ID Generator', description: 'Generate fake data for testing and forms', icon: Hash, status: 'active' },
        { name: 'Base64 Decoder', description: 'Encode/decode Base64 strings', icon: FileText, status: 'coming-Planned' },
        { name: 'URL Analyzer', description: 'Decode and analyze URLs', icon: Globe, status: 'coming-Planned' },
        { name: 'Timestamp Converter', description: 'Convert between time formats', icon: Clock, status: 'coming-Planned' },
      ]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      > 
      <h1 className="text-5xl font-bold mb-4">
        <span className="text-gradient glow-text">OSINT</span> made{' '}
        <span className="text-white">easy</span>
      </h1>
      
      <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto leading-relaxed">
        a bunch of OSINT toys in one spot. 
      </p>
        
        <div className="flex items-center justify-center space-x-8 text-sm text-dark-400">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-primary-400" />
            <span>Multi-Source Intel</span>
          </div>
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-primary-400" />
            <span>Easy to use</span>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-primary-400" />
            <span>Free</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Lookup Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-16"
      >
        <QuickLookup />
      </motion.div>

      {/* Tool Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-8"
      >
        {/* the tools, current and fucking planned */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + categoryIndex * 0.1 }}
              className="card"
            >
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                </div>
              </div>
              
              <div className="card-content">
                <div className="space-y-3">
                  {category.tools.map((tool, toolIndex) => (
                    <div
                      key={tool.name}
                      onClick={() => tool.status === 'active' && handleToolClick(tool.name)}
                      className={`w-full p-3 rounded-lg border border-dark-600 bg-dark-800/30 ${
                        tool.status === 'active' 
                          ? 'cursor-pointer hover:border-dark-500 hover:bg-dark-800/50 transition-colors' 
                          : 'cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <tool.icon className="w-4 h-4 text-dark-400 mt-0.5" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white text-sm">{tool.name}</span>
                              {tool.status === 'active' && (
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-xs text-dark-400 mt-1">{tool.description}</p>
                          </div>
                        </div>
                        
                        {tool.status === 'coming-Planned' && (
                          <span className="text-xs text-orange-400 px-2 py-1 bg-orange-400/10 rounded-full">
                            Planned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tool Modals */}
      <AnimatePresence>
        {activeTool === 'easy-id' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setActiveTool(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-900 border border-dark-600 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-dark-600">
                <h2 className="text-xl font-semibold text-white">Easy-ID Generator</h2>
                <button
                  onClick={() => setActiveTool(null)}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <EasyIdGenerator />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
