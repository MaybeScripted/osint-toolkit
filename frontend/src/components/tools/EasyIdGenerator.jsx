import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Users,
  Key,
  Copy,
  Download,
  RefreshCw,
  Hash,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import CustomDropdown from '../CustomDropdown'

// Constants
const ANIMATION_DURATION = 0.3
const ANIMATION_DELAY_STEP = 0.1
const MAX_COUNT = 100
const MIN_COUNT = 1
const DEFAULT_COUNT = 1


const EasyIdGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedData, setGeneratedData] = useState([])
  const [dataType, setDataType] = useState('person')
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [locale, setLocale] = useState('en')
  const [seed, setSeed] = useState('')
  const [usedSeed, setUsedSeed] = useState('')
  const [includeSensitive, setIncludeSensitive] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)
  const [useIpForLocation, setUseIpForLocation] = useState(false)
  const [availableLocales, setAvailableLocales] = useState([])
  const [availableTypes, setAvailableTypes] = useState([])
  const [loadingAvatars, setLoadingAvatars] = useState(new Set())

  // Data type configs
  const dataTypeConfig = {
    person: { icon: User, color: 'text-blue-400', name: 'Person Profile' },
    contact: { icon: Mail, color: 'text-green-400', name: 'Contact Info' },
    email: { icon: Mail, color: 'text-purple-400', name: 'Email Addresses' },
    username: { icon: Users, color: 'text-pink-400', name: 'Usernames' },
    address: { icon: MapPin, color: 'text-orange-400', name: 'Addresses' },
    company: { icon: Building, color: 'text-cyan-400', name: 'Companies' },
    creditcard: { icon: CreditCard, color: 'text-red-400', name: 'Credit Cards' },
    basic_opsec: { icon: Users, color: 'text-indigo-400', name: 'Basic Opsec' },
    apikey: { icon: Key, color: 'text-yellow-400', name: 'API Keys' }
  }

  useEffect(() => {
    fetchLocales()
    fetchTypes()
  }, [])

  const fetchLocales = async () => {
    try {
      const response = await api.getEasyIdLocales()
      if (response.success) {
        setAvailableLocales(response.data.locales)
      }
    } catch (error) {
      console.error('Failed to fetch locales:', error)
    }
  }

  const fetchTypes = async () => {
    try {
      const response = await api.getEasyIdTypes()
      if (response.success) {
        setAvailableTypes(response.data.types)
      }
    } catch (error) {
      console.error('Failed to fetch types:', error)
    }
  }

  const generateData = async () => {
    setIsGenerating(true)
    try {
      // auto-generate a seed if none provided to make results reproducible
      const effectiveSeed = seed === '' ? String(Math.floor(Math.random() * 1_000_000_000)) : seed
      // making sure it doesnt inject the generated seed into the input; only track it for display
      setUsedSeed(effectiveSeed)

      const params = {
        type: dataType,
        count: count.toString(),
        locale,
        includeSensitive: includeSensitive.toString(),
        seed: effectiveSeed,
        ...(dataType === 'basic_opsec' && useIpForLocation && { useIpForLocation: 'true' })
      }

      const response = await api.generateEasyIdData(params)
      
      if (response.success) {
        setGeneratedData(response.data.results)
        // Track loading avatars for new data
        const avatarUrls = response.data.results
          .map((item, index) => item.avatar ? `${index}-${item.avatar}` : null)
          .filter(Boolean)
        setLoadingAvatars(new Set(avatarUrls))
        toast.success(`Generated ${response.data.count} ${dataType} records!`)
      } else {
        throw new Error(response.error?.message || 'Generation failed')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate data')
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper functions
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const formatFieldName = (key) => {
    return key.replace(/([A-Z])/g, ' $1').trim()
  }

  const getAnimationDelay = (index) => {
    return index * ANIMATION_DELAY_STEP
  }


  const downloadData = () => {
    if (!generatedData || generatedData.length === 0) {
      toast.error('No data to download')
      return
    }
    const dataStr = JSON.stringify(generatedData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `easy-id-${dataType}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    // ehumm. defer cleanup to avoid zero-byte downloads in some browsers
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 0)
    toast.success('JSON downloaded!')
  }

  // dont mind me, just flattening the object to make it easier to download as csv
  const flattenObject = (obj, prefix = '', res = {}) => {
    if (obj === null || obj === undefined) return res
    if (typeof obj !== 'object') {
      res[prefix.slice(0, -1)] = obj
      return res
    }
    Object.keys(obj).forEach((key) => {
      const value = obj[key]
      const nextPrefix = prefix ? `${prefix}${key}.` : `${key}.`
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        flattenObject(value, nextPrefix, res)
      } else {
        res[nextPrefix.slice(0, -1)] = Array.isArray(value) ? JSON.stringify(value) : value
      }
    })
    return res
  }

  const toCsv = (rows) => {
    if (!rows || rows.length === 0) return ''
    // main area, building the columns for the csv. hello there
    const columnsSet = new Set()
    const flatRows = rows.map((r) => flattenObject(r))
    flatRows.forEach((r) => Object.keys(r).forEach((k) => columnsSet.add(k)))
    const columns = Array.from(columnsSet)

    const escape = (val) => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const header = columns.map(escape).join(',')
    const body = flatRows
      .map((r) => columns.map((c) => escape(c in r ? r[c] : '')).join(','))
      .join('\n')
    return header + '\n' + body
  }

  const downloadCsv = () => {
    if (!generatedData || generatedData.length === 0) {
      toast.error('No data to download')
      return
    }
    const csv = toCsv(generatedData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `easy-id-${dataType}-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 0)
    toast.success('CSV downloaded!')
  }


  // Enhanced value formatter with social platforms support
  const formatValue = (value, key) => {
    if (typeof value === 'object' && value !== null) {
      if (key === 'address' && value.street && value.city)
        return `${value.street}, ${value.city}, ${value.state} ${value.zipCode}, ${value.country}`
      if (key === 'creditCard' && value.number)
        return `${value.type}: ${value.number} (Exp: ${value.expiry})`
      if (key === 'bankAccount' && value.account)
        return `Account: ${value.account}`
      if (key === 'bitcoin' && value.address)
        return `Bitcoin: ${value.address}`
      if (key === 'platforms' && typeof value === 'object') {
        // Format social platforms as a readable list
        return Object.entries(value)
          .map(([platform, data]) => `${data.platform}: ${data.displayName}`)
          .join(', ')
      }
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  const renderSocialData = (item, index) => {
    const config = dataTypeConfig[dataType]
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION_DURATION, delay: getAnimationDelay(index) }}
        className="card-content bg-dark-800/50 border border-dark-600 rounded-lg p-7 hover:border-dark-500 transition-colors"
      >
        <div className="flex items-start justify-between mb-7">
          <div className="flex items-center space-x-4">
            <config.icon className={`w-8 h-8 ${config.color}`} />
            <span className="text-white font-semibold text-xl">#{index + 1}</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => copyToClipboard(JSON.stringify(item, null, 2))}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
              title="Copy all data"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-8 p-4 sm:p-6 bg-dark-800/30 rounded-lg border border-dark-600">
          {/* Avatar */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            {item.avatar ? (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                {loadingAvatars.has(`${index}-${item.avatar}`) && (
                  <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dark-600 bg-dark-700 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400 animate-spin" />
                  </div>
                )}
                <img
                  src={item.avatar}
                  alt="Profile Avatar"
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dark-600 object-cover ${loadingAvatars.has(`${index}-${item.avatar}`) ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                  onLoad={() => {
                    setLoadingAvatars(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(`${index}-${item.avatar}`)
                      return newSet
                    })
                  }}
                  onError={(e) => {
                    setLoadingAvatars(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(`${index}-${item.avatar}`)
                      return newSet
                    })
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dark-600 bg-dark-700 flex items-center justify-center text-dark-400 text-sm">
                  Avatar
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dark-600 bg-dark-700 flex items-center justify-center text-dark-400 text-sm">
                No Avatar
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="text-center sm:text-left min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 break-words">{item.displayName || 'Unknown'}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-dark-300">
                  <span className="flex items-center justify-center sm:justify-start space-x-1 min-w-0">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="break-words text-xs sm:text-sm lg:text-base">@{item.username || 'unknown'}</span>
                  </span>
                  <span className="flex items-center justify-center sm:justify-start space-x-1 min-w-0">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="break-words text-xs sm:text-sm lg:text-base">{item.location || 'Unknown'}</span>
                  </span>
                  <span className="flex items-center justify-center sm:justify-start space-x-1">
                    <span className="text-dark-400 text-xs sm:text-sm lg:text-base">Age:</span>
                    <span className="text-xs sm:text-sm lg:text-base">{item.age || 'Unknown'}</span>
                  </span>
                  <span className="flex items-center justify-center sm:justify-start space-x-1">
                    <span className="text-dark-400 text-xs sm:text-sm lg:text-base">Joined:</span>
                    <span className="text-xs sm:text-sm lg:text-base">{item.joinYear || 'Unknown'}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(JSON.stringify(item, null, 2))}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors self-center sm:self-start flex-shrink-0"
                title="Copy all data"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Personality & Traits */}
          <div className="space-y-4 lg:space-y-6">
            <h4 className="font-semibold text-base lg:text-lg text-indigo-400 border-b border-indigo-500/30 pb-2">Personality & Traits</h4>
            
            {item.personalityTags && Array.isArray(item.personalityTags) && (
              <div className="space-y-3">
                <h5 className="text-dark-300 font-medium text-sm lg:text-base">Personality Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {item.personalityTags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-2 lg:px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs lg:text-sm rounded-full border border-indigo-500/30">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.languagePreferences && typeof item.languagePreferences === 'object' && (
              <div className="space-y-3">
                <h5 className="text-dark-300 font-medium text-sm lg:text-base">Language Preferences</h5>
                <div className="space-y-2 p-3 lg:p-4 bg-dark-800/50 rounded-lg border border-dark-600">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="text-white font-medium text-sm lg:text-base break-words">{item.languagePreferences.primary}</span>
                    <span className="text-dark-400 text-xs lg:text-sm flex-shrink-0">{item.languagePreferences.proficiency}</span>
                  </div>
                  {item.languagePreferences.secondary && item.languagePreferences.secondary.length > 0 && (
                    <div className="text-dark-300 text-xs lg:text-sm break-words">
                      <span className="text-dark-400">Also speaks: </span>
                      <span className="break-words">{item.languagePreferences.secondary.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Technical Details */}
          <div className="space-y-4 lg:space-y-6">
            <h4 className="font-semibold text-base lg:text-lg text-cyan-400 border-b border-cyan-500/30 pb-2">Technical Details</h4>
            
            {item.ipInfo && typeof item.ipInfo === 'object' && (
              <div className="space-y-3">
                <h5 className="text-dark-300 font-medium text-sm lg:text-base">IP Information</h5>
                <div className="space-y-3 p-3 lg:p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="text-orange-400 font-medium text-sm lg:text-base flex-shrink-0">Your IP:</span>
                    <span className="font-mono text-white text-xs lg:text-sm break-all min-w-0">{item.ipInfo.ip}</span>
                  </div>
                  <div className="text-white text-xs lg:text-sm break-words">
                    <span className="text-orange-400">Detected Location: </span>
                    <span className="break-words">{item.ipInfo.detectedLocation}</span>
                  </div>
                  {item.ipInfo.detectedLocale && (
                    <div className="text-white text-xs lg:text-sm break-words">
                      <span className="text-orange-400">Detected Language: </span>
                      <span className="break-words">{item.ipInfo.detectedLocale.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="text-orange-300 text-xs italic pt-2 border-t border-orange-500/20 break-words">
                    {item.ipInfo.note}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="space-y-3">
              <h5 className="text-dark-300 font-medium text-sm lg:text-base">Additional Information</h5>
              <div className="space-y-2 p-3 lg:p-4 bg-dark-800/50 rounded-lg border border-dark-600">
                {item.username && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="text-dark-400 text-sm lg:text-base flex-shrink-0">Username:</span>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-white font-mono text-xs lg:text-sm break-all">{item.username}</span>
                      <button
                        onClick={() => copyToClipboard(item.username)}
                        className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors flex-shrink-0"
                        title="Copy username"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {item.location && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="text-dark-400 text-sm lg:text-base flex-shrink-0">Location:</span>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-white text-xs lg:text-sm break-words">{item.location}</span>
                      <button
                        onClick={() => copyToClipboard(item.location)}
                        className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors flex-shrink-0"
                        title="Copy location"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {item.age && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="text-dark-400 text-sm lg:text-base flex-shrink-0">Age:</span>
                    <span className="text-white text-xs lg:text-sm break-words">{item.age} years old</span>
                  </div>
                )}
                {item.joinYear && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="text-dark-400 text-sm lg:text-base flex-shrink-0">Join Year:</span>
                    <span className="text-white text-xs lg:text-sm break-words">{item.joinYear}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }



  const renderDataItem = (item, index) => {
    // Use special renderer only for basic_opsec
    if (dataType === 'basic_opsec') {
      return renderSocialData(item, index)
    }

    const config = dataTypeConfig[dataType]
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION_DURATION, delay: getAnimationDelay(index) }}
        className="card-content bg-dark-800/50 border border-dark-600 rounded-lg p-5 hover:border-dark-500 transition-colors"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <config.icon className={`w-6 h-6 ${config.color}`} />
            <span className="text-white font-medium text-lg">#{index + 1}</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => copyToClipboard(JSON.stringify(item, null, 2))}
              className="btn-ghost p-2.5"
              title="Copy all data"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(item).map(([key, value]) => {
            const isSensitive = ['creditCard', 'bankAccount', 'bitcoin', 'cvv', 'number'].includes(key)
            const shouldHide = isSensitive && !showSensitive
            
            return (
              <div key={key} className="flex items-start space-x-4">
                <span className="text-dark-400 text-base font-medium min-w-[120px] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <div className="flex-1 min-w-0">
                  {shouldHide ? (
                    <div className="flex items-center space-x-3">
                      <span className="text-dark-500">••••••••</span>
                      <button
                        onClick={() => setShowSensitive(!showSensitive)}
                        className="text-dark-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className="text-white text-base break-all">
                        {formatValue(value, key)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(formatValue(value, key))}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy value"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Controls */}
      <div className="card mb-8 hover:lift anim-enter">
        <div className="card-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5">
          {/* Data Type */}
          <div>
            <CustomDropdown
              label="Data Type"
              value={dataType}
              onChange={setDataType}
              options={availableTypes.map((type) => ({
                value: type.name,
                label: type.name.charAt(0).toUpperCase() + type.name.slice(1)
              }))}
              placeholder="Select data type..."
            />
          </div>

          {/* Count */}
          <div>
            <label className="block text-base font-medium text-white mb-3">
              Count
            </label>
            <input
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={count}
              onChange={(e) => setCount(Math.max(MIN_COUNT, Math.min(MAX_COUNT, parseInt(e.target.value) || DEFAULT_COUNT)))}
              className="input-field"
            />
          </div>

          {/* Seed (optional) */}
          <div>
            <label className="block text-base font-medium text-white mb-3">
              Seed (optional)
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="e.g. 1234"
              className="input-field"
            />
          </div>

          {/* Locale (segmented control) */}
          <div>
            <label className="block text-base font-medium text-white mb-3">
              Locale
            </label>
            <div className="flex bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
              {[
                { code: 'en', label: 'US' },
                { code: 'nl', label: 'NL' },
                { code: 'be', label: 'BE' }
              ].map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLocale(opt.code)}
                  className={`flex-1 px-4 py-3 text-base transition-colors ${
                    locale === opt.code
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-200 hover:bg-dark-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Fallback dropdown if API returns other locales */}
            {availableLocales.length > 0 && !['en','nl','be'].every(l => availableLocales.includes(l)) && (
              <div className="mt-3">
                <CustomDropdown
                  value={locale}
                  onChange={setLocale}
                  options={availableLocales.map((loc) => ({
                    value: loc,
                    label: loc.toUpperCase()
                  }))}
                  placeholder="Select locale..."
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateData}
              disabled={isGenerating}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>
        </div>

        {/* Inline Options */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <label className="flex items-start space-x-3 text-white">
            <input
              type="checkbox"
              checked={includeSensitive}
              onChange={(e) => setIncludeSensitive(e.target.checked)}
              className="rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500 w-5 h-5 flex-shrink-0 mt-0.5"
            />
            <span className="text-sm sm:text-base break-words">Include financial data (cards/banking/crypto)</span>
          </label>

          {/* IP-based location toggle - only show for Basic_Opsec */}
          {dataType === 'basic_opsec' && (
            <label className="flex items-start space-x-3 text-white">
              <input
                type="checkbox"
                checked={useIpForLocation}
                onChange={(e) => setUseIpForLocation(e.target.checked)}
                className="rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500 w-5 h-5 flex-shrink-0 mt-0.5"
              />
              <span className="text-sm sm:text-base break-words">Use IP for location generation</span>
            </label>
          )}

          {/* Removed secondary show toggle; use header toggle instead */}

          {generatedData.length > 0 && (
            <div className="w-full">
              {/* Adaptive Download Section - Always Visible */}
              <div className="flex flex-col space-y-3">
             {/* Download Header */}
             <div className="flex items-center justify-between">
               <h4 className="text-sm font-medium text-dark-300">Download Options</h4>
             </div>

                {/* Download Buttons - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <button
                    onClick={downloadData}
                    className="group flex items-center justify-center space-x-2 px-3 py-2.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg border border-dark-600 transition-all duration-200 hover:border-primary-500/50"
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">JSON</span>
                  </button>
                  
                  <button
                    onClick={downloadCsv}
                    className="group flex items-center justify-center space-x-2 px-3 py-2.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg border border-dark-600 transition-all duration-200 hover:border-primary-500/50"
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">CSV</span>
                  </button>
                  
                </div>

                {/* Quick Download All - Only on very small screens */}
                <div className="block sm:hidden">
                  <button
                 onClick={() => {
                   downloadData();
                   setTimeout(() => downloadCsv(), 100);
                 }}
                    className="group w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200"
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Download All Formats</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {generatedData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">
                Generated Data ({generatedData.length} items)
              </h3>
            <div className="flex items-center space-x-4">
              {includeSensitive && (
                <button
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="flex items-center space-x-3 text-dark-400 hover:text-white transition-colors"
                >
                  {showSensitive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  <span className="text-base">{showSensitive ? 'Hide' : 'Show'} Financial</span>
                </button>
              )}
              {usedSeed && (
                <div className="flex items-center space-x-3 text-dark-400">
                  <span className="text-sm md:text-base">Seed: <span className="text-white">{usedSeed}</span></span>
                  <button
                    onClick={() => copyToClipboard(usedSeed)}
                    className="btn-ghost px-3 py-2"
                    title="Copy seed"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            </div>

            <div className="space-y-4">
              {generatedData.map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  {renderDataItem(item, index)}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {generatedData.length === 0 && !isGenerating && (
        <div className="text-center py-16 anim-fade">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Hash className="w-10 h-10 text-dark-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-3">No data generated yet</h3>
          <p className="text-dark-400 text-base mb-4">
            {dataType === 'basic_opsec' 
              ? 'Generate OPSEC-friendly fake identities for anonymous social media presence'
              : 'Choose your settings and click generate to create fake data'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default EasyIdGenerator
