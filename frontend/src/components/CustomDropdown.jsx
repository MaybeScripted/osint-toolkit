import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  className = '',
  disabled = false,
  showCheckmark = true
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // this is for closing the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // this is for handling the keyboard navigation. linux :)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        setIsOpen(false)
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const currentIndex = options.findIndex(opt => opt.value === value)
        let newIndex = currentIndex

        if (event.key === 'ArrowDown') {
          newIndex = (currentIndex + 1) % options.length
        } else {
          newIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1
        }

        onChange(options[newIndex].value)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, options, value, onChange])

  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 bg-dark-800/60 backdrop-blur-sm border rounded-lg text-left
          focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-transparent
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-primary-400/50 ring-1 ring-primary-400/30' : 'border-dark-600/50'}
          ${disabled ? 'cursor-not-allowed' : 'hover:border-dark-500 cursor-pointer'}
          shadow-sm hover:shadow-md
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <span className={`truncate ${!selectedOption ? 'text-dark-300' : 'text-dark-100'}`}>
            {displayValue}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-dark-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-dark-800/95 backdrop-blur-md border border-dark-600/50 rounded-lg shadow-lg max-h-60 overflow-auto dropdown-enter-active"
          role="listbox"
          aria-label={label || placeholder}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <div
                key={option.value}
                className={`
                  px-4 py-3 cursor-pointer transition-colors duration-150
                  ${isSelected
                    ? 'bg-primary-400/20 border-l-2 border-primary-400 text-white'
                    : 'text-dark-100 hover:bg-dark-700/50 hover:text-white'
                  }
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                `}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{option.label}</span>
                  {showCheckmark && isSelected && (
                    <Check className="w-4 h-4 text-primary-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomDropdown
