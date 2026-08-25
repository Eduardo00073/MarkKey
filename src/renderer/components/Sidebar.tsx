import type { FC, ReactNode } from 'react'
import {
  Folder,
  Star,
  Code2,
  Mail,
  FileText,
  Globe,
  Layers,
  Download,
  Upload
} from 'lucide-react'
import type { EngineState } from '../../shared/types'

/** Category definition for the sidebar */
interface Category {
  id: string
  name: string
  icon: ReactNode
}

interface SidebarProps {
  activeCategory: string
  onCategoryChange: (id: string) => void
  engineState: EngineState
  macroCount: number
  onExport: () => void
  onImport: () => void
}

/** Default categories */
const CATEGORIES: Category[] = [
  { id: 'all', name: 'Todos os Macros', icon: <Layers size={16} /> },
  { id: 'general', name: 'Geral', icon: <Folder size={16} /> },
  { id: 'html', name: 'HTML / CSS', icon: <Globe size={16} /> },
  { id: 'code', name: 'Código', icon: <Code2 size={16} /> },
  { id: 'email', name: 'E-mails', icon: <Mail size={16} /> },
  { id: 'text', name: 'Textos', icon: <FileText size={16} /> }
]

/** Sidebar navigation with categories and engine status */
export const Sidebar: FC<SidebarProps> = ({
  activeCategory,
  onCategoryChange,
  engineState,
  macroCount,
  onExport,
  onImport
}) => {
  const engineLabel =
    engineState === 'idle'
      ? 'Engine Idle'
      : engineState === 'armed'
        ? 'Macro Armado'
        : 'Digitando...'

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <span className="sidebar__title">Categorias</span>
      </div>

      <nav className="sidebar__categories">
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            className={`sidebar__item animate-fade-in-up stagger-${i + 1} ${
              activeCategory === cat.id ? 'sidebar__item--active' : ''
            }`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <span className="sidebar__item-icon">{cat.icon}</span>
            <span>{cat.name}</span>
            {cat.id === 'all' && macroCount > 0 && (
              <span className="sidebar__item-count">{macroCount}</span>
            )}
          </div>
        ))}

        <div className="sidebar__separator" />

        <div
          className={`sidebar__item animate-fade-in-up stagger-7 ${
            activeCategory === 'favorites' ? 'sidebar__item--active' : ''
          }`}
          onClick={() => onCategoryChange('favorites')}
        >
          <span className="sidebar__item-icon">
            <Star size={16} />
          </span>
          <span>Favoritos</span>
        </div>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__actions">
          <button className="sidebar__action-btn" onClick={onImport} title="Importar macros">
            <Upload size={13} />
            <span>Importar</span>
          </button>
          <button className="sidebar__action-btn" onClick={onExport} title="Exportar macros">
            <Download size={13} />
            <span>Exportar</span>
          </button>
        </div>
        <div className="sidebar__engine-indicator">
          <span
            className={`sidebar__engine-dot ${
              engineState !== 'idle' ? 'sidebar__engine-dot--active' : ''
            }`}
          />
          <span>{engineLabel}</span>
        </div>
      </div>
    </aside>
  )
}
