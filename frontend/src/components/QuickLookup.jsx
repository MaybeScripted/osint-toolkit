import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Search, Mail, User, Phone, Globe, MapPin, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'
import ResultsModal from './ResultsModal'

const QuickLookup = () => {
  const [formData, setFormData] = useState({
    query: '',
    type: 'email'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const searchTypes = [
    { value: 'email', label: 'Email', icon: Mail, description: 'Search email addresses' },
    { value: 'username', label: 'Username', icon: User, description: 'Find social media profiles' },


    { value: 'ip', label: 'IP Address', icon: MapPin, description: 'Get IP geolocation & reputation' },
    { value: 'domain', label: 'Domain', icon: Globe, description: 'DNS, WHOIS & SSL certificate info' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.query.trim()) {
      toast.error('Please enter something to search')
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      let response
      const query = formData.query.trim()

      // figure out what the hell the user wants (email, username, ip, domain, whatever)
      // then call the damn API for it. simple as that.
      switch (formData.type) {
        case 'email':
          response = await api.lookupEmail(query)
          break
        case 'username':
          response = await api.lookupUsername(query)
          break
        case 'ip':
          response = await api.lookupIP(query)
          break
        case 'domain':
          response = await api.lookupDomain(query)
          break
        default:
          throw new Error('Invalid search type')
      }

      if (response.success) {
        setResults(response.data)
        setShowModal(true)
        
        let totalResults = 0
        Object.values(response.data).forEach(data => {
          if (Array.isArray(data)) {
            totalResults += data.length
          } else if (typeof data === 'object' && data !== null) {
            totalResults += Object.keys(data).length
          } else {
            totalResults += 1
          }
        })
        
        toast.success(`Found ${totalResults} result(s)! Opening detailed view...`)
      } else {
        toast.error(response.error?.message || 'Lookup failed')
        setResults(null)
      }
    } catch (error) {
      console.error('Error during lookup:', error)
      toast.error('Lookup failed. Please check your connection.')
      setResults(null)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedType = searchTypes.find(type => type.value === formData.type)

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-green-600/10 text-green-400 px-4 py-2 rounded-full border border-green-500/20 mb-4">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">Quick Lookup • 100% Free</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">OSINT Lookup</h2>
        <p className="text-dark-300">
          Get results using free APIs
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-3">
                Lookup Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {searchTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                        formData.type === type.value
                          ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                          : 'border-dark-600 bg-dark-800/30 text-dark-300 hover:border-dark-500'
                      }`}
                      disabled={isLoading}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Search Query */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                {selectedType?.label} to Lookup
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  placeholder={`Enter ${selectedType?.label.toLowerCase()}...`}
                  className="input-field pl-12"
                  disabled={isLoading}
                />
                {selectedType && (
                  <selectedType.icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.query.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {formData.type === 'username' 
                      ? 'Searching hundreds of platforms...' 
                      : 'Looking up...'}
                  </span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Quick Lookup</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Results Modal */}
      <ResultsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        results={results}
        query={formData.query}
        queryType={formData.type}
      />
    </div>
  )
}

export default QuickLookup
