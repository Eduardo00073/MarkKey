// ============================================
// MacroKey — Shared Type Definitions
// ============================================

/** Execution mode for a macro */
export type MacroMode = 'intercept' | 'autotype' | 'burst'

/** Macro typing speed configuration */
interface TypingSpeed {
  /** Minimum delay between characters in ms */
  min: number
  /** Maximum delay between characters in ms */
  max: number
}

/** A single macro entry */
export interface Macro {
  id: string
  name: string
  content: string
  hotkey: string
  category: string
  mode: MacroMode
  isFavorite: boolean
  typingSpeed: TypingSpeed
  humanize: boolean
  usageCount: number
}

/** Data required to create a macro before runtime fields are assigned */
export type MacroInput = Omit<Macro, 'id' | 'usageCount'>

/** Editable fields of an existing macro */
export type MacroUpdate = Partial<MacroInput>

/** State of the macro engine */
export type EngineState = 'idle' | 'armed' | 'typing'

/** Engine status broadcast to renderer */
export interface EngineStatus {
  state: EngineState
  activeMacroName: string | null
  progress: number
  totalChars: number
  currentIndex: number
  preview: string
}

/** IPC channel names */
export const IPC = {
  // Macro CRUD
  MACROS_GET_ALL: 'macros:get-all',
  MACROS_CREATE: 'macros:create',
  MACROS_UPDATE: 'macros:update',
  MACROS_DELETE: 'macros:delete',
  MACROS_EXPORT: 'macros:export',
  MACROS_IMPORT: 'macros:import',
  MACROS_CHANGED: 'macros:changed',

  // Engine
  ENGINE_STATUS: 'engine:status',

  // Window controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close'
} as const
