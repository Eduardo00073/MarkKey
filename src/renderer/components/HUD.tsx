import { useState, useEffect, type FC } from 'react'
import { Keyboard, Zap, XCircle } from 'lucide-react'
import type { EngineStatus } from '../../shared/types'

/** HUD Overlay component — renders in the transparent overlay window */
export const HUD: FC = () => {
  const [status, setStatus] = useState<EngineStatus>({
    state: 'idle',
    activeMacroName: null,
    progress: 0,
    totalChars: 0,
    currentIndex: 0,
    preview: ''
  })

  useEffect(() => {
    const unsubscribe = window.api.onEngineStatus((s: EngineStatus) => {
      setStatus(s)
    })
    return () => unsubscribe()
  }, [])

  // Don't render if idle
  if (status.state === 'idle') {
    return null
  }

  const stateLabel =
    status.state === 'armed'
      ? 'ARMADO'
      : 'DIGITANDO'

  const stateIcon =
    status.state === 'armed' ? <Keyboard size={12} /> : <Zap size={12} />

  return (
    <div className="hud">
      <div className="hud__header">
        <div className="hud__state">
          <span className="hud__state-dot" />
          {stateIcon}
          <span className="hud__state-label">{stateLabel}</span>
        </div>
        <span className="hud__macro-name">{status.activeMacroName || 'Macro'}</span>
      </div>

      {/* Progress bar */}
      <div className="hud__progress-track">
        <div
          className="hud__progress-fill"
          style={{ width: `${Math.min(status.progress, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="hud__footer">
        <span className="hud__chars">
          {status.currentIndex}/{status.totalChars}
        </span>
        <span className="hud__percent">{Math.round(status.progress)}%</span>
        {status.preview && (
          <span className="hud__preview" title={status.preview}>
            {status.preview.slice(0, 20)}
            {status.preview.length > 20 ? '…' : ''}
          </span>
        )}
      </div>

      <div className="hud__hint">
        <XCircle size={10} />
        <span>ESC para cancelar</span>
      </div>
    </div>
  )
}
