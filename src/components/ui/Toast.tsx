import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 flex-shrink-0" />;
      case 'info':
        return <Info className="h-5 w-5 flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 flex-shrink-0" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-400',
          text: 'text-green-800',
          button: 'text-green-500 hover:text-green-600'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-400',
          text: 'text-red-800',
          button: 'text-red-500 hover:text-red-600'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-400',
          text: 'text-yellow-800',
          button: 'text-yellow-500 hover:text-yellow-600'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-400',
          text: 'text-blue-800',
          button: 'text-blue-500 hover:text-blue-600'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-400',
          text: 'text-blue-800',
          button: 'text-blue-500 hover:text-blue-600'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`
      w-full max-w-lg min-w-80 
      ${styles.container} 
      border rounded-lg shadow-lg 
      pointer-events-auto 
      transform transition-all duration-300 ease-in-out
      animate-slide-in-right
    `}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={styles.icon}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-5 ${styles.text}`}>
                {toast.message}
              </p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              className={`
                inline-flex rounded-md p-1.5 
                ${styles.button}
                hover:bg-white hover:bg-opacity-20
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current
                transition-colors duration-200
              `}
              onClick={() => onRemove(toast.id)}
            >
              <span className="sr-only">Fechar</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;