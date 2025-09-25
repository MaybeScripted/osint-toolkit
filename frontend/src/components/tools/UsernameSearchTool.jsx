import React, { useState } from 'react'
import { User, Search, Globe, Eye, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const UsernameSearchTool = () => {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.lookupUsername(username)
      if (response.success) {
        setResults(response.data)
        toast.success('Username search completed!')
      } else {
        throw new Error(response.error?.message || 'Search failed')
      }
    } catch (error) {
      console.error('Username search error:', error)
      toast.error(error.message || 'Failed to search username')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Form */}
      <div className="card mb-8 hover:lift anim-enter">
        <form onSubmit={handleSearch} className="card-content space-y-5">
          <div>
            <label className="block text-base font-medium text-white mb-3">
              Username
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username to search..."
                className="input-field flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
                <span>{isLoading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-8 anim-fade">
          <h3 className="text-2xl font-semibold text-white">Search Results</h3>
          
          {/* Summary */}
          <div className="card hover:lift anim-enter">
            <div className="card-content">
            <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
              <User className="w-6 h-6 text-blue-400" />
              <span>Search Summary</span>
            </h4>
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <span className="text-dark-400 text-base">Username:</span>
                <p className="text-white font-mono">{results.username || username}</p>
              </div>
              <div>
                <span className="text-dark-400 text-base">Found Profiles:</span>
                <p className="text-white font-medium">{results.platforms?.filter(p => p.valid).length || 0}</p>
              </div>
              <div>
                <span className="text-dark-400 text-base">Total Checked:</span>
                <p className="text-white font-medium">{results.platforms?.length || 0}</p>
              </div>
            </div>
            </div>
          </div>

          {/* profiles that it found for <username> */}
          {results.platforms && results.platforms.length > 0 && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                <Globe className="w-6 h-6 text-green-400" />
                <span>Found Profiles ({results.platforms.filter(p => p.valid).length} found)</span>
              </h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.platforms
                  .filter(profile => profile.valid)
                  .map((profile, index) => (
                  <div key={index} className="flex items-center justify-between p-5 bg-dark-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{profile.name}</p>
                        <p className="text-dark-400 text-base">{profile.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(profile.url)
                          toast.success('URL copied to clipboard!')
                        }}
                        className="btn-ghost p-3"
                        title="Copy URL"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost p-3"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          {/* and this is for when there's no results found */}
          {results.platforms && results.platforms.filter(p => p.valid).length === 0 && (
            <div className="card text-center hover:lift anim-enter">
              <div className="card-content">
              <Eye className="w-16 h-16 text-dark-400 mx-auto mb-5" />
              <h4 className="text-xl font-medium text-white mb-3">No profiles found</h4>
              <p className="text-dark-400 text-base">
                No social media profiles were found for this username
              </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !isLoading && (
        <div className="text-center py-16 anim-fade">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <User className="w-10 h-10 text-dark-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-3">No search performed yet</h3>
          <p className="text-dark-400 text-base">
            Enter a username above to start searching across social platforms
          </p>
        </div>
      )}
    </div>
  )
}

export default UsernameSearchTool
