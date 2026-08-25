import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import type { EngineStatus } from '../shared/types'
import { IPC } from '../shared/types'

/**
 * HUD Overlay Manager
 * Creates a transparent, always-on-top, click-through window
 * that shows macro execution progress
 */
export class HudOverlay {
  private window: BrowserWindow | null = null

  /** Create the overlay window (hidden by default) */
  create(): void {
    this.window = new BrowserWindow({
      width: 280,
      height: 100,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    // Make the window click-through so it doesn't steal focus
    this.window.setIgnoreMouseEvents(true, { forward: true })

    // Load the HUD HTML
    if (process.env.ELECTRON_RENDERER_URL) {
      this.window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/hud`)
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: '/hud' })
    }
  }

  /** Show the HUD overlay */
  show(): void {
    if (!this.window) return
    this.updatePosition()
    this.window.setOpacity(0.85)
    this.window.showInactive()
  }

  /** Hide the HUD overlay */
  hide(): void {
    if (!this.window) return
    this.window.hide()
  }

  /** Update the displayed status */
  updateStatus(status: EngineStatus): void {
    if (!this.window || this.window.isDestroyed()) return
    this.window.webContents.send(IPC.ENGINE_STATUS, status)
  }

  /** Destroy the overlay window */
  destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy()
    }
    this.window = null
  }

  /** Position the window in the chosen corner */
  private updatePosition(): void {
    if (!this.window) return

    const display = screen.getPrimaryDisplay()
    const { width: screenW, height: screenH } = display.workAreaSize
    const [winW, winH] = this.window.getSize()
    const margin = 16

    const x = screenW - winW - margin
    const y = screenH - winH - margin
    this.window.setPosition(x, y)
  }
}
