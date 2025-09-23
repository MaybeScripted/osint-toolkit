import React from 'react'
import { Target, Mail, User, MapPin, Globe, FileText, Hash } from 'lucide-react'
import EmailLookupTool from './tools/EmailLookupTool'
import UsernameSearchTool from './tools/UsernameSearchTool'
import IpLookupTool from './tools/IpLookupTool'
import DomainLookupTool from './tools/DomainLookupTool'
import UrlAnalyzerTool from './tools/UrlAnalyzerTool'
import Base64DecoderTool from './tools/Base64DecoderTool'
import DocumentAnalysisTool from './tools/DocumentAnalysisTool'
import EasyIdGenerator from './tools/EasyIdGenerator'

const ToolWrapper = ({ toolId }) => {
  const getToolIcon = (toolKey) => {
    const iconMap = {
      'email-lookup': Mail,
      'username-search': User,
      'ip-lookup': MapPin,
      'easy-id': Hash,
      'domain-lookup': Globe,
      'document-analysis': FileText,
      'base64-decoder': FileText,
      'url-analyzer': Globe,
    }
    return iconMap[toolKey] || Target
  }

  const getToolTitle = (toolKey) => {
    return toolKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
      case 'url-analyzer':
        return <UrlAnalyzerTool />
      case 'base64-decoder':
        return <Base64DecoderTool />
      case 'document-analysis':
        return <DocumentAnalysisTool />
      case 'easy-id':
        return <EasyIdGenerator />
      default:
        return (
          <div className="max-w-4xl mx-auto text-center py-16">
            <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-dark-300" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tool Not Found</h3>
            <p className="text-dark-300">
              This tool is not available yet.
            </p>
          </div>
        )
    }
  }

  const Icon = getToolIcon(toolId)
  const title = getToolTitle(toolId)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tool Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary-400 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-dark-300">Select a tool from the sidebar to start your investigation</p>
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <div className="card">
        <div className="card-content">
          {renderToolComponent(toolId)}
        </div>
      </div>
    </div>
  )
}

export default ToolWrapper
