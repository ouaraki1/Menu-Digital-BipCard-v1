import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }, []);

  const hideToast = () => setVisible(false);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
} 