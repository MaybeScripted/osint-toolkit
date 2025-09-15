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
