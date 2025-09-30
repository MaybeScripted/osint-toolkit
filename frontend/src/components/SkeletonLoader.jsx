import { motion } from 'framer-motion'

const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-dark-700 rounded"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
          }}
        />
      ))}
    </div>
  )
}

export const CardSkeleton = () => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 bg-dark-700 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-dark-700 rounded w-32 animate-pulse" />
            <div className="h-4 bg-dark-700 rounded w-24 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="card-content">
        <SkeletonLoader lines={4} />
      </div>
    </div>
  )
}

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <div className="h-4 bg-dark-700 rounded flex-1 animate-pulse" />
          <div className="h-4 bg-dark-700 rounded w-24 animate-pulse" />
          <div className="h-4 bg-dark-700 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default SkeletonLoader
