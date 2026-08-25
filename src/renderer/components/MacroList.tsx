import type { FC, ReactNode } from 'react'
import { Keyboard, Star, Zap, Copy, Clock } from 'lucide-react'
import type { Macro } from '../../shared/types'

interface MacroListProps {
  macros: Macro[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
}

/** Mode display labels */
const MODE_LABELS: Record<string, string> = {
  intercept: 'Intercept',
  autotype: 'Auto',
  burst: 'Burst'
}

/** Mode icons */
const MODE_ICONS: Record<string, ReactNode> = {
  intercept: <Keyboard size={10} />,
  autotype: <Zap size={10} />,
  burst: <Copy size={10} />
}

/** Grid list of macro cards */
export const MacroList: FC<MacroListProps> = ({
  macros,
  selectedId,
  onSelect,
  onToggleFavorite
}) => {
  if (macros.length === 0) {
    return null
  }

  return (
    <div className="macro-list">
      {macros.map((macro, i) => (
        <div
          key={macro.id}
          role="button"
          tabIndex={0}
          className={`macro-card animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${
            selectedId === macro.id ? 'macro-card--selected' : ''
          }`}
          onClick={() => onSelect(macro.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect(macro.id)
            }
          }}
        >
          {/* Top accent line for selected */}
          <div className="macro-card__header">
            <span className="macro-card__name">{macro.name || 'Sem nome'}</span>
            <div className="macro-card__header-right">
              <button
                className={`macro-card__fav ${macro.isFavorite ? 'macro-card__fav--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(macro.id)
                }}
                title={macro.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star size={13} fill={macro.isFavorite ? 'currentColor' : 'none'} />
              </button>
              {macro.hotkey && <span className="macro-card__hotkey">{macro.hotkey}</span>}
            </div>
          </div>

          <div className="macro-card__preview">
            {macro.content
              ? macro.content.slice(0, 120).replace(/\n/g, ' ↵ ')
              : 'Macro vazio...'}
          </div>

          <div className="macro-card__footer">
            <span className="macro-card__mode">
              {MODE_ICONS[macro.mode]} {MODE_LABELS[macro.mode]}
            </span>
            <span className="macro-card__stat">
              {macro.content.length} chars
            </span>
            {macro.usageCount > 0 && (
              <span className="macro-card__stat">
                <Clock size={10} /> {macro.usageCount}x
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
