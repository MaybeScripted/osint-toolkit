import React, { useState } from 'react'
import { Globe, Search, Shield, Database, Copy, ExternalLink, Calendar, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const DomainLookupTool = () => {
  const [domain, setDomain] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!domain.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.lookupDomain(domain)
      if (response.success) {
        setResults(response.data)
        toast.success('Domain lookup completed!')
      } else {
        throw new Error(response.error?.message || 'Lookup failed')
      }
    } catch (error) {
      console.error('Domain lookup error:', error)
      toast.error(error.message || 'Failed to lookup domain')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* searching form / input area */}
      <div className="card mb-6 hover:lift anim-enter">
        <form onSubmit={handleLookup} className="card-content space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Domain Name
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter domain name (e.g., example.com)..."
                className="input-field flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !domain.trim()}
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
          
          {/* basic domain info */}
          <div className="card hover:lift anim-enter">
            <div className="card-content">
            <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>Domain Information</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-dark-400 text-sm">Domain:</span>
                <p className="text-white font-mono">{results.domain || domain}</p>
              </div>
              <div>
                <span className="text-dark-400 text-sm">TLD:</span>
                <p className="text-white">{results.basic_info?.tld || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-dark-400 text-sm">Subdomain:</span>
                <p className="text-white">{results.basic_info?.subdomain || 'None'}</p>
              </div>
              <div>
                <span className="text-dark-400 text-sm">Second Level Domain:</span>
                <p className="text-white">{results.basic_info?.sld || 'Unknown'}</p>
              </div>
            </div>
            </div>
          </div>

          {/* WHOIS info */}
          {results.whois && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Database className="w-5 h-5 text-green-400" />
                <span>WHOIS Data</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-dark-400 text-sm">Registrar:</span>
                  <p className="text-white">{results.whois.registrar_name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Created:</span>
                  <p className="text-white">{formatDate(results.whois.creation_date)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Expires:</span>
                  <p className="text-white">{formatDate(results.whois.expiration_date)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Updated:</span>
                  <p className="text-white">{formatDate(results.whois.updated_date)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Registrar IANA ID:</span>
                  <p className="text-white">{results.whois.registrar_iana_id || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">DNSSEC:</span>
                  <p className={`font-medium ${
                    results.whois.dnssec === 'signed' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {results.whois.dnssec || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {results.whois.domain_status && results.whois.domain_status.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-white font-medium mb-2">Domain Status:</h5>
                  <div className="space-y-1">
                    {results.whois.domain_status.map((status, index) => (
                      <p key={index} className="text-dark-300 text-sm">{status}</p>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* DNS records */}
          {results.dns_records && results.dns_records.records && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>DNS Records</span>
              </h4>
              <div className="space-y-4">
                {results.dns_records.records.A && results.dns_records.records.A.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-2">A Records</h5>
                    <div className="space-y-2">
                      {results.dns_records.records.A.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                          <span className="text-white font-mono">{record}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(record)
                              toast.success('IP copied to clipboard!')
                            }}
                            className="btn-ghost"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.dns_records.records.MX && results.dns_records.records.MX.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-2">MX Records</h5>
                    <div className="space-y-2">
                      {results.dns_records.records.MX.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                          <span className="text-white font-mono">{record}</span>
                          <button
                      onClick={() => {
                              navigator.clipboard.writeText(record)
                              toast.success('MX record copied!')
                            }}
                      className="btn-ghost"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.dns_records.records.NS && results.dns_records.records.NS.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-2">NS Records</h5>
                    <div className="space-y-2">
                      {results.dns_records.records.NS.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                          <span className="text-white font-mono">{record}</span>
                          <button
                      onClick={() => {
                              navigator.clipboard.writeText(record)
                              toast.success('NS record copied!')
                            }}
                      className="btn-ghost"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.dns_records.records.SOA && results.dns_records.records.SOA.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-2">SOA Record</h5>
                    <div className="space-y-2">
                      {results.dns_records.records.SOA.map((record, index) => (
                        <div key={index} className="p-3 bg-dark-700 rounded-lg">
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            <div><span className="text-dark-400">Primary NS:</span> <span className="text-white font-mono">{record.mname}</span></div>
                            <div><span className="text-dark-400">Admin Email:</span> <span className="text-white font-mono">{record.rname}</span></div>
                            <div><span className="text-dark-400">Serial:</span> <span className="text-white font-mono">{record.serial}</span></div>
                            <div><span className="text-dark-400">Refresh:</span> <span className="text-white">{record.refresh}s</span></div>
                            <div><span className="text-dark-400">Retry:</span> <span className="text-white">{record.retry}s</span></div>
                            <div><span className="text-dark-400">Expire:</span> <span className="text-white">{record.expire}s</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {/* SSL certificate */}
          {results.ssl_certificate && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <span>SSL Certificate</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-dark-400 text-sm">Valid:</span>
                  <p className={`font-medium ${results.ssl_certificate.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                    {results.ssl_certificate.is_valid ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Issuer:</span>
                  <p className="text-white">{results.ssl_certificate.issuer?.organizationName || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Valid From:</span>
                  <p className="text-white">{formatDate(results.ssl_certificate.valid_from)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Valid Until:</span>
                  <p className="text-white">{formatDate(results.ssl_certificate.valid_until)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Days Remaining:</span>
                  <p className={`font-medium ${
                    results.ssl_certificate.days_remaining > 30 ? 'text-green-400' :
                    results.ssl_certificate.days_remaining > 7 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.ssl_certificate.days_remaining || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Algorithm:</span>
                  <p className="text-white">{results.ssl_certificate.signature_algorithm || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Serial Number:</span>
                  <p className="text-white font-mono text-xs">{results.ssl_certificate.serial_number || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-sm">Version:</span>
                  <p className="text-white">{results.ssl_certificate.version || 'Unknown'}</p>
                </div>
              </div>
              
              {results.ssl_certificate.alternative_names && results.ssl_certificate.alternative_names.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-white font-medium mb-2">Alternative Names:</h5>
                  <div className="space-y-1">
                    {results.ssl_certificate.alternative_names.map((name, index) => (
                      <p key={index} className="text-dark-300 text-sm font-mono">{name}</p>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* additional entities */}
          {results.entities && results.entities.length > 0 && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span>Found entities</span>
              </h4>
              <div className="space-y-2">
                {results.entities.map((entity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <span className="text-white">{entity}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(entity)
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
        <div className="text-center py-12 anim-fade">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No lookup performed yet</h3>
          <p className="text-dark-400">
            Enter a domain name above to start the lookup process
          </p>
        </div>
      )}
    </div>
  )
}

export default DomainLookupTool
