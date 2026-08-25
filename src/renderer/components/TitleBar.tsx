import { useCallback, type FC } from 'react'
import { Minus, Moon, Settings, Square, Sun, X } from 'lucide-react'
import appIcon from '../assets/macrokey-icon.png'
import type { AppTheme } from '../../shared/types'

interface TitleBarProps {
  theme: AppTheme
  onToggleTheme: () => void
  onOpenSettings: () => void
}

/** Custom frameless title bar with window controls */
export const TitleBar: FC<TitleBarProps> = ({ theme, onToggleTheme, onOpenSettings }) => {
  const handleMinimize = useCallback(() => window.api.minimizeWindow(), [])
  const handleMaximize = useCallback(() => window.api.maximizeWindow(), [])
  const handleClose = useCallback(() => window.api.closeWindow(), [])

  return (
    <header className="titlebar">
      <div className="titlebar__brand">
        <img className="titlebar__logo" src={appIcon} alt="" />
        <div className="titlebar__name">
          Macro<span>Key</span>
        </div>
      </div>

      <div className="titlebar__controls">
        <button
          className="titlebar__btn titlebar__btn--utility"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Usar tema escuro' : 'Usar tema claro'}
          aria-label={theme === 'light' ? 'Usar tema escuro' : 'Usar tema claro'}
        >
          {theme === 'light' ? <Moon /> : <Sun />}
        </button>
        <button
          className="titlebar__btn titlebar__btn--utility"
          onClick={onOpenSettings}
          title="Preferências"
          aria-label="Abrir preferências"
        >
          <Settings />
        </button>
        <button className="titlebar__btn" onClick={handleMinimize} title="Minimizar">
          <Minus />
        </button>
        <button className="titlebar__btn" onClick={handleMaximize} title="Maximizar">
          <Square />
        </button>
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={handleClose}
          title="Fechar para bandeja"
        >
          <X />
        </button>
      </div>
    </header>
  )
}
