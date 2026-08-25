import { useCallback, useMemo, type FC, type ReactNode } from 'react'
import Editor from '@monaco-editor/react'
import { HotkeyPicker } from './HotkeyPicker'
import { Save, Trash2, Keyboard, Zap, Copy } from 'lucide-react'
import type { Macro, MacroMode, MacroUpdate } from '../../shared/types'

interface MacroEditorProps {
  macro: Macro
  onChange: (updates: MacroUpdate) => void
  onSave: () => void
  onDelete: () => void
  usedHotkeys: string[]
}

/** Mode options for the selector */
const MODES: { value: MacroMode; label: string; icon: ReactNode; desc: string }[] = [
  {
    value: 'intercept',
    label: 'Intercept',
    icon: <Keyboard size={14} />,
    desc: 'Cada tecla pressionada emite o próximo caractere do macro'
  },
  {
    value: 'autotype',
    label: 'Auto-Type',
    icon: <Zap size={14} />,
    desc: 'Digita automaticamente'
  },
  {
    value: 'burst',
    label: 'Snippet Burst',
    icon: <Copy size={14} />,
    desc: 'Cola instantaneamente'
  }
]

/** Full-featured macro editor with Monaco, hotkey picker, and mode selector */
export const MacroEditor: FC<MacroEditorProps> = ({
  macro,
  onChange,
  onSave,
  onDelete,
  usedHotkeys
}) => {
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onChange({ content: value || '' })
    },
    [onChange]
  )

  /** Estimated typing time at average speed */
  const estimatedTime = useMemo(() => {
    const avgDelay = (macro.typingSpeed.min + macro.typingSpeed.max) / 2
    const totalMs = macro.content.length * avgDelay
    const seconds = Math.ceil(totalMs / 1000)
    if (seconds < 60) return `~${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `~${minutes}m ${secs}s`
  }, [macro.content.length, macro.typingSpeed])

  return (
    <div className="macro-editor">
      {/* Top toolbar */}
      <div className="macro-editor__toolbar">
        <div className="macro-editor__toolbar-left">
          {/* Name input */}
          <input
            className="macro-editor__name-input"
            type="text"
            value={macro.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Nome do macro..."
            spellCheck={false}
          />
        </div>
        <div className="macro-editor__toolbar-right">
          <button className="btn btn--ghost" onClick={onDelete} title="Excluir macro">
            <Trash2 size={14} />
          </button>
          <button className="btn btn--primary" onClick={onSave} title="Salvar macro">
            <Save size={14} />
            Salvar
          </button>
        </div>
      </div>

      {/* Config row: hotkey + mode */}
      <div className="macro-editor__config">
        <div className="macro-editor__config-item">
          <label className="macro-editor__label">Hotkey</label>
          <HotkeyPicker
            value={macro.hotkey}
            onChange={(hotkey) => onChange({ hotkey })}
            usedHotkeys={usedHotkeys}
          />
        </div>

        <div className="macro-editor__config-item">
          <label className="macro-editor__label">Modo</label>
          <div className="macro-editor__mode-selector">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                className={`macro-editor__mode-btn ${
                  macro.mode === mode.value ? 'macro-editor__mode-btn--active' : ''
                }`}
                onClick={() => onChange({ mode: mode.value })}
                title={mode.desc}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="macro-editor__config-item">
          <label className="macro-editor__label">Velocidade (ms)</label>
          <div className="macro-editor__speed">
            <input
              className="macro-editor__speed-input"
              type="number"
              value={macro.typingSpeed.min}
              onChange={(e) =>
                onChange({
                  typingSpeed: { ...macro.typingSpeed, min: parseInt(e.target.value) || 0 }
                })
              }
              min={0}
              max={500}
              title="Delay mínimo entre caracteres"
            />
            <span className="macro-editor__speed-sep">—</span>
            <input
              className="macro-editor__speed-input"
              type="number"
              value={macro.typingSpeed.max}
              onChange={(e) =>
                onChange({
                  typingSpeed: { ...macro.typingSpeed, max: parseInt(e.target.value) || 0 }
                })
              }
              min={0}
              max={500}
              title="Delay máximo entre caracteres"
            />
          </div>
        </div>

        <div className="macro-editor__config-item macro-editor__config-item--toggle">
          <label className="macro-editor__label">Humanizar</label>
          <button
            className={`macro-editor__toggle ${macro.humanize ? 'macro-editor__toggle--on' : ''}`}
            onClick={() => onChange({ humanize: !macro.humanize })}
            title="Simular digitação humana com delays variáveis"
          >
            <span className="macro-editor__toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="macro-editor__editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          value={macro.content}
          onChange={handleEditorChange}
          theme="macrokey-dark"
          beforeMount={(monaco) => {
            // Define custom dark theme to match our design
            monaco.editor.defineTheme('macrokey-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: '', foreground: 'f0f0f8', background: '0e0e18' },
                { token: 'comment', foreground: '5c5c7a', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'c4b5fd' },
                { token: 'string', foreground: '4ade80' },
                { token: 'number', foreground: 'fbbf24' },
                { token: 'tag', foreground: '8b5cf6' },
                { token: 'attribute.name', foreground: 'a78bfa' },
                { token: 'attribute.value', foreground: '4ade80' }
              ],
              colors: {
                'editor.background': '#0e0e18',
                'editor.foreground': '#f0f0f8',
                'editor.lineHighlightBackground': '#1a1a2e',
                'editor.selectionBackground': '#8b5cf640',
                'editorCursor.foreground': '#8b5cf6',
                'editor.inactiveSelectionBackground': '#8b5cf620',
                'editorLineNumber.foreground': '#5c5c7a',
                'editorLineNumber.activeForeground': '#a78bfa',
                'editorIndentGuide.background': '#1f1f35',
                'editorIndentGuide.activeBackground': '#8b5cf640',
                'scrollbarSlider.background': '#1f1f3580',
                'scrollbarSlider.hoverBackground': '#8b5cf680',
                'editorWidget.background': '#141422',
                'editorWidget.border': '#8b5cf630'
              }
            })
          }}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            renderWhitespace: 'boundary',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12, bottom: 12 },
            bracketPairColorization: { enabled: true },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            contextmenu: true,
            automaticLayout: true
          }}
        />
      </div>

      {/* Bottom info bar */}
      <div className="macro-editor__info">
        <span>{macro.content.length} caracteres</span>
        <span className="macro-editor__info-sep">•</span>
        <span>{macro.content.split('\n').length} linhas</span>
        <span className="macro-editor__info-sep">•</span>
        <span>Tempo estimado: {estimatedTime}</span>
      </div>
    </div>
  )
}
