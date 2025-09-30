import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const StatusIcon = ({ status, size = 'w-6 h-6', className = '' }) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
      case 'low':
      case 'secure':
        return <CheckCircle className={`${size} text-green-400 ${className}`} />;
      case 'warning':
      case 'medium':
        return <AlertTriangle className={`${size} text-yellow-400 ${className}`} />;
      case 'error':
      case 'high':
      case 'insecure':
        return <XCircle className={`${size} text-red-400 ${className}`} />;
      default:
        return <Info className={`${size} text-gray-400 ${className}`} />;
    }
  };

  return getIcon();
};

export default StatusIcon;
