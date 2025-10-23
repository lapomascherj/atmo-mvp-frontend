import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// CRITICAL: StrictMode disabled - was causing double-mounting and infinite reload loops
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)


