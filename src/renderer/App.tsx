import { useState, useEffect, useCallback, type FC } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { MacroList } from './components/MacroList'
import { MacroEditor } from './components/MacroEditor'
import { Keyboard, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import type { Macro, MacroInput, MacroUpdate, EngineStatus } from '../shared/types'

/** Default engine status (idle state) */
const IDLE_ENGINE: EngineStatus = {
  state: 'idle',
  activeMacroName: null,
  progress: 0,
  totalChars: 0,
  currentIndex: 0,
  preview: ''
}

/** Create a blank macro template */
function newMacroTemplate(): MacroInput {
  return {
    name: '',
    content: '',
    hotkey: '',
    category: 'general',
    mode: 'intercept',
    isFavorite: false,
    typingSpeed: { min: 30, max: 90 },
    humanize: true
  }
}

const App: FC = () => {
  const [macros, setMacros] = useState<Macro[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null)
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(IDLE_ENGINE)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([])

  /** Show a toast notification that auto-dismisses */
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500)
  }, [])

  // ---- Load macros on mount ----
  useEffect(() => {
    loadMacros()
  }, [])

  // ---- Listen for engine status updates from main process ----
  useEffect(() => {
    const unsubscribe = window.api.onEngineStatus((status: EngineStatus) => {
      setEngineStatus(status)
    })
    return () => unsubscribe()
  }, [])

  // Keep usage counters in sync when a macro finishes outside the app window.
  useEffect(() => {
    const unsubscribe = window.api.onMacroChanged((updated: Macro) => {
      setMacros((current) => current.map((macro) => (macro.id === updated.id ? updated : macro)))
    })
    return () => unsubscribe()
  }, [])

  const loadMacros = async () => {
    try {
      const data = await window.api.getMacros()
      setMacros(data)
    } catch (err) {
      console.error('Failed to load macros:', err)
    }
  }

  // ---- Filter macros by category ----
  const filteredMacros = macros.filter((m) => {
    if (activeCategory === 'all') return true
    if (activeCategory === 'favorites') return m.isFavorite
    return m.category === activeCategory
  })

  // ---- Hotkeys already in use ----
  const usedHotkeys = macros.filter((m) => m.hotkey).map((m) => m.hotkey)

  // ---- Select a macro ----
  const handleSelect = useCallback(
    (id: string) => {
      const macro = macros.find((m) => m.id === id)
      if (macro) {
        setSelectedId(id)
        setEditingMacro({ ...macro })
      }
    },
    [macros]
  )

  // ---- Create new macro ----
  const handleCreate = useCallback(async () => {
    try {
      const template = newMacroTemplate()
      template.category = activeCategory === 'all' || activeCategory === 'favorites'
        ? 'general'
        : activeCategory
      const created = await window.api.createMacro(template)
      setMacros((prev) => [...prev, created])
      setSelectedId(created.id)
      setEditingMacro({ ...created })
    } catch (err) {
      console.error('Failed to create macro:', err)
    }
  }, [activeCategory])

  // ---- Update editing macro locally ----
  const handleEditorChange = useCallback((updates: MacroUpdate) => {
    setEditingMacro((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  // ---- Save macro ----
  const handleSave = useCallback(async () => {
    if (!editingMacro) return
    try {
      const { id: _id, usageCount: _usageCount, ...updates } = editingMacro
      const updated = await window.api.updateMacro(editingMacro.id, updates)
      if (updated) {
        setMacros((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
        setEditingMacro({ ...updated })
        showToast(`Macro "${updated.name || 'Sem nome'}" salvo!`)
      }
    } catch (err) {
      console.error('Failed to save macro:', err)
    }
  }, [editingMacro])

  // ---- Delete macro ----
  const handleDelete = useCallback(async () => {
    if (!editingMacro) return
    try {
      const name = editingMacro.name || 'Sem nome'
      await window.api.deleteMacro(editingMacro.id)
      setMacros((prev) => prev.filter((m) => m.id !== editingMacro.id))
      setSelectedId(null)
      setEditingMacro(null)
      showToast(`Macro "${name}" excluído`)
    } catch (err) {
      console.error('Failed to delete macro:', err)
    }
  }, [editingMacro])

  // ---- Toggle favorite ----
  const handleToggleFavorite = useCallback(
    async (id: string) => {
      const macro = macros.find((m) => m.id === id)
      if (!macro) return
      try {
        const updated = await window.api.updateMacro(id, { isFavorite: !macro.isFavorite })
        if (updated) {
          setMacros((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
          if (editingMacro?.id === id) {
            setEditingMacro((prev) => (prev ? { ...prev, isFavorite: updated.isFavorite } : null))
          }
        }
      } catch (err) {
        console.error('Failed to toggle favorite:', err)
      }
    },
    [macros, editingMacro]
  )

  // ---- Export macros ----
  const handleExport = useCallback(async () => {
    try {
      const filePath = await window.api.exportMacros()
      if (filePath) {
        showToast('Macros exportados com sucesso!')
      }
    } catch (err) {
      console.error('Failed to export macros:', err)
      showToast('Erro ao exportar macros', 'error')
    }
  }, [showToast])

  // ---- Import macros ----
  const handleImport = useCallback(async () => {
    try {
      const res = await window.api.importMacros()
      if (res && res.count > 0) {
        await loadMacros()
        showToast(`${res.count} macro(s) importado(s)!`)
      }
    } catch (err: any) {
      console.error('Failed to import macros:', err)
      showToast(err.message || 'Erro ao importar macros', 'error')
    }
  }, [showToast])

  // ---- Render ----
  const showEditor = editingMacro !== null
  const showEmptyState = !showEditor && filteredMacros.length === 0

  return (
    <>
      <TitleBar />
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__icon">
              {t.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            </span>
            <span className="toast__message">{t.message}</span>
          </div>
        ))}
      </div>
      <div className={`app-layout ${engineStatus.state !== 'idle' ? 'app-layout--armed' : ''}`}>
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat)
            setSelectedId(null)
            setEditingMacro(null)
          }}
          engineState={engineStatus.state}
          macroCount={macros.length}
          onExport={handleExport}
          onImport={handleImport}
        />
        <main className="content">
          {/* Header */}
          <div className="content__header">
            <h1 className="content__header-title">
              {activeCategory === 'all'
                ? 'Todos os Macros'
                : activeCategory === 'favorites'
                  ? 'Favoritos'
                  : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
            </h1>
            {filteredMacros.length > 0 && (
              <span className="content__header-badge">{filteredMacros.length}</span>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn btn--primary" onClick={handleCreate}>
              <Plus size={14} />
              Novo Macro
            </button>
          </div>

          {/* Body: List + Editor split or empty state */}
          <div className="content__body-split">
            {/* Macro list panel */}
            {filteredMacros.length > 0 && (
              <div className={`content__list-panel ${showEditor ? 'content__list-panel--narrow' : ''}`}>
                <MacroList
                  macros={filteredMacros}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}

            {/* Editor panel */}
            {showEditor && (
              <div className="content__editor-panel animate-fade-in-up">
                <MacroEditor
                  macro={editingMacro}
                  onChange={handleEditorChange}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  usedHotkeys={usedHotkeys}
                />
              </div>
            )}

            {/* Empty state */}
            {showEmptyState && (
              <div className="content__empty animate-fade-in-scale">
                <div className="content__empty-icon animate-float">
                  <Keyboard />
                </div>
                <div className="content__empty-title">Nenhum macro ainda</div>
                <div className="content__empty-description">
                  Crie seu primeiro macro para começar a digitar como o Batman.
                </div>
                <button className="btn btn--primary" onClick={handleCreate}>
                  <Keyboard size={14} />
                  Criar Primeiro Macro
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <StatusBar engineStatus={engineStatus} macroCount={macros.length} />
    </>
  )
}

export default App
