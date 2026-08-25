import Store from 'electron-store'
import { randomUUID } from 'node:crypto'
import type { AppSettings, Macro, MacroInput, MacroUpdate } from '../shared/types'

/** Schema for electron-store persistence */
interface StoreSchema {
  macros: Macro[]
  settings: AppSettings
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  launchAtStartup: true,
  showHud: false
}

/** Persistent data store for macros */
export class MacroStore {
  private store: Store<StoreSchema>

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'macrokey-data',
      defaults: {
        macros: [],
        settings: DEFAULT_SETTINGS
      }
    })
  }

  // ---- Application settings ----

  /** Get preferences with safe defaults for data created by older versions. */
  getSettings(): AppSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...this.store.get('settings', DEFAULT_SETTINGS)
    }
  }

  /** Update only recognized and correctly typed preferences. */
  updateSettings(updates: Partial<AppSettings>): AppSettings {
    const current = this.getSettings()
    const next: AppSettings = { ...current }

    if (updates.theme === 'light' || updates.theme === 'dark') {
      next.theme = updates.theme
    }
    if (typeof updates.launchAtStartup === 'boolean') {
      next.launchAtStartup = updates.launchAtStartup
    }
    if (typeof updates.showHud === 'boolean') {
      next.showHud = updates.showHud
    }

    this.store.set('settings', next)
    return next
  }

  // ---- Macros CRUD ----

  /** Get all macros */
  getAllMacros(): Macro[] {
    return this.store.get('macros', [])
  }

  /** Get a single macro by ID */
  getMacro(id: string): Macro | null {
    const macros = this.getAllMacros()
    return macros.find((m) => m.id === id) || null
  }

  /** Create a new macro */
  createMacro(data: MacroInput): Macro {
    const macro: Macro = {
      ...data,
      id: randomUUID(),
      usageCount: 0
    }

    const macros = this.getAllMacros()
    macros.push(macro)
    this.store.set('macros', macros)
    return macro
  }

  /** Update an existing macro */
  updateMacro(id: string, updates: MacroUpdate): Macro | null {
    const macros = this.getAllMacros()
    const index = macros.findIndex((m) => m.id === id)
    if (index === -1) return null

    const updated: Macro = {
      ...macros[index],
      ...updates,
      id
    }

    macros[index] = updated
    this.store.set('macros', macros)
    return updated
  }

  /** Delete a macro by ID */
  deleteMacro(id: string): boolean {
    const macros = this.getAllMacros()
    const filtered = macros.filter((m) => m.id !== id)
    if (filtered.length === macros.length) return false

    this.store.set('macros', filtered)
    return true
  }

  /** Increment usage count for a macro and return the updated entry */
  incrementUsage(id: string): Macro | null {
    const macros = this.getAllMacros()
    const index = macros.findIndex((m) => m.id === id)
    if (index === -1) return null

    macros[index].usageCount += 1
    this.store.set('macros', macros)
    return macros[index]
  }
}
