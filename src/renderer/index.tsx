import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { HUD } from './components/HUD'
import './styles/globals.css'
import './styles/animations.css'

const isHud = window.location.hash.includes('hud')

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    {isHud ? <HUD /> : <App />}
  </StrictMode>
)
