import { useState, useRef, useEffect } from 'react'
import { User, Search, Globe, Eye, ExternalLink, X, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

// reusable components to avoid code duplication lmfao
const ProfileCard = ({ profile, username }) => (
  <div className="group bg-zinc-900 rounded-xl border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 anim-enter">
    <div className="bg-zinc-800 rounded-t-xl px-4 py-3">
      <h3 className="text-white font-semibold text-lg text-center truncate" title={profile.name}>
        {profile.name}
      </h3>
    </div>
    <div className="p-4 space-y-3">
      <div className="text-zinc-300 text-sm">
        <span className="font-medium">Username:</span> {username}
      </div>
      <div className="text-zinc-300 text-sm">
        <span className="font-medium">URL:</span>
        <div className="mt-1 text-xs font-mono bg-zinc-800/50 rounded p-2 break-all leading-relaxed">
          {profile.url}
        </div>
      </div>
      <div className="pt-2">
        <a
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Visit</span>
        </a>
      </div>
    </div>
  </div>
)

const QuickStats = ({ username, foundCount, isStreaming }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-zinc-300" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm font-medium">Username</p>
          <p className="text-white font-mono text-lg font-semibold">{username}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm font-medium">Found Profiles</p>
          <p className="text-white text-2xl font-bold">{foundCount}</p>
        </div>
      </div>
    </div>
  </div>
)

const ResultsGrid = ({ profiles, username }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {profiles.map((profile, index) => (
      <ProfileCard key={`${profile.name}-${index}`} profile={profile} username={username} />
    ))}
  </div>
)

const UsernameSearchTool = () => {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [streamingResults, setStreamingResults] = useState([])
  const [totalChecked, setTotalChecked] = useState(0)
  const [foundCount, setFoundCount] = useState(0)
  const [isStreaming, setIsStreaming] = useState(false)
  const eventSourceRef = useRef(null)

  // clean up crew cleaning up the event source
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    // reset the state. yeah.
    setResults(null)
    setStreamingResults([])
    setTotalChecked(0)
    setFoundCount(0)
    setIsStreaming(true)
    setIsLoading(true)

    // for any existing connection, we yell at it and tell it to go away
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      eventSourceRef.current = api.lookupUsernameStream(
        username,
        // onResult callback
        (result) => {
          setTotalChecked(result.totalChecked)
          setFoundCount(result.foundCount)
          
          if (result.platform) {
            setStreamingResults(prev => {
              // check if platform already exists to avoid duplicates
              const exists = prev.some(p => p.name === result.platform.name)
              if (!exists) {
                return [...prev, result.platform]
              }
              return prev
            })
          }
        },
        // onError callback
        (error) => {
          console.error('Streaming error:', error)
          toast.error(error.message || 'Search failed')
          setIsStreaming(false)
          setIsLoading(false)
        },
        // onComplete callback
        (finalResult) => {
          setResults(finalResult)
          setStreamingResults(finalResult.platforms || [])
          setTotalChecked(finalResult.totalChecked || 0)
          setFoundCount(finalResult.platforms?.filter(p => p.valid).length || 0)
          setIsStreaming(false)
          setIsLoading(false)
          toast.success('Username search completed!')
        }
      )
    } catch (error) {
      console.error('Username search error:', error)
      toast.error(error.message || 'Failed to start search')
      setIsStreaming(false)
      setIsLoading(false)
    }
  }

  const handleStopSearch = async () => {
    try {
      // Call the backend to stop the process
      await api.stopUsernameSearch(username)
      
      // Close the frontend connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      setIsStreaming(false)
      setIsLoading(false)
      toast.info('Search stopped')
    } catch (error) {
      console.error('Error stopping search:', error)
      // Still close the frontend connection even if backend call fails
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsStreaming(false)
      setIsLoading(false)
      toast.error('Failed to stop search properly')
    }
  }

  // export util stuff
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportAsJSON = () => {
    if (!results?.platforms) return
    const validPlatforms = results.platforms.filter(p => p.valid)
    const exportData = {
      username: results.username,
      searchDate: new Date().toISOString(),
      totalFound: validPlatforms.length,
      totalChecked: results.totalChecked || results.platforms.length,
      platforms: validPlatforms.map(p => ({ name: p.name, url: p.url, status: p.status }))
    }
    downloadFile(JSON.stringify(exportData, null, 2), `${results.username}_profiles.json`, 'application/json')
    toast.success('Results exported as JSON!')
  }

  const exportAsCSV = () => {
    if (!results?.platforms) return
    const validPlatforms = results.platforms.filter(p => p.valid)
    const csvContent = [
      ['Platform', 'URL', 'Status'],
      ...validPlatforms.map(p => [p.name, p.url, p.status])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    downloadFile(csvContent, `${results.username}_profiles.csv`, 'text/csv')
    toast.success('Results exported as CSV!')
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* search form where you put the username to search */}
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
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopSearch}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <X className="w-6 h-6" />
                  <span>Stop Search</span>
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </form>
      </div>

       {/* results section area */}
       {(results || isStreaming) && (
         <div className="space-y-8 anim-fade">
           <h3 className="text-2xl font-semibold text-white">Search Results</h3>
           <QuickStats username={results?.username || username} foundCount={foundCount} isStreaming={isStreaming} />

           {/* results section that shows the results. (duh?) */}
           <div className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 anim-enter">
             <div className="p-6">
               <h4 className="text-xl font-semibold text-white mb-6 flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                     <Globe className="w-5 h-5 text-white" />
                   </div>
                   <span>
                     {isStreaming ? `Results (${foundCount} found so far)` : `Final Results (${results?.platforms?.filter(p => p.valid).length || 0} found)`}
                   </span>
                   {isStreaming && (
                     <div className="ml-auto flex items-center space-x-2">
                       <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                       <span className="text-purple-400 text-sm font-medium">Searching...</span>
                     </div>
                   )}
                 </div>
                 {!isStreaming && (
                   <div className="flex items-center space-x-2">
                     <button onClick={exportAsJSON} className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2" title="Export as JSON">
                       <Download className="w-4 h-4" />
                       <span>JSON</span>
                     </button>
                     <button onClick={exportAsCSV} className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2" title="Export as CSV">
                       <Download className="w-4 h-4" />
                       <span>CSV</span>
                     </button>
                   </div>
                 )}
               </h4>

               {isStreaming ? (
                 <ResultsGrid 
                   profiles={streamingResults.filter(p => p.valid)} 
                   username={results?.username || username} 
                 />
               ) : results?.platforms?.filter(p => p.valid).length > 0 ? (
                 <ResultsGrid 
                   profiles={results.platforms.filter(p => p.valid)} 
                   username={results?.username || username} 
                 />
               ) : (
                 <div className="p-8 text-center">
                   <div className="w-20 h-20 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Eye className="w-10 h-10 text-zinc-300" />
                   </div>
                   <h4 className="text-xl font-semibold text-white mb-3">No profiles found</h4>
                   <p className="text-zinc-400 text-base leading-relaxed">
                     No social media profiles were found for this username across the platforms we checked
                   </p>
                 </div>
               )}

               {isStreaming && streamingResults.filter(p => p.valid).length === 0 && totalChecked > 0 && (
                 <div className="col-span-full">
                   <div className="text-center py-12">
                     <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <h4 className="text-white font-medium text-lg mb-2">Searching platforms...</h4>
                     <p className="text-zinc-400 text-sm">{totalChecked} platforms checked so far</p>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

      {/* empty state if no results are found*/}
      {!results && !isLoading && !isStreaming && (
        <div className="text-center py-16 anim-fade">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-700">
            <User className="w-12 h-12 text-zinc-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-4">Ready to search usernames</h3>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md mx-auto">
            Enter a username above to start searching across 400+ social platforms in real-time
          </p>
        </div>
      )}
    </div>
  )
}

export default UsernameSearchTool
