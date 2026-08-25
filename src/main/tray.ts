import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron'
import type { NativeImage } from 'electron'

/** System tray manager for MacroKey */
export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow
  private isActive = false
  private activeMacroName: string | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  /** Initialize the system tray icon and context menu */
  init(): void {
    // Create a 16x16 icon programmatically (neon purple key)
    const icon = this.createTrayIcon(false)
    this.tray = new Tray(icon)

    this.tray.setToolTip('MacroKey — Idle')
    this.updateContextMenu()

    // Left-click toggles window visibility
    this.tray.on('click', () => {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide()
      } else {
        this.mainWindow.show()
        this.mainWindow.focus()
      }
    })
  }

  /** Update the tray icon to reflect engine state */
  setActive(active: boolean, macroName?: string): void {
    if (!this.tray) return
    const nextMacroName = active ? macroName || 'Macro' : null
    if (this.isActive === active && this.activeMacroName === nextMacroName) return

    this.isActive = active
    this.activeMacroName = nextMacroName

    const icon = this.createTrayIcon(active)
    this.tray.setImage(icon)
    this.tray.setToolTip(
      active ? `MacroKey — Ativo: ${nextMacroName}` : 'MacroKey — Idle'
    )
    this.updateContextMenu()
  }

  /** Destroy the tray icon */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }

  /** Create a tray icon as a nativeImage (16x16 purple/green dot) */
  private createTrayIcon(active: boolean): NativeImage {
    // Generate a simple 16x16 PNG icon using a data URL
    // Purple when idle, green when active
    const size = 16
    const canvas = Buffer.alloc(size * size * 4) // RGBA

    const r = active ? 0x4a : 0x8b
    const g = active ? 0xe6 : 0x5c
    const b = active ? 0x4a : 0xf6

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = x - size / 2
        const cy = y - size / 2
        const dist = Math.sqrt(cx * cx + cy * cy)
        const idx = (y * size + x) * 4

        if (dist <= 6) {
          // Inner circle
          const alpha = dist <= 5 ? 255 : Math.max(0, Math.round(255 * (6 - dist)))
          canvas[idx] = r
          canvas[idx + 1] = g
          canvas[idx + 2] = b
          canvas[idx + 3] = alpha
        } else {
          // Transparent
          canvas[idx] = 0
          canvas[idx + 1] = 0
          canvas[idx + 2] = 0
          canvas[idx + 3] = 0
        }
      }
    }

    return nativeImage.createFromBitmap(canvas, {
      width: size,
      height: size,
      scaleFactor: 1
    })
  }

  /** Rebuild the context menu */
  private updateContextMenu(): void {
    if (!this.tray) return

    const menu = Menu.buildFromTemplate([
      {
        label: this.isActive ? '● Ativo' : '○ Idle',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Mostrar MacroKey',
        click: () => {
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(menu)
  }
}
