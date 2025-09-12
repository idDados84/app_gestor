import React from 'react';
import Toast, { ToastMessage } from './Toast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <>
      {/* Toast Container */}
      <div 
        className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none"
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={onRemoveToast}
          />
        ))}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .fixed.top-4.right-4 {
            top: 1rem;
            right: 1rem;
            left: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default ToastContainer;