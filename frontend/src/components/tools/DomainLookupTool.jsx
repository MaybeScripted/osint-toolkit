import { useState } from 'react'
import { Globe, Search, Shield, Database, Copy, ExternalLink, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { validateDomain } from '../../utils/validation'

const DomainLookupTool = () => {
  const [domain, setDomain] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [isValidDomain, setIsValidDomain] = useState(null)

  const handleInputChange = (e) => {
    const value = e.target.value
    setDomain(value)
    
    // Real-time validation feedback
    if (value.trim()) {
      setIsValidDomain(validateDomain(value.trim()))
    } else {
      setIsValidDomain(null)
    }
  }

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!domain.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    // Validate domain format before making API call
    if (!validateDomain(domain.trim())) {
      toast.error('Please enter a valid domain name (e.g., google.com)')
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
    <div className="max-w-6xl mx-auto">
      {/* searching form / input area */}
      <div className="card mb-8 hover:lift anim-enter">
        <form onSubmit={handleLookup} className="card-content space-y-5">
          <div>
            <label className="block text-base font-medium text-white mb-3">
              Domain Name
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={domain}
                onChange={handleInputChange}
                placeholder="Enter domain name (e.g., example.com)..."
                className={`input-field flex-1 ${
                  isValidDomain === true ? 'border-green-400' : 
                  isValidDomain === false ? 'border-red-400' : ''
                }`}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !domain.trim() || isValidDomain === false}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

      {/* Results */}
      {results && (
        <div className="space-y-8 anim-fade">
          <h3 className="text-2xl font-semibold text-white">Lookup Results</h3>
          
          {/* errors and warnings */}
          {results.errors && results.errors.length > 0 && (
            <div className="card bg-yellow-900/20 border border-yellow-500/30 hover:lift anim-enter">
              <div className="card-content">
                <h4 className="text-xl font-medium text-yellow-400 mb-3 flex items-center space-x-3">
                  <Shield className="w-6 h-6" />
                  <span>Service Warnings ({results.errors.length})</span>
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {results.errors.map((err, index) => (
                    <div key={index} className="p-3 bg-yellow-900/30 rounded text-sm border-l-4 border-yellow-500">
                      <span className="text-yellow-200 font-medium">{err.service}:</span>
                      <span className="text-yellow-300 ml-2">{err.error}</span>
                    </div>
                  ))}
                </div>
                <p className="text-yellow-300 text-sm mt-2">
                  Some services may be rate-limited or unconfigured. Other results may still be available.
                </p>
              </div>
            </div>
          )}
          
          {/* basic domain info */}
          <div className="card hover:lift anim-enter">
            <div className="card-content">
            <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
              <Globe className="w-6 h-6 text-blue-400" />
              <span>Domain Information</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <span className="text-dark-400 text-base">Domain:</span>
                <p className="text-white font-mono">{results.domain || domain}</p>
              </div>
              <div>
                <span className="text-dark-400 text-base">TLD:</span>
                <p className="text-white">{results.basic_info?.tld || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-dark-400 text-base">Subdomain:</span>
                <p className="text-white">{results.basic_info?.subdomain || 'None'}</p>
              </div>
              <div>
                <span className="text-dark-400 text-base">Second Level Domain:</span>
                <p className="text-white">{results.basic_info?.sld || 'Unknown'}</p>
              </div>
            </div>
            </div>
          </div>

          {/* WHOIS info */}
          {results.whois && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                <Database className="w-6 h-6 text-green-400" />
                <span>WHOIS Data</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <span className="text-dark-400 text-base">Registrar:</span>
                  <p className="text-white">{results.whois.registrar_name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Created:</span>
                  <p className="text-white">{formatDate(results.whois.creation_date)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Expires:</span>
                  <p className="text-white">{formatDate(results.whois.expiration_date)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Updated:</span>
                  <p className="text-white">{formatDate(results.whois.updated_date)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Registrar IANA ID:</span>
                  <p className="text-white">{results.whois.registrar_iana_id || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">DNSSEC:</span>
                  <p className={`font-medium ${
                    results.whois.dnssec === 'signed' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {results.whois.dnssec || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {results.whois.domain_status && results.whois.domain_status.length > 0 && (
                <div className="mt-5">
                  <h5 className="text-white font-medium mb-3">Domain Status:</h5>
                  <div className="space-y-2">
                    {results.whois.domain_status.map((status, index) => (
                      <p key={index} className="text-dark-300 text-base">{status}</p>
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
              <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                <Shield className="w-6 h-6 text-purple-400" />
                <span>DNS Records</span>
              </h4>
              <div className="space-y-5">
                {results.dns_records.records.A && results.dns_records.records.A.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-3">A Records</h5>
                    <div className="space-y-3">
                      {results.dns_records.records.A.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                          <span className="text-white font-mono">{record}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(record)
                              toast.success('IP copied to clipboard!')
                            }}
                            className="btn-ghost"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.dns_records.records.MX && results.dns_records.records.MX.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-3">MX Records</h5>
                    <div className="space-y-3">
                      {results.dns_records.records.MX.map((record, index) => {
                        // Handle both string and object formats for MX records
                        const recordText = typeof record === 'string' 
                          ? record 
                          : `${record.preference || 0} ${record.exchange || record.mx || ''}`;
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                            <span className="text-white font-mono">{recordText}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(recordText)
                                toast.success('MX record copied!')
                              }}
                              className="btn-ghost"
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {results.dns_records.records.NS && results.dns_records.records.NS.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-3">NS Records</h5>
                    <div className="space-y-3">
                      {results.dns_records.records.NS.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                          <span className="text-white font-mono">{record}</span>
                          <button
                      onClick={() => {
                              navigator.clipboard.writeText(record)
                              toast.success('NS record copied!')
                            }}
                      className="btn-ghost"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.dns_records.records.SOA && results.dns_records.records.SOA.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-3">SOA Record</h5>
                    <div className="space-y-3">
                      {results.dns_records.records.SOA.map((record, index) => (
                        <div key={index} className="p-4 bg-dark-700 rounded-lg">
                          <div className="grid md:grid-cols-2 gap-3 text-base">
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
              <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                <Shield className="w-6 h-6 text-orange-400" />
                <span>SSL Certificate</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <span className="text-dark-400 text-base">Valid:</span>
                  <p className={`font-medium ${results.ssl_certificate.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                    {results.ssl_certificate.is_valid ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Issuer:</span>
                  <p className="text-white">
                    {typeof results.ssl_certificate.issuer === 'string' 
                      ? results.ssl_certificate.issuer 
                      : (results.ssl_certificate.issuer?.organizationName || results.ssl_certificate.issuer?.commonName || JSON.stringify(results.ssl_certificate.issuer)) || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Valid From:</span>
                  <p className="text-white">{formatDate(results.ssl_certificate.valid_from)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Valid Until:</span>
                  <p className="text-white">{formatDate(results.ssl_certificate.valid_until)}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Days Remaining:</span>
                  <p className={`font-medium ${
                    results.ssl_certificate.days_remaining > 30 ? 'text-green-400' :
                    results.ssl_certificate.days_remaining > 7 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.ssl_certificate.days_remaining || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Algorithm:</span>
                  <p className="text-white">{results.ssl_certificate.signature_algorithm || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Serial Number:</span>
                  <p className="text-white font-mono text-sm">{results.ssl_certificate.serial_number || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-dark-400 text-base">Version:</span>
                  <p className="text-white">{results.ssl_certificate.version || 'Unknown'}</p>
                </div>
              </div>
              
              {results.ssl_certificate.alternative_names && results.ssl_certificate.alternative_names.length > 0 && (
                <div className="mt-5">
                  <h5 className="text-white font-medium mb-3">Alternative Names:</h5>
                  <div className="space-y-2">
                    {results.ssl_certificate.alternative_names.map((name, index) => (
                      <p key={index} className="text-dark-300 text-base font-mono">{name}</p>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* subdomains - disabled due to crt.sh issues */}
          {false && results.subdomains && results.subdomains.length > 0 && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
                <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-indigo-400" />
                  <span>Discovered Subdomains ({results.subdomains.length})</span>
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.subdomains.map((subdomain, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded">
                      <span className="text-white font-mono text-sm break-all">{subdomain}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(subdomain);
                          toast.success('Subdomain copied!');
                        }}
                        className="btn-ghost p-1"
                        title="Copy subdomain"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* discovered paths */}
          {results.paths && results.paths.length > 0 && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
                <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                  <ExternalLink className="w-6 h-6 text-pink-400" />
                  <span>Discovered Paths ({results.paths.length})</span>
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.paths.map((pathInfo, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3 rounded text-sm ${
                        pathInfo.status === 200 ? 'bg-green-900/50 border border-green-500/30' :
                        pathInfo.status >= 300 && pathInfo.status < 400 ? 'bg-blue-900/50 border border-blue-500/30' :
                        'bg-yellow-900/50 border border-yellow-500/30'
                      }`}
                    >
                      <span className="text-white font-mono break-all">
                        {pathInfo.path === '/' ? '/' : '/' + pathInfo.path}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium px-2 py-1 rounded text-xs ${
                          pathInfo.status === 200 ? 'text-green-400 bg-green-900/30' :
                          pathInfo.status >= 300 && pathInfo.status < 400 ? 'text-blue-400 bg-blue-900/30' :
                          'text-yellow-400 bg-yellow-900/30'
                        }`}>
                          {pathInfo.status}
                        </span>
                        {pathInfo.size && pathInfo.status === 200 && (
                          <span className="text-dark-400 text-xs">({(parseInt(pathInfo.size) / 1024).toFixed(1)} KB)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* additional stuff/entities */}
          {results.entities && results.entities.length > 0 && (
            <div className="card hover:lift anim-enter">
              <div className="card-content">
              <h4 className="text-xl font-medium text-white mb-5 flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-cyan-400" />
                <span>Found Entities ({results.entities.length})</span>
              </h4>
              <div className="space-y-3">
                {results.entities.map((entity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div className="flex-1">
                      <span className="text-white font-mono text-sm">
                        {typeof entity.value === 'string' ? entity.value : JSON.stringify(entity.value)} 
                        <span className="text-dark-400 ml-2">({entity.type})</span>
                      </span>
                      {entity.confidence && entity.confidence < 1.0 && (
                        <span className="text-xs text-dark-500 ml-2">({(entity.confidence * 100).toFixed(0)}% confidence)</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const copyVal = typeof entity.value === 'string' ? entity.value : JSON.stringify(entity.value);
                        navigator.clipboard.writeText(copyVal);
                        toast.success('Entity copied to clipboard!');
                      }}
                      className="btn-ghost"
                    >
                      <Copy className="w-5 h-5" />
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
        <div className="text-center py-16 anim-fade">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Globe className="w-10 h-10 text-dark-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-3">No lookup performed yet</h3>
          <p className="text-dark-400 text-base">
            Enter a domain name above to start the lookup process
          </p>
        </div>
      )}
    </div>
  )
}

export default DomainLookupTool
