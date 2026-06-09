import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
  isStandalone?: boolean;
}

export default function Toast({ message, type, onClose, duration = 3000, isStandalone = false }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div className={`${isStandalone ? 'fixed top-6 right-6 z-[9999]' : 'relative'} animate-toast-in`}>
      <div 
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg border text-sm font-semibold transition-all ${
          isSuccess 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}
      >
        <div className={isSuccess ? 'text-emerald-500' : 'text-rose-500'}>
          {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        </div>
        
        <span className="flex-grow pr-2">{message}</span>
        
        <button 
          onClick={onClose}
          className={`p-0.5 rounded-lg hover:bg-black/5 transition-colors ${
            isSuccess ? 'text-emerald-600 hover:text-emerald-800' : 'text-rose-600 hover:text-rose-800'
          }`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
