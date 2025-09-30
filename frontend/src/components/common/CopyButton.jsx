import { Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '../../utils/clipboard';

const CopyButton = ({ text, className = '', size = 'w-4 h-4' }) => {
  const handleCopy = async () => {
    const result = await copyToClipboard(text);
    if (result.success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors ${className}`}
      title="Copy to clipboard"
    >
      <Copy className={size} />
    </button>
  );
};

export default CopyButton;
