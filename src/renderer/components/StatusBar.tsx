import type { FC } from 'react'
import type { EngineStatus } from '../../shared/types'

interface StatusBarProps {
  engineStatus: EngineStatus
  macroCount: number
}

/** Bottom status bar showing engine state and macro info */
export const StatusBar: FC<StatusBarProps> = ({ engineStatus, macroCount }) => {
  const stateLabel = (() => {
    switch (engineStatus.state) {
      case 'armed':
        return 'Armado'
      case 'typing':
        return 'Digitando'
      default:
        return 'Idle'
    }
  })()

  const isActive = engineStatus.state !== 'idle'

  return (
    <footer className="statusbar">
      <div className="statusbar__left">
        <div className="statusbar__item">
          <span className={`statusbar__dot ${isActive ? 'statusbar__dot--active' : ''}`} />
          <span>{isActive ? `● ${stateLabel}` : '○ Idle'}</span>
        </div>

        {isActive && engineStatus.activeMacroName && (
          <>
            <span className="statusbar__separator" />
            <div className="statusbar__item">
              <span>Macro: "{engineStatus.activeMacroName}"</span>
            </div>
            {engineStatus.state === 'typing' && (
              <>
                <span className="statusbar__separator" />
                <div className="statusbar__item">
                  <span>
                    {engineStatus.currentIndex}/{engineStatus.totalChars} chars (
                    {Math.round(engineStatus.progress)}%)
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="statusbar__right">
        <div className="statusbar__item">
          <span>{macroCount} macros</span>
        </div>
        <span className="statusbar__separator" />
        <div className="statusbar__item">
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
