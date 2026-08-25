import { app, BrowserWindow, nativeTheme } from 'electron'
import path from 'node:path'
import { TrayManager } from './tray'
import { MacroStore } from './store'
import { TypingEngine } from './typing-engine'
import { HudOverlay } from './hud-overlay'
import { registerIpcHandlers } from './ipc-handlers'
import { IPC } from '../shared/types'
import type { AppCapabilities, AppSettings } from '../shared/types'

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null
let trayManager: TrayManager | null = null
let isQuitting = false
const store = new MacroStore()
const engine = new TypingEngine()
const hudOverlay = new HudOverlay()
const startsHidden = process.argv.includes('--hidden')
const capabilities: AppCapabilities = {
  launchAtStartup: app.isPackaged && !process.env.PORTABLE_EXECUTABLE_FILE
}

/** Apply preferences that belong to the main process and Windows integration. */
function applySettings(settings: AppSettings): void {
  nativeTheme.themeSource = settings.theme
  hudOverlay.setEnabled(settings.showHud)

  if (capabilities.launchAtStartup) {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtStartup,
      path: process.execPath,
      args: ['--hidden']
    })
  }
}

/** Create the main application window */
function createMainWindow(settings: AppSettings): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    frame: false,              // Frameless for custom title bar
    transparent: false,
    backgroundColor: settings.theme === 'dark' ? '#111827' : '#f4f6fb',
    show: false,               // Show when ready to prevent flicker
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Show window when renderer is ready
  win.once('ready-to-show', () => {
    if (!startsHidden) {
      win.show()
    }
  })

  // Minimize to tray instead of closing
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

/** Initialize the typing engine and register hotkeys */
function initEngine(win: BrowserWindow): void {
  engine.setHudOverlay(hudOverlay)
  engine.setStatusListener((status) => {
    trayManager?.setActive(status.state !== 'idle', status.activeMacroName || undefined)
  })

  const started = engine.init(
    win,
    (id: string) => store.getMacro(id),
    (id: string) => {
      const updated = store.incrementUsage(id)
      if (updated && !win.isDestroyed()) {
        win.webContents.send(IPC.MACROS_CHANGED, updated)
      }
    }
  )

  if (started) {
    // Register all existing macro hotkeys
    const macros = store.getAllMacros()
    engine.rebuildHotkeys(macros)
    console.log('[Main] Typing engine ready')
  } else {
    console.warn('[Main] Typing engine running without native hook (fallback mode)')
  }
}

// ---- App Lifecycle ----

app.on('ready', () => {
  app.setAppUserModelId('com.macrokey.app')
  const settings = store.getSettings()
  applySettings(settings)

  mainWindow = createMainWindow(settings)
  trayManager = new TrayManager(mainWindow)
  trayManager.init()

  // Initialize HUD overlay window
  hudOverlay.create()

  registerIpcHandlers(store, engine, mainWindow, capabilities, applySettings)

  // Initialize the engine after window is ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      initEngine(mainWindow)
    }
  })
})

// Handle second instance attempt — focus existing window
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  // Don't quit — keep running in tray
})

app.on('before-quit', () => {
  isQuitting = true
  engine.destroy()
  hudOverlay.destroy()
  trayManager?.destroy()
})
