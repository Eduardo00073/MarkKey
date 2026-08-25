import { useEffect, type FC, type ReactNode } from 'react'
import { Eye, MonitorCog, Moon, Power, Sun, X } from 'lucide-react'
import type { AppCapabilities, AppSettings, AppTheme } from '../../shared/types'

interface SettingsPanelProps {
  settings: AppSettings
  capabilities: AppCapabilities
  onChange: (updates: Partial<AppSettings>) => void
  onClose: () => void
}

const THEMES: { value: AppTheme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon }
]

export const SettingsPanel: FC<SettingsPanelProps> = ({
  settings,
  capabilities,
  onChange,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="settings-backdrop" onMouseDown={onClose}>
    <section
      className="settings-panel animate-fade-in-scale"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header className="settings-panel__header">
        <div className="settings-panel__heading">
          <span className="settings-panel__heading-icon"><MonitorCog size={18} /></span>
          <div>
            <h2 id="settings-title">Preferências</h2>
            <p>Ajuste a aparência e o comportamento do MacroKey.</p>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar preferências">
          <X size={18} />
        </button>
      </header>

      <div className="settings-panel__content">
        <div className="settings-group">
          <div className="settings-group__label">Aparência</div>
          <div className="theme-options">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                className={`theme-option ${settings.theme === value ? 'theme-option--active' : ''}`}
                onClick={() => onChange({ theme: value })}
              >
                <span className="theme-option__preview" data-preview-theme={value}>
                  <span />
                  <span />
                </span>
                <span className="theme-option__label"><Icon size={15} /> {label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group__label">Comportamento</div>
          <div className="settings-list">
            <SettingToggle
              icon={<Power size={18} />}
              title="Iniciar com o Windows"
              description={capabilities.launchAtStartup
                ? 'Mantém o engine disponível em segundo plano após entrar no Windows.'
                : 'Disponível na versão instalada; a versão portátil usa uma pasta temporária.'}
              checked={settings.launchAtStartup && capabilities.launchAtStartup}
              disabled={!capabilities.launchAtStartup}
              onToggle={() => onChange({ launchAtStartup: !settings.launchAtStartup })}
            />
            <SettingToggle
              icon={<Eye size={18} />}
              title="Mostrar HUD durante a macro"
              description="Exibe nome, progresso e atalho para cancelar. Desligado mantém a execução discreta."
              checked={settings.showHud}
              onToggle={() => onChange({ showHud: !settings.showHud })}
            />
          </div>
        </div>
      </div>

      <footer className="settings-panel__footer">
        <span>As alterações são salvas automaticamente.</span>
        <button className="btn btn--primary" onClick={onClose}>Concluir</button>
      </footer>
    </section>
    </div>
  )
}

interface SettingToggleProps {
  icon: ReactNode
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

const SettingToggle: FC<SettingToggleProps> = ({
  icon,
  title,
  description,
  checked,
  disabled = false,
  onToggle
}) => (
  <div className={`setting-row ${disabled ? 'setting-row--disabled' : ''}`}>
    <span className="setting-row__icon">{icon}</span>
    <div className="setting-row__copy">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
    <button
      className={`switch ${checked ? 'switch--on' : ''}`}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      title={title}
    >
      <span />
    </button>
  </div>
)
