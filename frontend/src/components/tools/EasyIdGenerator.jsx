import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Users,
  Key,
  Copy,
  Download,
  RefreshCw,
  Settings,
  Globe,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import CustomDropdown from '../CustomDropdown'

const EasyIdGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedData, setGeneratedData] = useState([])
  const [dataType, setDataType] = useState('person')
  const [count, setCount] = useState(1)
  const [locale, setLocale] = useState('en')
  const [seed, setSeed] = useState('')
  const [usedSeed, setUsedSeed] = useState('')
  const [includeSensitive, setIncludeSensitive] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)
  const [availableLocales, setAvailableLocales] = useState([])
  const [availableTypes, setAvailableTypes] = useState([])

  // Data type configs
  const dataTypeConfig = {
    person: { icon: User, color: 'text-blue-400', name: 'Person Profile' },
    contact: { icon: Mail, color: 'text-green-400', name: 'Contact Info' },
    email: { icon: Mail, color: 'text-purple-400', name: 'Email Addresses' },
    username: { icon: Users, color: 'text-pink-400', name: 'Usernames' },
    address: { icon: MapPin, color: 'text-orange-400', name: 'Addresses' },
    company: { icon: Building, color: 'text-cyan-400', name: 'Companies' },
    creditcard: { icon: CreditCard, color: 'text-red-400', name: 'Credit Cards' },
    social: { icon: Users, color: 'text-indigo-400', name: 'Social Profiles' },
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
        seed: effectiveSeed
      }

      const response = await api.generateEasyIdData(params)
      
      if (response.success) {
        setGeneratedData(response.data.results)
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
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

  // all this does is formats value based on key: pretty-prints address, credit card, bank, bitcoin, else JSON for objects, string for primitives.
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
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  const renderPersonData = (item, index) => {
    const config = dataTypeConfig[dataType]
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
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
              className="btn-ghost p-3"
              title="Copy all data"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-white font-medium text-base mb-4 text-blue-400">Personal Information</h4>
            {['firstName', 'lastName', 'fullName', 'age', 'birthDate', 'gender'].map(key => {
              if (!item[key]) return null
              return (
                <div key={key} className="flex items-start space-x-4">
                  <span className="text-dark-400 text-base font-medium min-w-[100px] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-base">{item[key]}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* contact info */}
          <div className="space-y-4">
            <h4 className="text-white font-medium text-base mb-4 text-green-400">Contact Information</h4>
            {['email', 'phone', 'mobile', 'website'].map(key => {
              if (!item[key]) return null
              return (
                <div key={key} className="flex items-start space-x-4">
                  <span className="text-dark-400 text-base font-medium min-w-[100px] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-white text-base break-all">{item[key]}</span>
                      <button
                        onClick={() => copyToClipboard(item[key])}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
                        title="Copy value"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* address thingy */}
          {item.address && (
            <div className="space-y-4 md:col-span-2">
              <h4 className="text-white font-medium text-base mb-4 text-purple-400">Address</h4>
              <div className="flex items-start space-x-4">
                <span className="text-dark-400 text-base font-medium min-w-[100px]">Address:</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-white text-base">{formatValue(item.address, 'address')}</span>
                    <button
                      onClick={() => copyToClipboard(formatValue(item.address, 'address'))}
                      className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
                      title="Copy address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* professional info */}
          <div className="space-y-4">
            <h4 className="text-white font-medium text-base mb-4 text-orange-400">Professional</h4>
            {['jobTitle', 'company', 'department'].map(key => {
              if (!item[key]) return null
              return (
                <div key={key} className="flex items-start space-x-4">
                  <span className="text-dark-400 text-base font-medium min-w-[100px] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-base">{item[key]}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* online presence, so like their username and avatar */}
          <div className="space-y-4">
            <h4 className="text-white font-medium text-base mb-4 text-cyan-400">Online Presence</h4>
            {['username', 'avatar'].map(key => {
              if (!item[key]) return null
              return (
                <div key={key} className="flex items-start space-x-4">
                  <span className="text-dark-400 text-base font-medium min-w-[100px] capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {key === 'avatar' && item[key] ? (
                        <div className="flex items-center space-x-3">
                          <img src={item[key]} alt="Avatar" className="w-10 h-10 rounded-full" />
                          <span className="text-white text-base break-all">{item[key]}</span>
                        </div>
                      ) : (
                        <span className="text-white text-base break-all">{item[key]}</span>
                      )}
                      <button
                        onClick={() => copyToClipboard(item[key])}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
                        title="Copy value"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* banking and crypto etc bs, so like their credit card, bank account, and bitcoin */}
          {includeSensitive && (item.creditCard || item.bankAccount || item.bitcoin) && (
            <div className="space-y-4 md:col-span-2">
              <h4 className="text-white font-medium text-base mb-4 text-red-400">Financial Data</h4>
              {['creditCard', 'bankAccount', 'routingNumber', 'iban', 'bitcoin'].map(key => {
                if (!item[key]) return null
                const isSensitive = ['creditCard', 'bankAccount', 'bitcoin'].includes(key)
                const shouldHide = isSensitive && !showSensitive
                
                return (
                  <div key={key} className="flex items-start space-x-4">
                    <span className="text-dark-400 text-base font-medium min-w-[100px] capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <div className="flex-1 min-w-0">
                      {shouldHide ? (
                        <div className="flex items-center space-x-3">
                          <span className="text-dark-500">••••••••</span>
                  <button
                            onClick={() => setShowSensitive(!showSensitive)}
                    className="btn-ghost px-3 py-2"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className="text-white text-base break-all">
                            {formatValue(item[key], key)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(formatValue(item[key], key))}
                            className="btn-ghost px-3 py-2"
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
          )}
        </div>
      </motion.div>
    )
  }
  const renderDataItem = (item, index) => {
    // and use special renderer for person data
    if (dataType === 'person') {
      return renderPersonData(item, index)
    }

    const config = dataTypeConfig[dataType]
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
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
              <Copy className="w-5 h-5" />
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
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
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
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
        <div className="flex items-center gap-8">
          <label className="flex items-center space-x-3 text-white">
            <input
              type="checkbox"
              checked={includeSensitive}
              onChange={(e) => setIncludeSensitive(e.target.checked)}
              className="rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500 w-5 h-5"
            />
            <span className="text-base">Include financial data (cards/banking/crypto)</span>
          </label>

          {/* Removed secondary show toggle; use header toggle instead */}

          {generatedData.length > 0 && (
            <div className="ml-auto flex space-x-3">
              <button
                onClick={downloadData}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download JSON</span>
              </button>
              <button
                onClick={downloadCsv}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download CSV</span>
              </button>
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
            Choose your settings and click generate to create fake data
          </p>
        </div>
      )}
    </div>
  )
}

export default EasyIdGenerator
