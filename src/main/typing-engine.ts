import { BrowserWindow } from 'electron'
import { KeyboardHook } from './keyboard-hook'
import type { KeyEvent } from './keyboard-hook'
import { parseVariables, hasVariables } from './variable-parser'
import type { HudOverlay } from './hud-overlay'
import { IPC } from '../shared/types'
import type { EngineStatus, EngineState, Macro } from '../shared/types'

/**
 * TypingEngine — MacroKey Core Engine
 *
 * Manages the lifecycle of macro execution:
 * 1. Listen for hotkey triggers (F9, F8, etc.)
 * 2. Arm the corresponding macro
 * 3. Intercept real keys and emit macro characters one-by-one
 * 4. Humanize typing with variable delays (Auto-Type mode)
 * 5. Broadcast status to the renderer and HUD overlay
 */
export class TypingEngine {
  private hook: KeyboardHook
  private mainWindow: BrowserWindow | null = null
  private hudOverlay: HudOverlay | null = null
  private state: EngineState = 'idle'
  private activeMacro: Macro | null = null
  private currentIndex = 0
  private hotkeyMap: Map<string, string> = new Map() // hotkey name (uppercase) -> macroId
  private getMacroById: ((id: string) => Macro | null) | null = null
  private onUsageIncrement: ((id: string) => void) | null = null
  private onStatusChange: ((status: EngineStatus) => void) | null = null
  private autoTypeAbort = false
  private isArming = false
  private pressedModifiers: Set<string> = new Set()

  constructor() {
    this.hook = new KeyboardHook()
  }

  /** Initialize the engine */
  init(
    mainWindow: BrowserWindow,
    getMacro: (id: string) => Macro | null,
    onUsage: (id: string) => void
  ): boolean {
    this.mainWindow = mainWindow
    this.getMacroById = getMacro
    this.onUsageIncrement = onUsage

    const started = this.hook.start((event: KeyEvent) => {
      this.handleKeyEvent(event)
    })

    if (started) {
      console.log('[TypingEngine] Initialized with native keyboard hook')
    } else {
      console.error('[TypingEngine] Failed to start keyboard hook')
    }

    return started
  }

  /** Set the HUD overlay manager */
  setHudOverlay(hud: HudOverlay): void {
    this.hudOverlay = hud
  }

  /** Listen for status changes from integrations such as the tray icon */
  setStatusListener(listener: (status: EngineStatus) => void): void {
    this.onStatusChange = listener
  }

  /** Rebuild the hotkey → macroId map from a list of macros */
  rebuildHotkeys(macros: Macro[]): void {
    this.hotkeyMap.clear()
    for (const macro of macros) {
      if (macro.hotkey) {
        this.hotkeyMap.set(macro.hotkey.toUpperCase(), macro.id)
      }
    }
    console.log(`[TypingEngine] Registered ${this.hotkeyMap.size} hotkeys`)
  }

  /** Arm a macro for execution */
  async armMacro(macro: Macro): Promise<void> {
    if (this.isArming) return
    this.isArming = true

    // Parse dynamic variables if present
    const parsedMacro = { ...macro }
    try {
      if (hasVariables(macro.content)) {
        parsedMacro.content = await parseVariables(macro.content, {
          macroIndex: macro.usageCount
        })
      }
    } finally {
      this.isArming = false
    }

    this.activeMacro = parsedMacro
    this.currentIndex = 0
    this.autoTypeAbort = false

    if (macro.mode === 'intercept') {
      // Intercept mode: enable key suppression
      this.state = 'armed'
      this.hook.setSuppression(true)
      console.log(`[TypingEngine] Armed (Intercept): "${macro.name}" (${macro.content.length} chars)`)
    } else if (macro.mode === 'autotype') {
      // Auto-Type: start automatic typing
      this.state = 'typing'
      this.broadcastStatus()
      this.runAutoType(parsedMacro)
      console.log(`[TypingEngine] Armed (Auto-Type): "${macro.name}"`)
    } else if (macro.mode === 'burst') {
      // Burst: type everything at once
      console.log(`[TypingEngine] Burst: "${macro.name}"`)
      this.burstType(parsedMacro)
    }

    this.broadcastStatus()
  }

  /** Disarm and return to idle */
  disarm(): void {
    const wasActive = this.state !== 'idle'
    this.state = 'idle'
    this.activeMacro = null
    this.currentIndex = 0
    this.autoTypeAbort = true
    this.hook.setSuppression(false)

    if (wasActive) {
      console.log('[TypingEngine] Disarmed')
    }

    this.broadcastStatus()
  }

  /** Cleanup everything */
  destroy(): void {
    this.disarm()
    this.hook.stop()
    console.log('[TypingEngine] Destroyed')
  }

  // ---- Internal: Key Event Handler ----

