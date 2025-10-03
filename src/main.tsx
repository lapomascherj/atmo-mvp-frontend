import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import TestApp from './TestApp'
import { initializePocketBase } from './lib/pocketbase'

// Initialize PocketBase connection
initializePocketBase();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)


