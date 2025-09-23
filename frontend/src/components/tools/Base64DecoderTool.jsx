import React, { useState } from 'react'
import { FileText, Copy, RotateCcw, Download, Upload, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

const Base64DecoderTool = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('decode') // 'encode' or 'decode' default is decode
  const [isValid, setIsValid] = useState(null)

  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)
    
    // so, if the mode is decode, we need to validate the input
    if (mode === 'decode') {
      validateBase64(value)
    } else {
      setIsValid(value.length > 0 ? true : null)
    }
  }

  const validateBase64 = (str) => {
    if (!str.trim()) {
      setIsValid(null)
      return
    }

    try {
      // so we just remove the whitespace and check if it's valid base64
      const cleanStr = str.replace(/\s/g, '')
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
      
      if (!base64Regex.test(cleanStr)) {
        setIsValid(false)
        return
      }

      // check if the length is valid (must be multiple of 4)
      if (cleanStr.length % 4 !== 0) {
        setIsValid(false)
        return
      }

      // try to decode to see if it's valid
      atob(cleanStr)
      setIsValid(true)
    } catch (error) {
      setIsValid(false)
    }
  }

  const handleEncode = () => {
    if (!input.trim()) {
      toast.error('Please enter text to encode')
      return
    }

    try {
      let encoded
      
      // trying a modern TextEncoder first, if it's not supported, we fallback to the old way (boo fuck you)
      if (typeof TextEncoder !== 'undefined') {
        const encoder = new TextEncoder()
        const data = encoder.encode(input)
        const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('')
        encoded = btoa(binaryString)
      } else {
        // fallback for older browsers (:sob:)
        encoded = btoa(unescape(encodeURIComponent(input)))
      }
      
      setOutput(encoded)
      toast.success('Text encoded successfully!')
    } catch (error) {
      toast.error('Failed to encode text')
      console.error('Encode error:', error)
    }
  }

  const handleDecode = () => {
    if (!input.trim()) {
      toast.error('Please enter Base64 string to decode')
      return
    }

    if (!isValid) {
      toast.error('Invalid Base64 string')
      return
    }

    try {
      const cleanInput = input.replace(/\s/g, '')
      const binaryString = atob(cleanInput)
      
      // using the standard approach for text decoding
      const decoded = decodeURIComponent(escape(binaryString))
      
      setOutput(decoded)
      toast.success('Base64 decoded successfully!')
    } catch (error) {
      // and if the standard approach fails, try direct conversion
      try {
        const cleanInput = input.replace(/\s/g, '')
        const binaryString = atob(cleanInput)
        setOutput(binaryString)
        toast.success('Base64 decoded successfully!')
      } catch (fallbackError) {
        toast.error('Failed to decode Base64 string')
        console.error('Decode error:', error)
      }
    }
  }

  const handleProcess = () => {
    if (mode === 'encode') {
      handleEncode()
    } else {
      handleDecode()
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setIsValid(null)
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      if (mode === 'encode') {
        setInput(content)
      } else {
        // and uh, for decode mode, we need to read as text and then convert to base64
        const base64 = btoa(unescape(encodeURIComponent(content)))
        setInput(base64)
        validateBase64(base64)
      }
    }

    if (mode === 'encode') {
      reader.readAsText(file)
    } else {
      reader.readAsText(file)
    }
  }

  const handleDownload = () => {
    if (!output) return

    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'encode' ? 'encoded.txt' : 'decoded.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('File downloaded!')
  }

  const getValidationIcon = () => {
    if (isValid === null) return null
    return isValid ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    )
  }

  const getValidationText = () => {
    if (isValid === null) return ''
    return isValid ? 'Valid Base64' : 'Invalid Base64'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* mode selection buttons, (self explanatory...) */}
      <div className="card mb-6 hover:lift anim-enter">
        <div className="card-content">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => {
              setMode('decode')
              setInput('')
              setOutput('')
              setIsValid(null)
            }}
            className={`${mode === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Decode Base64
          </button>
          <button
            onClick={() => {
              setMode('encode')
              setInput('')
              setOutput('')
              setIsValid(null)
            }}
            className={`${mode === 'encode' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Encode to Base64
          </button>
        </div>

        {/* input section, (well. also pretty self explanatory.) */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white">
                {mode === 'encode' ? 'Text to Encode' : 'Base64 String to Decode'}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.json,.xml,.html,.css,.js"
                />
                <label
                  htmlFor="file-upload"
                  className="btn-ghost cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </label>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={
                  mode === 'encode'
                    ? 'Enter text to encode to Base64...'
                    : 'Enter Base64 string to decode...'
                }
                className="input-field h-32 resize-none"
              />
              {mode === 'decode' && (
                <div className="absolute top-3 right-3 flex items-center space-x-2">
                  {getValidationIcon()}
                  <span className={`text-xs ${
                    isValid === true ? 'text-green-400' : 
                    isValid === false ? 'text-red-400' : 'text-dark-400'
                  }`}>
                    {getValidationText()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleProcess}
              disabled={!input.trim() || (mode === 'decode' && isValid === false)}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>{mode === 'encode' ? 'Encode' : 'Decode'}</span>
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* output section, (also pretty self explanatory.) */}
      {output && (
        <div className="card hover:lift anim-enter">
          <div className="card-content">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              {mode === 'encode' ? 'Encoded Base64' : 'Decoded Text'}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(output)}
                className="btn-ghost"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleDownload}
                className="btn-ghost"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
            <pre className="text-white text-sm whitespace-pre-wrap break-words font-mono">
              {output}
            </pre>
          </div>
          </div>
        </div>
      )}

      {/* Empty State. because its empty, and thus show a message to the user.*/}
      {!output && (
        <div className="text-center py-12 anim-fade">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {mode === 'encode' ? 'No encoding performed yet' : 'No decoding performed yet'}
          </h3>
          <p className="text-dark-400">
            {mode === 'encode' 
              ? 'Enter text above to encode it to Base64'
              : 'Enter a Base64 string above to decode it'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default Base64DecoderTool
