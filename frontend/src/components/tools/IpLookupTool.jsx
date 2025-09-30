import { useState } from 'react'
import { MapPin, Search, Globe, Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { validateIp } from '../../utils/validation'

const IpLookupTool = () => {
  const [ip, setIp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [isValidIp, setIsValidIp] = useState(null)

  const handleInputChange = (e) => {
    const value = e.target.value
    setIp(value)
    
    // Real-time validation feedback
    if (value.trim()) {
      setIsValidIp(validateIp(value.trim()))
    } else {
      setIsValidIp(null)
    }
  }

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!ip.trim()) {
      toast.error('Please enter an IP address')
      return
    }

    // Validate IP format before making API call
    if (!validateIp(ip.trim())) {
      toast.error('Please enter a valid IP address (e.g., 8.8.8.8)')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.lookupIP(ip)
      if (response.success) {
        setResults(response.data)
        toast.success('IP lookup completed!')
      } else {
        throw new Error(response.error?.message || 'Lookup failed')
      }
    } catch (error) {
      console.error('IP lookup error:', error)
      toast.error(error.message || 'Failed to lookup IP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* searching form / input area */}
      <div className="card hover:lift anim-enter">
        <div className="card-content">
          <form onSubmit={handleLookup} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-white mb-3">
              IP Address
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={ip}
                onChange={handleInputChange}
                placeholder="Enter IP address (e.g., 8.8.8.8)"
                className={`input-field flex-1 ${
                  isValidIp === true ? 'border-green-400' : 
                  isValidIp === false ? 'border-red-400' : ''
                }`}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !ip.trim() || isValidIp === false}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
                <span>{isLoading ? 'Looking up...' : 'Lookup'}</span>
              </button>
            </div>
          </div>
          </form>
        </div>
      </div>

      {/* results (duh?) */}
      {results && (
        <div className="space-y-8 anim-fade">
          <h3 className="text-2xl font-semibold text-white">Lookup Results</h3>
          
          {/* basic ip info card */}
          <div className="card hover:lift anim-enter">
            <div className="card-content">
              <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-primary-400" />
                <span>IP Information</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <span className="text-dark-300 text-base">IP Address:</span>
                  <p className="text-white font-mono">{results.ip || ip}</p>
                </div>
                <div>
                  <span className="text-dark-300 text-base">Version:</span>
                  <p className="text-white">{results.geolocation?.version || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location info, not exact tho obv */}
          {results.geolocation && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
                <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-primary-400" />
                  <span>Location</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <span className="text-dark-300 text-base">Country:</span>
                    <p className="text-white">{results.geolocation.country_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Region:</span>
                    <p className="text-white">{results.geolocation.region || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">City:</span>
                    <p className="text-white">{results.geolocation.city || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Timezone:</span>
                    <p className="text-white">{results.geolocation.timezone || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Postal Code:</span>
                    <p className="text-white">{results.geolocation.postal || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Coordinates:</span>
                    <p className="text-white">
                      {results.geolocation.latitude && results.geolocation.longitude
                        ? `${results.geolocation.latitude}, ${results.geolocation.longitude}`
                        : 'Unknown'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Currency:</span>
                    <p className="text-white">{results.geolocation.currency_name || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* network info shit */}
          {results.geolocation && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
                <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-primary-400" />
                  <span>Network Information</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <span className="text-dark-300 text-base">ASN:</span>
                    <p className="text-white font-mono">{results.geolocation.asn || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Organization:</span>
                    <p className="text-white">{results.geolocation.org || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Network:</span>
                    <p className="text-white font-mono">{results.geolocation.network || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* rep check */}
          {results.reputation && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
                <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-primary-400" />
                  <span>Reputation</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <span className="text-dark-300 text-base">Malicious:</span>
                    <p className={`font-medium ${
                      results.reputation.malicious ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {results.reputation.malicious ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-300 text-base">Suspicious:</span>
                    <p className={`font-medium ${
                      results.reputation.suspicious ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {results.reputation.suspicious ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !isLoading && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <MapPin className="w-10 h-10 text-dark-300" />
          </div>
          <h3 className="text-xl font-medium text-white mb-3">No lookup performed yet</h3>
          <p className="text-dark-400 text-base">
            Enter an IP address above to start the lookup process
          </p>
        </div>
      )}
    </div>
  )
}

export default IpLookupTool
