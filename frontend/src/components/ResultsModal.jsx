import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Copy, CheckCircle, Users, Clock, Globe, Zap, Shield, AlertTriangle, Mail, User, Image, Hash, TrendingUp, Server, Lock, Database } from 'lucide-react'
import { toast } from 'react-hot-toast'

const ResultsModal = ({ isOpen, onClose, results, query, queryType }) => {
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      
      document.documentElement.style.margin = '0'
      document.documentElement.style.padding = '0'
      document.body.style.margin = '0'
      document.body.style.padding = '0'
      
      // Lock body scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        const scrollY = document.body.style.top
        
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        
        document.documentElement.style.margin = ''
        document.documentElement.style.padding = ''
        document.body.style.margin = ''
        document.body.style.padding = ''
        
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1)
        }
      }
    }
  }, [isOpen])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getTypeIcon = (type) => {
    const icons = {
      email: Mail,
      username: User, 
      ip: Globe,
      name: Hash,
      domain: Globe
    }
    return icons[type] || Globe
  }

  const getRiskColor = (level) => {
    const colors = {
      'very_low': 'text-green-400',
      'low': 'text-green-400',
      'medium': 'text-yellow-400',
      'high': 'text-red-400',
      'unknown': 'text-gray-400'
    }
    return colors[level] || 'text-gray-400'
  }

  const getRiskIcon = (level) => {
    if (['high', 'medium'].includes(level)) return AlertTriangle
    return Shield
  }

  // this is just to like, format all the shit in the DNS records
  const formatDNSRecord = (record, recordType) => {
    if (typeof record !== 'object' || record === null) {
      return String(record)
    }

    switch (recordType) {
      case 'SOA':
        return `${record.mname} ${record.rname} (Serial: ${record.serial}, Refresh: ${record.refresh}s, Retry: ${record.retry}s, Expire: ${record.expire}s, Min TTL: ${record.minimum}s)`
      
      case 'MX':
        return `Priority: ${record.preference || record.priority || 'N/A'}, Mail Server: ${record.exchange || record.hostname || 'N/A'}`
      
      case 'SRV':
        return `Priority: ${record.priority}, Weight: ${record.weight}, Port: ${record.port}, Target: ${record.target}`
      
      case 'TXT':
        // TXT records are usually already strings, but just in case.....
        return Array.isArray(record) ? record.join(' ') : String(record)
      
      default:
        // for other complex objects. but mostly just fkn DNS records.
        return Object.entries(record)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
    }
  }

  // formats WHOIS/SSL/whatever objects for display (discord style: #formatting-gang)
  const formatComplexValue = (value) => {
    if (typeof value !== 'object' || value === null) {
      return String(value)
    }

    if (Array.isArray(value)) {
      return value.join(', ')
    }

    // key-value pairs, but make it readable
    const entries = Object.entries(value)
    if (entries.length === 0) return 'N/A'
    
    // special sauce for cert-ish objects
    if (entries.some(([key]) => ['commonName', 'organizationName', 'countryName', 'mname', 'rname'].includes(key))) {
      return entries.map(([key, val]) => `${key}=${val}`).join(', ')
    }
    
    // fallback: just key: value, comma separated
    return entries.map(([key, val]) => `${key}: ${val}`).join(', ')
  }

  // old name, still works (for the legacy losers)
  const formatSSLValue = formatComplexValue

  // Render IP lookup results
  const renderIPResults = (results) => {
    const geo = results.geolocation || {}
    const reputation = results.reputation || {}
    
    return (
      <div className="space-y-8">
        {/* Basic IP Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">IP Information</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-dark-700/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">IP Address</div>
              <div className="font-mono text-white text-sm">{results.ip}</div>
            </div>
            <div className="text-center bg-dark-700/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Version</div>
              <div className="font-mono text-white text-sm">{geo.version || 'N/A'}</div>
            </div>
            <div className="text-center bg-dark-700/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Network</div>
              <div className="font-mono text-white text-sm">{geo.network || 'N/A'}</div>
            </div>
            <div className="text-center bg-dark-700/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">ASN</div>
              <div className="font-mono text-white text-sm">{geo.asn || 'N/A'}</div>
            </div>
          </div>
        </motion.div>

        {/* Geolocation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-5 h-5 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Geolocation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">City</span>
                <span className="text-white">{geo.city || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Region</span>
                <span className="text-white">{geo.region} {geo.region_code ? `(${geo.region_code})` : ''}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Country</span>
                <span className="text-white">{geo.country_name} ({geo.country})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Postal Code</span>
                <span className="text-white">{geo.postal || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Latitude</span>
                <span className="text-white">{geo.latitude || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Longitude</span>
                <span className="text-white">{geo.longitude || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Timezone</span>
                <span className="text-white">{geo.timezone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">UTC Offset</span>
                <span className="text-white">{geo.utc_offset || 'N/A'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Network Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Server className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Network Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Organization</span>
                <span className="text-white">{geo.org || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Currency</span>
                <span className="text-white">{geo.currency} {geo.currency_name ? `(${geo.currency_name})` : ''}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Languages</span>
                <span className="text-white">{geo.languages || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Country Area</span>
                <span className="text-white">{geo.country_area ? `${geo.country_area.toLocaleString()} km²` : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Population</span>
                <span className="text-white">{geo.country_population ? geo.country_population.toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-700/50">
                <span className="text-gray-400">Calling Code</span>
                <span className="text-white">{geo.country_calling_code || 'N/A'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* VirusTotal Reputation */}
        {reputation && Object.keys(reputation).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-red-400" />
              <h3 className="text-xl font-semibold text-white">Security Reputation</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Detected URLs</div>
                <div className="font-mono text-white text-sm">{reputation.detected_urls?.length || 0}</div>
              </div>
              <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Malware Samples</div>
                <div className="font-mono text-white text-sm">{reputation.detected_communicating_samples?.length || 0}</div>
              </div>
              <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Positives</div>
                <div className="font-mono text-white text-sm">{reputation.positives || 0}</div>
              </div>
              <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Total Scans</div>
                <div className="font-mono text-white text-sm">{reputation.total || 0}</div>
              </div>
            </div>
            {reputation.scan_date && (
              <div className="mt-4 text-center text-sm text-gray-400">
                Last scanned: {reputation.scan_date}
              </div>
            )}
          </motion.div>
        )}

        {/* Errors */}
        {results.errors && results.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-red-900/20 border border-red-500/30 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-xl font-semibold text-white">Lookup Errors</h3>
            </div>
            <div className="space-y-2">
              {results.errors.map((error, index) => (
                <div key={index} className="bg-red-900/20 p-3 rounded-lg">
                  <div className="text-red-400 font-medium text-sm">{error.service}</div>
                  <div className="text-gray-300 text-sm">{error.error}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  const renderDomainResults = (results) => {
    return (
      <div className="space-y-8">
        {/* Basic Domain Info */}
        {results.basic_info && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Domain Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Domain</div>
                <div className="font-mono text-white text-sm">{results.basic_info.domain}</div>
              </div>
              <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">TLD</div>
                <div className="font-mono text-white text-sm">{results.basic_info.tld}</div>
              </div>
              <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">SLD</div>
                <div className="font-mono text-white text-sm">{results.basic_info.sld}</div>
              </div>
              {results.basic_info.subdomain && (
                <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Subdomain</div>
                  <div className="font-mono text-white text-sm">{results.basic_info.subdomain}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* DNS Records */}
        {results.dns_records?.records && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Server className="w-5 h-5 text-green-400" />
              <h3 className="text-xl font-semibold text-white">DNS Records</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(results.dns_records.records).map(([recordType, records]) => (
                <div key={recordType} className="bg-dark-700/30 p-4 rounded-lg">
                  <div className="font-medium text-white mb-3 flex items-center">
                    <span className="bg-primary-600/20 text-primary-400 px-2 py-1 rounded text-sm mr-3">
                      {recordType}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({Array.isArray(records) ? records.length : 1} record{Array.isArray(records) && records.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(records) ? (
                      records.map((record, index) => (
                        <div key={index} className="text-sm text-gray-300 bg-dark-900/50 p-3 rounded">
                          {formatDNSRecord(record, recordType)}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-300 bg-dark-900/50 p-3 rounded">
                        {formatDNSRecord(records, recordType)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* WHOIS Information */}
        {results.whois && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">WHOIS Information</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(results.whois)
                .filter(([key, value]) => value && value !== 'null' && value !== null)
                .slice(0, 10)
                .map(([key, value]) => (
                  <div key={key} className="py-2 border-b border-dark-700/50">
                    <span className="text-gray-400 capitalize text-sm font-medium">
                      {key.replace(/_/g, ' ')}: {' '}
                    </span>
                    <span className="text-white text-sm">
                      {formatSSLValue(value)}
                    </span>
                  </div>
                ))}
              {Object.keys(results.whois).length > 10 && (
                <div className="text-center pt-3">
                  <span className="text-gray-500 text-sm">+ {Object.keys(results.whois).length - 10} more fields</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SSL Certificate */}
        {results.ssl_certificate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-5 h-5 text-green-400" />
              <h3 className="text-xl font-semibold text-white">SSL Certificate</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(results.ssl_certificate)
                .filter(([key, value]) => value && value !== 'null' && value !== null)
                .slice(0, 8)
                .map(([key, value]) => (
                  <div key={key} className="py-2 border-b border-dark-700/50">
                    <span className="text-gray-400 capitalize text-sm font-medium">
                      {key.replace(/_/g, ' ')}: {' '}
                    </span>
                    <span className="text-white text-sm">
                      {formatSSLValue(value)}
                    </span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Errors */}
        {results.errors && results.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-red-900/20 border border-red-500/30 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-xl font-semibold text-white">Lookup Errors</h3>
            </div>
            <div className="space-y-2">
              {results.errors.map((error, index) => (
                <div key={index} className="bg-red-900/20 p-3 rounded-lg">
                  <div className="text-red-400 font-medium text-sm">{error.service}</div>
                  <div className="text-gray-300 text-sm">{error.error}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  // Render email summary section
  const renderEmailSummary = (summary) => {
    if (!summary) return null
    
    const RiskIcon = getRiskIcon(summary.riskLevel)
    
    return (
      <div className="bg-gradient-to-r from-primary-600/10 to-blue-600/10 border border-primary-500/20 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-primary-400" />
            <h3 className="text-xl font-semibold text-white">Intelligence Summary</h3>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <RiskIcon className={`w-5 h-5 ${getRiskColor(summary.riskLevel)}`} />
              <span className={`font-medium capitalize ${getRiskColor(summary.riskLevel)}`}>
                {summary.riskLevel.replace('_', ' ')} Risk
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {Math.round(summary.confidence)}% confidence
            </div>
          </div>
        </div>

        {summary.keyFindings && summary.keyFindings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Key Findings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.keyFindings.map((finding, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-dark-800/30 rounded-lg">
                  <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-200 text-sm leading-relaxed">{finding}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.recommendations && summary.recommendations.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Recommendations</h4>
            <div className="space-y-2">
              {summary.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // breach intelligence stuff
  const renderBreachIntelligence = (breaches) => {
    if (!breaches) return null

    return (
      <div className="space-y-6">
        {/* Breach Overview */}
        {breaches.breaches && (
          <div className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-red-400" />
              <h4 className="text-lg font-semibold text-white">Data Breaches</h4>
              {breaches.breaches.breachCount > 0 && (
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">
                  {breaches.breaches.breachCount} found
                </span>
              )}
            </div>

            {breaches.breaches.breachCount > 0 ? (
              <div className="space-y-4">
                {breaches.intelligence && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-dark-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-400">{breaches.intelligence.riskScore}/100</div>
                      <div className="text-sm text-gray-400">Risk Score</div>
                    </div>
                    <div className="bg-dark-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white capitalize">{breaches.intelligence.breachSeverity}</div>
                      <div className="text-sm text-gray-400">Severity</div>
                    </div>
                    <div className="bg-dark-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">{breaches.intelligence.compromisedDataTypes?.length || 0}</div>
                      <div className="text-sm text-gray-400">Data Types</div>
                    </div>
                  </div>
                )}

                {breaches.breaches.breaches && breaches.breaches.breaches.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-300">Breached Services</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {breaches.breaches.breaches.slice(0, 6).map((breach, index) => (
                        <div key={index} className="bg-dark-700/30 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-white">{breach.Name}</div>
                            <div className="text-xs text-gray-400">{breach.BreachDate}</div>
                          </div>
                          <div className="text-sm text-gray-400 mb-2">{breach.Domain}</div>
                          {breach.PwnCount && (
                            <div className="text-xs text-red-400">{breach.PwnCount.toLocaleString()} accounts affected</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <div className="text-green-400 font-medium">No breaches found</div>
                <div className="text-sm text-gray-400 mt-1">This email has not been found in any known data breaches</div>
              </div>
            )}
          </div>
        )}

        {/* Paste Data */}
        {breaches.pastes && breaches.pastes.pasteCount > 0 && (
          <div className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-5 h-5 text-orange-400" />
              <h4 className="text-lg font-semibold text-white">Paste Exposures</h4>
              <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-sm">
                {breaches.pastes.pasteCount} found
              </span>
            </div>
            <div className="text-sm text-gray-400">
              This email was found in {breaches.pastes.pasteCount} public paste{breaches.pastes.pasteCount > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render social media profiles
  const renderSocialProfiles = (profiles) => {
    if (!Array.isArray(profiles) || profiles.length === 0) return null

    return (
      <div className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-5 h-5 text-blue-400" />
          <h4 className="text-lg font-semibold text-white">Social Media Profiles</h4>
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">
            {profiles.length} found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-dark-700/30 border border-dark-600/30 rounded-lg p-4 hover:border-primary-500/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <h5 className="font-medium text-white text-sm">{profile.site}</h5>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => copyToClipboard(profile.url)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={profile.url.startsWith('//') ? `https:${profile.url}` : profile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-primary-400 transition-colors rounded"
                    title="Open profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 font-mono break-all">
                {profile.url.startsWith('//') ? `https:${profile.url}` : profile.url}
              </div>
              
              {profile.response_time && (
                <div className="flex items-center space-x-2 mt-2">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{profile.response_time}ms</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // Render username lookup results with platform cards
  const renderUsernameResults = (results) => {
    if (!results || !results.platforms || !Array.isArray(results.platforms)) return null

    const platforms = results.platforms
    const foundPlatforms = platforms.filter(p => p.valid && p.status === 'found')

    return (
      <div className="space-y-8">
        {/* Platform Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Platform Results</h4>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">
              {foundPlatforms.length} profiles found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {foundPlatforms.map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="bg-dark-700/30 border border-dark-600/30 rounded-lg p-4 hover:border-primary-500/50 hover:bg-dark-700/50 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <h5 className="font-medium text-white text-sm truncate">{platform.name}</h5>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(platform.url)}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-primary-400 transition-colors rounded"
                      title="Open profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 font-mono break-all mb-2">
                  {platform.url}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-400 font-medium">✓ Found</span>
                  <span className="text-gray-500">Profile Active</span>
                </div>
              </motion.div>
            ))}
          </div>

          {foundPlatforms.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Profiles Found</h3>
              <p className="text-gray-400">This username wasn't found on any of the checked platforms.</p>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  if (!isOpen) return null

  // Check if we have email OSINT data
  const isEmailOSINT = queryType === 'email' && results && (results.summary || results.hunter || results.breaches)
  
  // Check if this is a domain lookup result
  const isDomainLookup = queryType === 'domain' && results && (results.dns_records || results.whois || results.ssl_certificate || results.basic_info)
  
  // Check if this is an IP lookup result
  const isIPLookup = queryType === 'ip' && results && (results.geolocation || results.reputation || results.ip)
  
  // Check if this is a username lookup result
  const isUsernameLookup = queryType === 'username' && results && results.platforms
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-hidden"
          onClick={onClose}
          style={{ touchAction: 'none', margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full bg-dark-950 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ margin: 0, padding: 0, minHeight: '100vh' }}
          >
            {/* Header - Fixed */}
            <div className="flex-shrink-0 border-b border-dark-700/50 bg-dark-900/95 backdrop-blur-md shadow-lg" style={{ margin: 0, padding: 0, position: 'sticky', top: 0, zIndex: 10 }}>
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-600/20 rounded-xl">
                    {React.createElement(getTypeIcon(queryType), { className: "w-6 h-6 text-primary-400" })}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {queryType === 'email' ? 'Email Intelligence Report' : 'OSINT Lookup Results'}
                    </h1>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-gray-400">
                        <span className="capitalize">{queryType}</span>: 
                        <span className="font-mono text-primary-400 ml-2 bg-dark-800/50 px-2 py-1 rounded">{query}</span>
                      </p>
                      {results?.summary?.dataPoints && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">{results.summary.dataPoints} data sources</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-3 text-gray-400 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto p-6">
                {isEmailOSINT ? (
                  <div className="space-y-8">
                    {/* Summary Section */}
                    {results.summary && renderEmailSummary(results.summary)}

                    {/* Hunter.io Results */}
                    {results.hunter?.intelligence && (
                      <div className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <Shield className="w-5 h-5 text-primary-400" />
                          <div>
                            <h3 className="text-xl font-semibold text-white">Hunter.io OSINT Intelligence</h3>                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Person Intelligence */}
                          {results.hunter.intelligence.personIntel?.fullName && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-medium text-white flex items-center">
                                <User className="w-5 h-5 mr-2 text-blue-400" />
                                Person Intelligence
                              </h4>
                              <div className="space-y-3">
                                <div className="bg-dark-700/30 p-4 rounded-lg">
                                  <div className="text-white font-semibold text-lg">{results.hunter.intelligence.personIntel.fullName}</div>
                                  {results.hunter.intelligence.personIntel.employment?.title && (
                                    <div className="text-gray-300 text-sm">{results.hunter.intelligence.personIntel.employment.title}</div>
                                  )}
                                  {results.hunter.intelligence.personIntel.location && (
                                    <div className="text-gray-400 text-sm flex items-center mt-2">
                                      <Globe className="w-4 h-4 mr-1" />
                                      {results.hunter.intelligence.personIntel.location}
                                    </div>
                                  )}
                                </div>

                                {/* Social Profiles */}
                                {Object.entries(results.hunter.intelligence.personIntel.socialProfiles || {}).filter(([_, value]) => value).length > 0 && (
                                  <div>
                                    <div className="text-gray-300 font-medium mb-2">Social Profiles</div>
                                    <div className="space-y-1">
                                      {Object.entries(results.hunter.intelligence.personIntel.socialProfiles).map(([platform, handle]) => 
                                        handle && (
                                          <div key={platform} className="flex justify-between text-sm">
                                            <span className="text-gray-400 capitalize">{platform}</span>
                                            <span className="text-blue-400">{handle}</span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Company Intelligence */}
                          {results.hunter.intelligence.companyIntel?.name && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-medium text-white flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                                Company Intelligence
                              </h4>
                              <div className="space-y-3">
                                <div className="bg-dark-700/30 p-4 rounded-lg">
                                  <div className="text-white font-semibold text-lg">{results.hunter.intelligence.companyIntel.name}</div>
                                  {results.hunter.intelligence.companyIntel.industry && (
                                    <div className="text-gray-300 text-sm">{results.hunter.intelligence.companyIntel.industry}</div>
                                  )}
                                  {results.hunter.intelligence.companyIntel.description && (
                                    <div className="text-gray-400 text-sm mt-2">{results.hunter.intelligence.companyIntel.description.slice(0, 150)}...</div>
                                  )}
                                </div>

                                {/* Company Metrics */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {results.hunter.intelligence.companyIntel.foundedYear && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Founded</span>
                                      <span className="text-white">{results.hunter.intelligence.companyIntel.foundedYear}</span>
                                    </div>
                                  )}
                                  {results.hunter.intelligence.companyIntel.metrics?.employees && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Employees</span>
                                      <span className="text-white">{results.hunter.intelligence.companyIntel.metrics.employees}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Technology Stack */}
                                {results.hunter.intelligence.companyIntel.technology?.stack?.length > 0 && (
                                  <div>
                                    <div className="text-gray-300 font-medium mb-2">Technology Stack</div>
                                    <div className="flex flex-wrap gap-1">
                                      {results.hunter.intelligence.companyIntel.technology.stack.slice(0, 6).map((tech, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-dark-600 text-xs rounded text-gray-300">
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Domain Intelligence */}
                          {results.hunter.intelligence.domainIntel?.totalEmails && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-medium text-white flex items-center">
                                <Network className="w-5 h-5 mr-2 text-purple-400" />
                                Domain Intelligence
                              </h4>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                                    <div className="text-2xl font-bold text-white">{results.hunter.intelligence.domainIntel.totalEmails}</div>
                                    <div className="text-gray-400">Total Emails</div>
                                  </div>
                                  <div className="text-center bg-dark-700/30 p-3 rounded-lg">
                                    <div className="text-lg font-bold text-white capitalize">{results.hunter.intelligence.domainIntel.networkSize}</div>
                                    <div className="text-gray-400">Network Size</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Personal</span>
                                    <span className="text-white">{results.hunter.intelligence.domainIntel.personalEmails}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Generic</span>
                                    <span className="text-white">{results.hunter.intelligence.domainIntel.genericEmails}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Network Security */}
                          {results.hunter.intelligence.networkIntel && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-medium text-white flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-orange-400" />
                                Network Security
                              </h4>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Deliverable</span>
                                    <span className={`font-medium ${results.hunter.intelligence.networkIntel.deliverable ? 'text-green-400' : 'text-red-400'}`}>
                                      {results.hunter.intelligence.networkIntel.deliverable ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Status</span>
                                    <span className="text-white capitalize">{results.hunter.intelligence.networkIntel.status || 'unknown'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Risk Level</span>
                                    <span className={`font-medium capitalize ${
                                      results.hunter.intelligence.networkIntel.riskLevel === 'high' ? 'text-red-400' :
                                      results.hunter.intelligence.networkIntel.riskLevel === 'medium' ? 'text-yellow-400' :
                                      'text-green-400'
                                    }`}>
                                      {results.hunter.intelligence.networkIntel.riskLevel}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Public Sources</span>
                                    <span className="text-white">{results.hunter.intelligence.networkIntel.sources}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Webmail</span>
                                    <span className="text-white">{results.hunter.intelligence.networkIntel.isWebmail ? 'Yes' : 'No'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Disposable</span>
                                    <span className="text-white">{results.hunter.intelligence.networkIntel.isDisposable ? 'Yes' : 'No'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Gravatar Results */}
                    {results.gravatar && results.gravatar.hasProfile && (
                      <div className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <Image className="w-5 h-5 text-purple-400" />
                          <h3 className="text-xl font-semibold text-white">Gravatar Profile</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-lg font-medium text-white mb-4">Profile Information</h4>
                            {results.gravatar.profile && (
                              <div className="space-y-3">
                                {Object.entries(results.gravatar.profile)
                                  .filter(([key]) => !['deprecation_notice', 'error', 'warning', 'notice'].includes(key.toLowerCase()))
                                  .slice(0, 8).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-start py-2 border-b border-dark-700/50">
                                    <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                                    <span className="text-white text-right max-w-xs truncate">
                                      {formatComplexValue(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            {results.gravatar.avatarUrl && (
                              <div className="text-center">
                                <h4 className="text-lg font-medium text-white mb-4">Avatar</h4>
                                <img 
                                  src={results.gravatar.avatarUrl} 
                                  alt="Gravatar"
                                  className="w-32 h-32 rounded-full mx-auto border-2 border-dark-600"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Social Media Correlation */}
                    {results.usernameCorrelation?.socialMediaResults?.results && 
                     renderSocialProfiles(results.usernameCorrelation.socialMediaResults.results)}

                    {/* Email Analysis */}
                    {results.analysis && (
                      <div className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <Hash className="w-5 h-5 text-cyan-400" />
                          <h3 className="text-xl font-semibold text-white">Technical Analysis</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-lg font-medium text-white mb-4">Domain Analysis</h4>
                            {results.analysis.domainAnalysis && (
                              <div className="space-y-3">
                                {Object.entries(results.analysis.domainAnalysis)
                                  .filter(([key]) => !['deprecation_notice', 'error', 'warning', 'notice'].includes(key.toLowerCase()))
                                  .slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center py-2 border-b border-dark-700/50">
                                    <span className="text-gray-400 capitalize text-sm">{key.replace('_', ' ')}</span>
                                    <span className="text-white text-sm font-medium">
                                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : formatComplexValue(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-lg font-medium text-white mb-4">Username Analysis</h4>
                            {results.analysis.usernameAnalysis && (
                              <div className="space-y-3">
                                {Object.entries(results.analysis.usernameAnalysis)
                                  .filter(([key]) => !['deprecation_notice', 'error', 'warning', 'notice'].includes(key.toLowerCase()))
                                  .slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center py-2 border-b border-dark-700/50">
                                    <span className="text-gray-400 capitalize text-sm">{key.replace('_', ' ')}</span>
                                    <span className="text-white text-sm font-medium">
                                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : formatComplexValue(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-lg font-medium text-white mb-4">Risk Assessment</h4>
                            {results.analysis.riskAssessment && (
                              <div className="space-y-3">
                                {Object.entries(results.analysis.riskAssessment)
                                  .filter(([key]) => !['deprecation_notice', 'error', 'warning', 'notice'].includes(key.toLowerCase()))
                                  .slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center py-2 border-b border-dark-700/50">
                                    <span className="text-gray-400 capitalize text-sm">{key.replace('_', ' ')}</span>
                                    <span className="text-white text-sm font-medium">
                                      {formatComplexValue(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isDomainLookup ? (
                  renderDomainResults(results)
                ) : isIPLookup ? (
                  renderIPResults(results)
                ) : isUsernameLookup ? (
                  renderUsernameResults(results)
                ) : (
                  <div className="space-y-8">
                    {results && Object.keys(results).length > 0 ? (
                      Object.entries(results)
                        .filter(([serviceName, data]) => {
                          if (serviceName === 'username' || serviceName === 'success') return false
                          if (serviceName === 'errors' && Array.isArray(data) && data.length === 0) return false
                          return true
                        })
                        .map(([serviceName, data]) => {
                          // Handle social media profiles
                          if ((serviceName === 'results' || serviceName === 'profiles') && Array.isArray(data)) {
                            return renderSocialProfiles(data)
                          }
                          
                          // Handle username correlation
                          if (serviceName === 'usernameCorrelation' && data?.socialMediaResults?.results) {
                            return renderSocialProfiles(data.socialMediaResults.results)
                          }
                          
                          return (
                            <motion.div
                              key={serviceName}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-dark-800/50 border border-dark-600/50 rounded-xl p-6"
                            >
                              <div className="flex items-center space-x-3 mb-4">
                                <Globe className="w-5 h-5 text-primary-400" />
                                <h3 className="text-xl font-semibold text-white capitalize">
                                  {serviceName.replace('_', ' ')} Results
                                </h3>
                              </div>
                              
                              <pre className="text-sm text-gray-300 overflow-auto bg-dark-900/50 p-4 rounded-lg">
                                {JSON.stringify(data, null, 2)}
                              </pre>
                            </motion.div>
                          )
                        })
                    ) : (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-6">🔍</div>
                        <h3 className="text-2xl font-semibold text-white mb-3">No Results Found</h3>
                        <p className="text-gray-400 text-lg">Try a different search term or check your spelling.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ResultsModal
