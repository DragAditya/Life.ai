import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

// ⭐ Add this import
import { ToastProvider } from '@radix-ui/react-toast'  // or wherever your ToastProvider is

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ⭐ Wrap App inside ToastProvider */}
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
)
