import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { KitProvider } from './kit'
import { KIT_CONFIG } from '../kit.config'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KitProvider config={KIT_CONFIG}>
      <App />
    </KitProvider>
    <Analytics />
  </StrictMode>,
)
