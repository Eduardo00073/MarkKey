import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type {
  AppCapabilities,
  AppSettings,
  Macro,
  MacroInput,
  MacroUpdate,
  EngineStatus
} from '../shared/types'

/** API exposed to the renderer process via contextBridge */
const api = {
  // ---- Macro CRUD ----
  getMacros: (): Promise<Macro[]> => ipcRenderer.invoke(IPC.MACROS_GET_ALL),
  createMacro: (macro: MacroInput): Promise<Macro> =>
    ipcRenderer.invoke(IPC.MACROS_CREATE, macro),
  updateMacro: (id: string, updates: MacroUpdate): Promise<Macro> =>
    ipcRenderer.invoke(IPC.MACROS_UPDATE, id, updates),
  deleteMacro: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC.MACROS_DELETE, id),
  exportMacros: (): Promise<string | null> => ipcRenderer.invoke(IPC.MACROS_EXPORT),
  importMacros: (): Promise<{ count: number }> => ipcRenderer.invoke(IPC.MACROS_IMPORT),
  onMacroChanged: (callback: (macro: Macro) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, macro: Macro) => callback(macro)
    ipcRenderer.on(IPC.MACROS_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(IPC.MACROS_CHANGED, handler)
    }
  },

  // ---- Application settings ----
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
  updateSettings: (updates: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SETTINGS_UPDATE, updates),
  getCapabilities: (): Promise<AppCapabilities> => ipcRenderer.invoke(IPC.CAPABILITIES_GET),

  // ---- Engine ----
  onEngineStatus: (callback: (status: EngineStatus) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: EngineStatus) => callback(status)
    ipcRenderer.on(IPC.ENGINE_STATUS, handler)
    return () => {
      ipcRenderer.removeListener(IPC.ENGINE_STATUS, handler)
    }
  },

  // ---- Window Controls ----
  minimizeWindow: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(IPC.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.send(IPC.WINDOW_CLOSE)
}

/** Expose the API to the renderer as window.api */
contextBridge.exposeInMainWorld('api', api)

/** Type declaration for the exposed API */
export type MacroKeyAPI = typeof api
