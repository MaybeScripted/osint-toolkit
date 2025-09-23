import React, { useState } from 'react'
import { Mail, Search, User, Shield, Eye, Copy, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const EmailLookupTool = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.lookupEmail(email)
      if (response.success) {
        setResults(response.data)
        toast.success('Email lookup completed!')
      } else {
        throw new Error(response.error?.message || 'Lookup failed')
      }
    } catch (error) {
      console.error('Email lookup error:', error)
      toast.error(error.message || 'Failed to lookup email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search / input area */}
      <div className="card mb-6 hover:lift anim-enter">
        <form onSubmit={handleLookup} className="card-content space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <div className="flex space-x-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address to lookup..."
                className="input-field flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isLoading ? 'Looking up...' : 'Lookup'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6 anim-fade">
          <h3 className="text-xl font-semibold text-white">Lookup Results</h3>
          
          {/* basically a summary / "so this is what was found" */}
          {results.summary && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <span>Summary</span>
              </h4>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <span className="text-dark-400 text-sm">Risk Level:</span>
                  <p className={`font-medium ${
                    results.summary.riskLevel === 'low' ? 'text-green-400' :
                    results.summary.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.summary.riskLevel || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Confidence:</span>
                  <p className="text-white">{Math.round(results.summary.confidence || 0)}%</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Data Points:</span>
                  <p className="text-white">{results.summary.dataPoints || 0}</p>
                </div>
              </div>
              
              {results.summary.keyFindings && results.summary.keyFindings.length > 0 && (
                <div>
                  <h5 className="text-white font-medium mb-2">Key Findings:</h5>
                  <ul className="space-y-1">
                    {results.summary.keyFindings.map((finding, index) => (
                      <li key={index} className="text-dark-300 text-sm">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Hunter.io Verification */}
          {results.hunter && results.hunter.verification && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Email Verification (Hunter.io)</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-dark-400 text-sm">Status:</span>
                  <p className={`font-medium ${
                    results.hunter.verification.data?.status === 'valid' ? 'text-green-400' :
                    results.hunter.verification.data?.status === 'disposable' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.hunter.verification.data?.status || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Result:</span>
                  <p className="text-white">{results.hunter.verification.data?.result || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Score:</span>
                  <p className="text-white">{results.hunter.verification.data?.score || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Disposable:</span>
                  <p className={`font-medium ${results.hunter.verification.data?.disposable ? 'text-yellow-400' : 'text-green-400'}`}>
                    {results.hunter.verification.data?.disposable ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Gravatar Info */}
          {results.gravatar && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-400" />
                <span>Gravatar Profile</span>
              </h4>
              <div className="flex items-center space-x-4">
                {results.gravatar.avatarUrl && (
                  <img
                    src={results.gravatar.avatarUrl}
                    alt="Gravatar"
                    className="w-16 h-16 rounded-full border-2 border-dark-600"
                  />
                )}
                <div>
                  <p className="text-white font-medium">
                    {results.gravatar.hasProfile ? 'Profile Found' : 'No Profile'}
                  </p>
                  <p className="text-dark-400 text-sm">
                    {results.gravatar.hasAvatar ? 'Has Avatar' : 'No Avatar'}
                  </p>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Email Analysis */}
          {results.analysis && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-green-400" />
                <span>Email Analysis</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-dark-400 text-sm">Username:</span>
                  <p className="text-white font-mono">{results.analysis.username || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Domain:</span>
                  <p className="text-white font-mono">{results.analysis.domain || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Risk Level:</span>
                  <p className={`font-medium ${
                    results.analysis.riskAssessment?.level === 'very_low' ? 'text-green-400' :
                    results.analysis.riskAssessment?.level === 'low' ? 'text-green-400' :
                    results.analysis.riskAssessment?.level === 'medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.analysis.riskAssessment?.level || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Risk Score:</span>
                  <p className="text-white">{results.analysis.riskAssessment?.score || 'N/A'}</p>
                </div>
              </div>
              
              {results.analysis.insights && results.analysis.insights.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-white font-medium mb-2">Insights:</h5>
                  <ul className="space-y-1">
                    {results.analysis.insights.map((insight, index) => (
                      <li key={index} className="text-dark-300 text-sm">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Found Entities */}
          {results.entities && results.entities.length > 0 && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>Found Entities</span>
              </h4>
              <div className="space-y-2">
                {results.entities.map((entity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{entity.value}</span>
                      <span className="text-dark-400 text-sm ml-2">({entity.type})</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(entity.value)
                        toast.success('Copied to clipboard!')
                      }}
                      className="btn-ghost"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No lookup performed yet</h3>
          <p className="text-dark-400">
            Enter an email address above to start the lookup process
          </p>
        </div>
      )}
    </div>
  )
}

export default EmailLookupTool