  private handleKeyEvent(event: KeyEvent): void {
    const keyName = event.keyName.toUpperCase()

    if (this.isModifier(keyName)) {
      if (event.isKeyDown) {
        this.pressedModifiers.add(keyName)
      } else {
        this.pressedModifiers.delete(keyName)
      }
      return
    }

    if (!event.isKeyDown) return

    // IDLE: Check for hotkey triggers
    if (this.state === 'idle') {
      const hotkey = this.buildHotkey(keyName)
      const macroId = this.hotkeyMap.get(hotkey)
      if (macroId && this.getMacroById) {
        const macro = this.getMacroById(macroId)
        if (macro && macro.content.length > 0) {
          void this.armMacro(macro).catch((error) => {
            console.error('[TypingEngine] Failed to arm macro:', error)
            this.disarm()
          })
        }
      }
      return
    }

    // ARMED/TYPING: Check for abort (Escape)
    if (keyName === 'ESCAPE') {
      this.disarm()
      return
    }

    // INTERCEPT: Emit next character on any keypress
    if (this.state === 'armed' || (this.state === 'typing' && this.activeMacro?.mode === 'intercept')) {
      this.state = 'typing'
      this.emitNextChar()
    }
  }

  // ---- Internal: Intercept Mode ----

  private emitNextChar(): void {
    if (!this.activeMacro || this.currentIndex >= this.activeMacro.content.length) {
      this.completeMacro()
      return
    }

    const char = this.activeMacro.content[this.currentIndex]
    this.currentIndex++

    this.hook.simulateChar(char)
    this.broadcastStatus()

    if (this.currentIndex >= this.activeMacro.content.length) {
      setTimeout(() => this.completeMacro(), 30)
    }
  }

  // ---- Internal: Auto-Type ----

  private async runAutoType(macro: Macro): Promise<void> {
    const { min, max } = macro.typingSpeed

    for (let i = 0; i < macro.content.length; i++) {
      if (this.autoTypeAbort || this.state !== 'typing') return

      const char = macro.content[i]
      this.currentIndex = i + 1

      this.hook.simulateChar(char)
      this.broadcastStatus()

      let delay = min + Math.random() * (max - min)

      if (macro.humanize) {
        if ('.!?'.includes(char)) {
          delay += 150 + Math.random() * 300
        } else if (',;:'.includes(char)) {
          delay += 50 + Math.random() * 100
        } else if (char === '\n') {
          delay += 200 + Math.random() * 400
        } else if (char === ' ') {
          delay += Math.random() * 30
        }

        if (Math.random() < 0.03) {
          delay += 200 + Math.random() * 500
        }
      }

      await this.sleep(delay)
    }

    if (!this.autoTypeAbort && this.state === 'typing') {
      this.completeMacro()
    }
  }

  // ---- Internal: Burst ----

  private burstType(macro: Macro): void {
    // Iterate UTF-16 code units because SendInput expects one UTF-16 unit per event.
    // This preserves surrogate pairs used by emoji and other non-BMP characters.
    for (let i = 0; i < macro.content.length; i++) {
      this.hook.simulateChar(macro.content[i])
    }
    this.incrementUsage(macro.id)
    this.disarm()
  }

  // ---- Internal: Completion ----

  private completeMacro(): void {
    if (this.activeMacro) {
      this.incrementUsage(this.activeMacro.id)
      console.log(`[TypingEngine] Completed: "${this.activeMacro.name}"`)
    }
    this.disarm()
  }

  private incrementUsage(id: string): void {
    if (this.onUsageIncrement) {
      this.onUsageIncrement(id)
    }
  }

  // ---- Internal: Status Broadcasting ----

  private broadcastStatus(): void {
    const status = this.buildStatus()

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(IPC.ENGINE_STATUS, status)
    }

    this.onStatusChange?.(status)

    if (this.hudOverlay) {
      this.hudOverlay.updateStatus(status)
      if (status.state !== 'idle') {
        this.hudOverlay.show()
      } else {
        this.hudOverlay.hide()
      }
    }
  }

  private buildStatus(): EngineStatus {
    return {
      state: this.state,
      activeMacroName: this.activeMacro?.name || null,
      progress: this.activeMacro
        ? (this.currentIndex / this.activeMacro.content.length) * 100
        : 0,
      totalChars: this.activeMacro?.content.length || 0,
      currentIndex: this.currentIndex,
      preview: this.activeMacro
        ? this.activeMacro.content.slice(this.currentIndex, this.currentIndex + 30)
        : ''
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private isModifier(keyName: string): boolean {
    return ['CONTROL', 'SHIFT', 'ALT', 'META'].includes(keyName)
  }

  private buildHotkey(keyName: string): string {
    const modifiers = ['CONTROL', 'SHIFT', 'ALT', 'META']
      .filter((modifier) => this.pressedModifiers.has(modifier))
      .map((modifier) => (modifier === 'CONTROL' ? 'CTRL' : modifier))

    return [...modifiers, keyName].join('+')
  }
}
