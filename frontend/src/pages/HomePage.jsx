import React, { useState } from 'react'
import { Search, Zap, Target, Network, Mail, User, Phone, Globe, MapPin, Shield, Image, FileText, Wifi, Key, Eye, Fingerprint, Database, Clock, Hash, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QuickLookup from '../components/QuickLookup'
import EasyIdGenerator from '../components/EasyIdGenerator'
import ToolModal from '../components/ToolModal'
import EmailLookupTool from '../components/tools/EmailLookupTool'
import UsernameSearchTool from '../components/tools/UsernameSearchTool'
import IpLookupTool from '../components/tools/IpLookupTool'
import DomainLookupTool from '../components/tools/DomainLookupTool'

const HomePage = () => {
  const [activeTool, setActiveTool] = useState(null)

  const handleToolClick = (toolName) => {
    // Map tool names to their corresponding modal keys
    const toolMap = {
      'Email Lookup': 'email-lookup',
      'Person Finder': 'person-finder',
      'Username Search': 'username-search',
      'Social Graph': 'social-graph',
      'IP Lookup': 'ip-lookup',
      'Domain Lookup': 'domain-lookup',
      'Company Finder': 'company-finder',
      'Port Scanner': 'port-scanner',
      'Phone Lookup': 'phone-lookup',
      'Reverse Image': 'reverse-image',
      'Document Analysis': 'document-analysis',
      'Hash Lookup': 'hash-lookup',
      'Bitcoin Tracker': 'bitcoin-tracker',
      'Breach Monitor': 'breach-monitor',
      'Easy-ID Generator': 'easy-id',
      'Base64 Decoder': 'base64-decoder',
      'URL Analyzer': 'url-analyzer',
      'Timestamp Converter': 'timestamp-converter'
    }

    const toolKey = toolMap[toolName]
    if (toolKey) {
      setActiveTool(toolKey)
    }
  }

  const renderToolComponent = (toolKey) => {
    switch (toolKey) {
      case 'email-lookup':
        return <EmailLookupTool />
      case 'username-search':
        return <UsernameSearchTool />
      case 'ip-lookup':
        return <IpLookupTool />
      case 'domain-lookup':
        return <DomainLookupTool />
      case 'easy-id':
        return <EasyIdGenerator />
      default:
        return (
          <div className="max-w-4xl mx-auto text-center py-16">
            <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tool Not Found</h3>
            <p className="text-dark-400">
              This tool is not available yet.
            </p>
          </div>
        )
    }
  }

  const getToolIcon = (toolKey) => {
    const iconMap = {
      'email-lookup': Mail,
      'username-search': User,
      'ip-lookup': MapPin,
      'easy-id': Hash,
      'domain-lookup': Globe,
      'phone-lookup': Phone,
      'reverse-image': Image,
      'document-analysis': FileText,
      'hash-lookup': Key,
      'bitcoin-tracker': Database,
      'breach-monitor': Shield,
      'base64-decoder': FileText,
      'url-analyzer': Globe,
      'timestamp-converter': Clock
    }
    return iconMap[toolKey] || Target
  }

  const getToolTitle = (toolKey) => {
    return toolKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Tool categories for the OSINT toolkit
  const toolCategories = [
    {
      title: 'Email Intelligence',
      icon: Mail,
      color: 'bg-blue-600/10 border-blue-500/20 text-blue-400',
      tools: [
        { name: 'Email Lookup', description: 'Verify emails, Gravatar profiles & social intel', icon: Mail, status: 'active' },
        { name: 'Person Finder', description: 'Find person details from email address', icon: User, status: 'coming-Planned' },
      ]
    },
    {
      title: 'Social Media',
      icon: User,
      color: 'bg-purple-600/10 border-purple-500/20 text-purple-400',
      tools: [
        { name: 'Username Search', description: 'Find profiles across 400+ platforms', icon: User, status: 'active' },
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
        { name: 'Company Finder', description: 'Find company details from domain', icon: Database, status: 'coming-Planned' },
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
      <ToolModal
        isOpen={!!activeTool}
        onClose={() => setActiveTool(null)}
        title={activeTool ? getToolTitle(activeTool) : ''}
        icon={activeTool ? getToolIcon(activeTool) : Target}
        maxWidth={activeTool === 'easy-id' ? 'max-w-6xl' : 'max-w-4xl'}
      >
        {activeTool && renderToolComponent(activeTool)}
      </ToolModal>
    </div>
  )
}

export default HomePage
