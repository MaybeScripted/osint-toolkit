import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const ToolModal = ({ isOpen, onClose, title, children, icon: Icon, maxWidth = 'max-w-6xl' }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`bg-dark-900 border border-dark-600 rounded-lg w-full ${maxWidth} max-h-[90vh] overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-dark-600">
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="w-6 h-6 text-primary-400" />}
              <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ToolModal
