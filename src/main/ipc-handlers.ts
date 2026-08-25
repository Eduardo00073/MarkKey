import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../shared/types'
import { exportMacros, importMacros } from './import-export'
import type { MacroStore } from './store'
import type { TypingEngine } from './typing-engine'
import type { MacroInput, MacroUpdate } from '../shared/types'

/**
 * Register all IPC handlers for the renderer to call.
 * When macros change, automatically rebuilds the engine hotkey map.
 */
export function registerIpcHandlers(
  store: MacroStore,
  engine: TypingEngine,
  window: BrowserWindow
): void {
  /** Helper: rebuild engine hotkeys after any macro change */
  const rebuildHotkeys = () => {
    engine.rebuildHotkeys(store.getAllMacros())
  }

  // ---- Macros CRUD ----

  ipcMain.handle(IPC.MACROS_GET_ALL, () => {
    return store.getAllMacros()
  })

  ipcMain.handle(
    IPC.MACROS_CREATE,
    (_event, data: MacroInput) => {
      const macro = store.createMacro(data)
      rebuildHotkeys()
      return macro
    }
  )

  ipcMain.handle(IPC.MACROS_UPDATE, (_event, id: string, updates: MacroUpdate) => {
    const macro = store.updateMacro(id, updates)
    rebuildHotkeys()
    return macro
  })

  ipcMain.handle(IPC.MACROS_DELETE, (_event, id: string) => {
    const result = store.deleteMacro(id)
    rebuildHotkeys()
    return result
  })

  // ---- Import/Export ----

  ipcMain.handle(IPC.MACROS_EXPORT, () => {
    const macros = store.getAllMacros()
    const win = BrowserWindow.getFocusedWindow()
    return exportMacros(macros, win)
  })

  ipcMain.handle(IPC.MACROS_IMPORT, async () => {
    const win = BrowserWindow.getFocusedWindow()
    const imported = await importMacros(win)
    if (!imported || imported.length === 0) return { count: 0 }

    let count = 0
    for (const macroData of imported) {
      store.createMacro(macroData)
      count++
    }

    rebuildHotkeys()
    return { count }
  })

  // ---- Window controls ----

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => {
    window.minimize()
  })

  ipcMain.on(IPC.WINDOW_MAXIMIZE, () => {
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  })

  ipcMain.on(IPC.WINDOW_CLOSE, () => {
    window.close()
  })
}
