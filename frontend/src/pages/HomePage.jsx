import { Search, Target, Network, Mail, User, Phone, Globe, MapPin, Shield, Image, FileText, Wifi, Key, Fingerprint, Database, Clock, Hash, Cloud, Thermometer } from 'lucide-react'
import { motion } from 'framer-motion'

const HomePage = ({ onToolSelect }) => {
  // Map tool names to their corresponding IDs
  const getToolId = (toolName) => {
    const toolMap = {
      'Email Lookup': 'email-lookup',
      'Username Search': 'username-search',
      'IP Lookup': 'ip-lookup',
      'Domain Lookup': 'domain-lookup',
      'URL Analyzer': 'url-analyzer',
      'Document Analysis': 'document-analysis',
      'Easy-ID Generator': 'easy-id',
      'Base64 Decoder': 'base64-decoder'
    }
    return toolMap[toolName] || null
  }

  const handleToolClick = (toolName) => {
    const toolId = getToolId(toolName)
    if (toolId && onToolSelect) {
      onToolSelect(toolId)
    }
  }

  // Tool categories for the OSINT toolkit
  const toolCategories = [
    {
      title: 'People & Social Intelligence',
      icon: User,
      color: 'bg-secondary-500/10 border-secondary-500/20 text-secondary-500',
      tools: [
        { name: 'Email Lookup', description: 'Verify emails, Gravatar profiles & social intel', icon: Mail, status: 'active' },
        { name: 'Username Search', description: 'Find profiles across 400+ platforms', icon: User, status: 'active' },
        { name: 'Phone Number Analysis', description: 'Carrier, location, social profiles via PhoneInfoga', icon: Phone, status: 'planned' },
        { name: 'Social Media Aggregator', description: 'Aggregate profiles across platforms', icon: Network, status: 'planned' },
        { name: 'Breach Monitor', description: 'Check for data breaches via HIBP', icon: Shield, status: 'planned' },
      ]
    },
    {
      title: 'Network & Infrastructure',
      icon: Globe,
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
      tools: [
        { name: 'IP Lookup', description: 'Geolocation, ISP & reputation data', icon: MapPin, status: 'active' },
        { name: 'Domain Lookup', description: 'DNS records, WHOIS data & SSL certificates', icon: Globe, status: 'active' },
        { name: 'URL Analyzer', description: 'Decode and analyze URLs', icon: Globe, status: 'active' },
        { name: 'Network Intelligence', description: 'Network reconnaissance via Shodan', icon: Wifi, status: 'planned' },
      ]
    },
    {
      title: 'Digital Forensics',
      icon: Fingerprint,
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
      tools: [
        { name: 'Document Analysis', description: 'Extract metadata from files', icon: FileText, status: 'active' },
        { name: 'Reverse Image Search', description: 'Find sources of images online', icon: Image, status: 'planned' },
        { name: 'EXIF Analyzer', description: 'Image metadata extraction via ExifTool', icon: FileText, status: 'planned' },
        { name: 'File Hash Analyzer', description: 'Hash generation & malware analysis', icon: Key, status: 'planned' },
      ]
    },
    {
      title: 'Crypto & Security',
      icon: Key,
      color: 'bg-red-500/10 border-red-500/20 text-red-500',
      tools: [
        { name: 'Crypto Intelligence', description: 'Multi-coin transaction tracking', icon: Database, status: 'planned' },
        { name: 'IOC Lookup', description: 'Check indicators of compromise', icon: Shield, status: 'planned' },
      ]
    },
    {
      title: 'Geospatial Intelligence',
      icon: MapPin,
      color: 'bg-green-500/10 border-green-500/20 text-green-500',
      tools: [
        { name: 'Location Intelligence', description: 'Coordinates, maps, geocoding', icon: MapPin, status: 'planned' },
        { name: 'Weather Intelligence', description: 'Historical weather analysis', icon: Thermometer, status: 'planned' },
      ]
    },
    {
      title: 'Utilities',
      icon: Target,
      color: 'bg-dark-300/10 border-dark-300/20 text-dark-300',
      tools: [
        { name: 'Easy-ID Generator', description: 'Generate fake data for testing and forms', icon: Hash, status: 'active' },
        { name: 'Base64 Decoder', description: 'Encode/decode Base64 strings', icon: FileText, status: 'active' },
      ]
    }
  ]

  return (
    <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-6 sm:mb-8 lg:mb-10"
      > 
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-3 sm:mb-4">
          <span className="text-gradient">OSINT</span> made{' '}
          <span className="text-white">easy</span>
        </h1>
        
        <p className="text-base sm:text-lg lg:text-xl text-dark-100 max-w-2xl mx-auto leading-relaxed">
          A lot of OSINT tools in one place. 
        </p>
      </motion.div>

      {/* Tool Categories */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {toolCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 + categoryIndex * 0.15 }}
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
                <div className="space-y-2">
                  {category.tools.map((tool, toolIndex) => (
                    <motion.div
                      key={tool.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 + categoryIndex * 0.15 + toolIndex * 0.1 }}
                      onClick={() => tool.status === 'active' && handleToolClick(tool.name)}
                      className={`w-full p-3 rounded-lg border border-dark-600 bg-dark-700/50 ${
                        tool.status === 'active'
                          ? 'hover:border-primary-400 hover:bg-dark-700 transition-colors cursor-pointer'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <tool.icon className="w-4 h-4 text-dark-300 mt-0.5" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white text-sm">{tool.name}</span>
                              {tool.status === 'active' && (
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-xs text-dark-300 mt-0.5">{tool.description}</p>
                          </div>
                        </div>
                        
                        {tool.status === 'planned' && (
                          <span className="text-xs text-orange-400 px-2 py-0.5 bg-orange-400/10 rounded-full">
                            Planned
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default HomePage
