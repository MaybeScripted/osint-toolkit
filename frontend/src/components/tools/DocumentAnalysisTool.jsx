import React, { useState, useRef } from 'react'
import { FileText, Upload, Download, Copy, RotateCcw, AlertTriangle, CheckCircle, XCircle, Info, Shield, MapPin, Calendar, Settings, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const DocumentAnalysisTool = () => {
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showRawMetadata, setShowRawMetadata] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return

    // check file size (100MB limit)
    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 100MB.')
      return
    }

    setFile(selectedFile)
    setAnalysis(null)
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const analyzeDocument = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.analyzeDocument(formData)

      if (response.success) {
        setAnalysis(response.data)
        toast.success('Document analyzed successfully!')
      } else {
        toast.error(response.error?.message || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error.response?.data?.error?.message || error.message || 'Failed to analyze document')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setAnalysis(null)
    setShowRawMetadata(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleDownload = () => {
    if (!analysis) return

    const dataStr = JSON.stringify(analysis, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-analysis-${file.name}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Analysis downloaded!')
  }

  const getSecurityIcon = (level) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'high':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Info className="w-5 h-5 text-gray-400" />
    }
  }

  const getSecurityColor = (level) => {
    switch (level) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const renderMetadataCategory = (title, data, icon, bgClass = 'bg-dark-700') => {
    if (!data || Object.keys(data).length === 0) return null

    // filtering out text preview fields since they have their own dedicated card
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => 
        !key.includes('text_preview') && !key.includes('text_length')
      )
    )

    if (Object.keys(filteredData).length === 0) return null

    return (
      <div className={`${bgClass} rounded-xl p-5 border`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-dark-800/50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h4 className="text-white font-semibold">{title}</h4>
            <span className="text-dark-400 text-xs">{Object.keys(filteredData).length} fields</span>
          </div>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {Object.entries(filteredData).map(([key, value]) => (
            <div key={key} className="bg-dark-800/30 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <span className="text-dark-300 text-xs font-mono uppercase tracking-wide">{key}</span>
                <span className="text-white text-sm text-right max-w-xs break-words ml-3">{String(value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          <span className="text-gradient">Document</span> Analysis
        </h2>
        <p className="text-dark-300">
          Extract metadata and analyze files for OSINT purposes
        </p>
      </div>

      {/* file upload section */}
      <div className="card mb-6">
        <div className="card-content space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Select Document to Analyze
            </label>
            
            {/* the drag and drop area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500/70 bg-primary-500/10'
                  : 'border-dark-600/60 hover:border-dark-500'
              } bg-dark-800/50 backdrop-blur-sm`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.html,.xml,.json,.rtf,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.avi,.mov,.wmv,.flv,.webm,.zip,.rar,.7z,.gz,.tar"
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-primary-500 mx-auto" />
                  <div className="text-white font-medium">{file.name}</div>
                  <div className="text-dark-400 text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-dark-400 mx-auto" />
                  <div className="text-white font-medium">Drop file here or click to browse</div>
                  <div className="text-dark-400 text-sm">
                    Supports images, documents, audio, video, and archives
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={analyzeDocument}
              disabled={!file || loading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Analyze Document</span>
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* analysis results stuff the whole thing is in here */}
      {analysis && (
        <div className="space-y-6">
          {/* file overview card */}
          <div className="card">
            <div className="card-content">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{analysis.filename}</h3>
                  <p className="text-dark-300 text-sm">{analysis.sizeFormatted} • {analysis.mimeType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  analysis.category === 'image' ? 'bg-blue-500/20 text-blue-400' :
                  analysis.category === 'document' ? 'bg-green-500/20 text-green-400' :
                  analysis.category === 'video' ? 'bg-purple-500/20 text-purple-400' :
                  analysis.category === 'audio' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {analysis.category.toUpperCase()}
                </span>
                {analysis.isSupported ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    ✓ Supported
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                    ⚠ Limited
                  </span>
                )}
              </div>
            </div>
            
            {/* quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{analysis.analysis?.metadataCount || 0}</div>
                <div className="text-dark-400 text-sm">Metadata Fields</div>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">
                  {Object.keys(analysis.analysis?.categories || {}).filter(cat => 
                    analysis.analysis.categories[cat] && Object.keys(analysis.analysis.categories[cat]).length > 0
                  ).length}
                </div>
                <div className="text-dark-400 text-sm">Categories</div>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">
                  {analysis.analysis?.insights?.length || 0}
                </div>
                <div className="text-dark-400 text-sm">Insights</div>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3">
                <div className={`text-2xl font-bold ${
                  analysis.analysis?.security?.level === 'low' ? 'text-green-400' :
                  analysis.analysis?.security?.level === 'medium' ? 'text-yellow-400' :
                  analysis.analysis?.security?.level === 'high' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {analysis.analysis?.security?.level?.toUpperCase() || 'N/A'}
                </div>
                <div className="text-dark-400 text-sm">Risk Level</div>
              </div>
            </div>
            </div>
          </div>


          {/* warnings only area, to show any warnings */}
          {analysis.analysis?.warnings && analysis.analysis.warnings.length > 0 && (
            <div className="card">
              <div className="card-content bg-yellow-500/5 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                </div>
                <span>Important Warnings</span>
              </h3>
              <div className="space-y-3">
                {analysis.analysis.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-dark-800/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-100 text-sm">{warning}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          {/* text preview card, to show a max of 200 characters of text content */}
          {analysis.metadata?.text_preview && (
            <div className="card">
              <div className="card-content bg-indigo-500/5 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <span>Text Content Preview</span>
              </h3>
              <div className="bg-dark-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-dark-300 text-sm">First 200 characters of text content:</span>
                  <span className="text-indigo-400 text-xs font-mono">
                    {analysis.metadata.text_length} chars total
                  </span>
                </div>
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
                  <pre className="text-white text-sm whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {analysis.metadata.text_preview}
                  </pre>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* metadata categories. there's alot, cba to list them all */}
          {analysis.metadata && Object.keys(analysis.metadata).length > 0 && (
            <div className="card">
              <div className="card-content">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Extracted Metadata</h3>
                    <p className="text-dark-300 text-sm">{Object.keys(analysis.metadata).length} fields across {Object.keys(analysis.analysis?.categories || {}).filter(cat => 
                      analysis.analysis.categories[cat] && Object.keys(analysis.analysis.categories[cat]).length > 0
                    ).length} categories</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRawMetadata(!showRawMetadata)}
                  className="btn-ghost px-4 py-2"
                >
                  {showRawMetadata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showRawMetadata ? 'Hide Raw' : 'Show Raw'}</span>
                </button>
              </div>

              {showRawMetadata ? (
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
                  <pre className="text-white text-sm whitespace-pre-wrap break-words font-mono max-h-96 overflow-y-auto">
                    {JSON.stringify(analysis.metadata, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {renderMetadataCategory('Basic Information', analysis.analysis?.categories?.basic, <FileText className="w-5 h-5 text-blue-400" />, 'bg-blue-500/10 border-blue-500/20')}
                  {renderMetadataCategory('Technical Details', analysis.analysis?.categories?.technical, <Settings className="w-5 h-5 text-green-400" />, 'bg-green-500/10 border-green-500/20')}
                  {renderMetadataCategory('Creation Info', analysis.analysis?.categories?.creation, <Calendar className="w-5 h-5 text-purple-400" />, 'bg-purple-500/10 border-purple-500/20')}
                  {renderMetadataCategory('Location Data', analysis.analysis?.categories?.location, <MapPin className="w-5 h-5 text-red-400" />, 'bg-red-500/10 border-red-500/20')}
                  {renderMetadataCategory('Software Info', analysis.analysis?.categories?.software, <Settings className="w-5 h-5 text-yellow-400" />, 'bg-yellow-500/10 border-yellow-500/20')}
                  {renderMetadataCategory('Security Info', analysis.analysis?.categories?.security, <Shield className="w-5 h-5 text-orange-400" />, 'bg-orange-500/10 border-orange-500/20')}
                  {renderMetadataCategory('Other', analysis.analysis?.categories?.other, <Info className="w-5 h-5 text-gray-400" />, 'bg-gray-500/10 border-gray-500/20')}
                </div>
              )}
              </div>
            </div>
          )}

          {/* action buttons like copy and download */}
          <div className="card">
            <div className="card-content flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Export Analysis</h3>
                <p className="text-dark-300 text-sm">Save or share the complete analysis results</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleCopy(JSON.stringify(analysis, null, 2))}
                  className="btn-primary px-6 py-3 flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Analysis</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-secondary px-6 py-3 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* empty state aka no file selected */}
      {!analysis && !file && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No document selected</h3>
          <p className="text-dark-400">
            Upload a file to extract metadata and analyze it for OSINT purposes
          </p>
        </div>
      )}
    </div>
  )
}

export default DocumentAnalysisTool
