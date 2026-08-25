import { useCallback, type FC } from 'react'
import { Minus, Square, X } from 'lucide-react'

/** Custom frameless title bar with window controls */
export const TitleBar: FC = () => {
  const handleMinimize = useCallback(() => window.api.minimizeWindow(), [])
  const handleMaximize = useCallback(() => window.api.maximizeWindow(), [])
  const handleClose = useCallback(() => window.api.closeWindow(), [])

  return (
    <header className="titlebar">
      <div className="titlebar__brand">
        <div className="titlebar__logo">⌨</div>
        <div className="titlebar__name">
          Macro<span>Key</span>
        </div>
      </div>

      <div className="titlebar__controls">
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
