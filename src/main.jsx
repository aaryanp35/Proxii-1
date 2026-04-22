import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
