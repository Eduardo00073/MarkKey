// ============================================
// MacroKey — Keyboard Hook via koffi FFI
// Calls Windows API directly from Node.js
// No C++ compiler needed!
// ============================================

import koffi from 'koffi'

// ---- Windows Constants ----
const WH_KEYBOARD_LL = 13
const WM_KEYDOWN = 0x0100
const WM_SYSKEYDOWN = 0x0104
const HC_ACTION = 0
const PM_REMOVE = 0x0001
const LLKHF_INJECTED = 0x00000010

const INPUT_KEYBOARD = 1
const KEYEVENTF_UNICODE = 0x0004
const KEYEVENTF_KEYUP = 0x0002

// Virtual Key codes
const VK_RETURN = 0x0D
const VK_TAB = 0x09
const VK_ESCAPE = 0x1B
const VK_SHIFT = 0x10
const VK_CONTROL = 0x11
const VK_MENU = 0x12    // Alt
const VK_LWIN = 0x5B
const VK_RWIN = 0x5C
const VK_LSHIFT = 0xA0
const VK_RSHIFT = 0xA1
const VK_LCONTROL = 0xA2
const VK_RCONTROL = 0xA3
const VK_LMENU = 0xA4
const VK_RMENU = 0xA5
const VK_CAPITAL = 0x14
const VK_NUMLOCK = 0x90
const VK_SCROLL = 0x91

// ---- Load Windows DLLs ----
const user32 = koffi.load('user32.dll')

// ---- Define struct types ----

// KBDLLHOOKSTRUCT (24 bytes on x64)
const KBDLLHOOKSTRUCT = koffi.struct('KBDLLHOOKSTRUCT', {
  vkCode: 'uint32',       // offset 0
  scanCode: 'uint32',     // offset 4
  flags: 'uint32',        // offset 8
  time: 'uint32',         // offset 12
  dwExtraInfo: 'uint64'   // offset 16 (ULONG_PTR on x64)
})

// INPUT struct for SendInput (keyboard variant, 40 bytes on x64)
// Layout matches the C union with KEYBDINPUT as the active member
const INPUT_KB = koffi.struct('INPUT_KB', {
  type: 'uint32',         // offset 0: INPUT_KEYBOARD = 1
  _pad0: 'uint32',        // offset 4: alignment padding
  wVk: 'uint16',          // offset 8
  wScan: 'uint16',        // offset 10
  dwFlags: 'uint32',      // offset 12
  time: 'uint32',         // offset 16
  _pad1: 'uint32',        // offset 20: alignment for dwExtraInfo
  dwExtraInfo: 'uint64',  // offset 24
  _fill: 'uint64'         // offset 32: padding to match MOUSEINPUT union size
})

// ---- Define callback & function prototypes ----

// LowLevelKeyboardProc callback: LRESULT CALLBACK(int nCode, WPARAM wParam, LPARAM lParam)
// Using void* for lParam so we keep the raw pointer for both decode AND pass-through
const LLKeyboardProc = koffi.proto('int64 LLKeyboardProc(int nCode, uint64 wParam, void *lParam)')

// Windows API function bindings
const SetWindowsHookExW = user32.func('void * SetWindowsHookExW(int idHook, LLKeyboardProc *lpfn, void *hmod, uint32 dwThreadId)')
const UnhookWindowsHookEx = user32.func('int UnhookWindowsHookEx(void *hhk)')
const CallNextHookEx = user32.func('int64 CallNextHookEx(void *hhk, int nCode, uint64 wParam, void *lParam)')
const PeekMessageW = user32.func('int PeekMessageW(void *lpMsg, void *hWnd, uint32 wMsgFilterMin, uint32 wMsgFilterMax, uint32 wRemoveMsg)')
const TranslateMessage = user32.func('int TranslateMessage(void *lpMsg)')
const DispatchMessageW = user32.func('int64 DispatchMessageW(void *lpMsg)')
const SendInput = user32.func('uint32 SendInput(uint32 cInputs, INPUT_KB *pInputs, int cbSize)')

// ---- Key event interface ----
export interface KeyEvent {
  isKeyDown: boolean
  keyName: string
}

type KeyEventCallback = (event: KeyEvent) => void

// ---- VK code to name mapping ----
const VK_NAMES: Record<number, string> = {
  0x1B: 'Escape', 0x0D: 'Enter', 0x09: 'Tab', 0x20: 'Space',
  0x08: 'Backspace', 0x2E: 'Delete',
  0x10: 'Shift', 0xA0: 'Shift', 0xA1: 'Shift',
  0x11: 'Control', 0xA2: 'Control', 0xA3: 'Control',
  0x12: 'Alt', 0xA4: 'Alt', 0xA5: 'Alt',
  0x5B: 'Meta', 0x5C: 'Meta',
  0x25: 'ArrowLeft', 0x27: 'ArrowRight', 0x26: 'ArrowUp', 0x28: 'ArrowDown',
  0x24: 'Home', 0x23: 'End', 0x21: 'PageUp', 0x22: 'PageDown',
  0x2D: 'Insert', 0x14: 'CapsLock', 0x90: 'NumLock', 0x91: 'ScrollLock',
  0x70: 'F1', 0x71: 'F2', 0x72: 'F3', 0x73: 'F4',
  0x74: 'F5', 0x75: 'F6', 0x76: 'F7', 0x77: 'F8',
  0x78: 'F9', 0x79: 'F10', 0x7A: 'F11', 0x7B: 'F12'
}

function vkCodeToName(vk: number): string {
  if (VK_NAMES[vk]) return VK_NAMES[vk]
  // Printable ASCII range (0-9, A-Z)
  if (vk >= 0x30 && vk <= 0x39) return String.fromCharCode(vk)
  if (vk >= 0x41 && vk <= 0x5A) return String.fromCharCode(vk)
  // Numpad 0-9
  if (vk >= 0x60 && vk <= 0x69) return `Numpad${vk - 0x60}`
  return `VK_${vk.toString(16).toUpperCase()}`
}

function isModifierKey(vk: number): boolean {
  return [
    VK_SHIFT, VK_CONTROL, VK_MENU, VK_LWIN, VK_RWIN,
    VK_LSHIFT, VK_RSHIFT, VK_LCONTROL, VK_RCONTROL,
    VK_LMENU, VK_RMENU, VK_CAPITAL, VK_NUMLOCK, VK_SCROLL
  ].includes(vk)
}

// ---- KeyboardHook class ----

export class KeyboardHook {
  private hookHandle: any = null
  private registeredCallback: any = null
  private pumpTimer: ReturnType<typeof setInterval> | null = null
  private msgBuffer: Buffer
  private _suppress = false
  private _active = false
  private onKeyEvent: KeyEventCallback | null = null

  constructor() {
    // Pre-allocate MSG buffer (48 bytes is more than enough for MSG struct on x64)
    this.msgBuffer = Buffer.alloc(64)
  }

  /** Start the global keyboard hook */
  start(callback: KeyEventCallback): boolean {
    if (this._active) return true

    this.onKeyEvent = callback

    try {
      // Register the hook callback with koffi
      this.registeredCallback = koffi.register(
        (nCode: number, wParam: number | bigint, lParam: any) => this.hookProc(nCode, wParam, lParam),
        koffi.pointer(LLKeyboardProc)
      )

      // Install the low-level keyboard hook
      this.hookHandle = SetWindowsHookExW(
        WH_KEYBOARD_LL,
        this.registeredCallback,
        null,  // hmod = NULL for thread hooks on current process
        0      // dwThreadId = 0 for all threads
      )

      if (!this.hookHandle) {
        console.error('[KeyboardHook] SetWindowsHookExW failed')
        this.releaseResources()
        return false
      }

      this._active = true

      // Start the Windows message pump
      // WH_KEYBOARD_LL requires a message loop to receive hook events
      this.pumpTimer = setInterval(() => this.pumpMessages(), 2)

      console.log('[KeyboardHook] Hook installed successfully')
      return true
    } catch (err) {
      console.error('[KeyboardHook] Failed to start:', err)
      this.releaseResources()
      return false
    }
  }

  /** Stop the keyboard hook */
  stop(): void {
    const wasActive = this._active
    this.releaseResources()

    if (wasActive) {
      console.log('[KeyboardHook] Hook removed')
    }
  }

  /** Release native resources, including partially initialized hooks */
  private releaseResources(): void {

    // Stop message pump
    if (this.pumpTimer) {
      clearInterval(this.pumpTimer)
      this.pumpTimer = null
    }

    // Unhook
    if (this.hookHandle) {
      UnhookWindowsHookEx(this.hookHandle)
      this.hookHandle = null
    }

    // Unregister callback
    if (this.registeredCallback) {
      koffi.unregister(this.registeredCallback)
      this.registeredCallback = null
    }

    this._active = false
    this._suppress = false
    this.onKeyEvent = null
  }

  /** Enable or disable key suppression */
  setSuppression(enabled: boolean): void {
    this._suppress = enabled
  }

  /** Simulate typing a single character using SendInput (Unicode) */
  simulateChar(char: string): void {
    if (!char) return

    const code = char.charCodeAt(0)

    if (char === '\n' || char === '\r') {
      // Send Enter key
      this.simulateVirtualKey(VK_RETURN)
    } else if (char === '\t') {
      // Send Tab key
      this.simulateVirtualKey(VK_TAB)
    } else {
      // Send Unicode character via SendInput
      const inputSize = koffi.sizeof(INPUT_KB)
      const down: any = {
        type: INPUT_KEYBOARD, _pad0: 0,
        wVk: 0, wScan: code, dwFlags: KEYEVENTF_UNICODE,
        time: 0, _pad1: 0, dwExtraInfo: 0n, _fill: 0n
      }
      const up: any = {
        type: INPUT_KEYBOARD, _pad0: 0,
        wVk: 0, wScan: code, dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
        time: 0, _pad1: 0, dwExtraInfo: 0n, _fill: 0n
      }
      SendInput(2, [down, up], inputSize)
    }
  }

  /** Simulate a virtual key press (down + up) */
  simulateVirtualKey(vk: number): void {
    const inputSize = koffi.sizeof(INPUT_KB)
    const down: any = {
      type: INPUT_KEYBOARD, _pad0: 0,
      wVk: vk, wScan: 0, dwFlags: 0,
      time: 0, _pad1: 0, dwExtraInfo: 0n, _fill: 0n
    }
    const up: any = {
      type: INPUT_KEYBOARD, _pad0: 0,
      wVk: vk, wScan: 0, dwFlags: KEYEVENTF_KEYUP,
      time: 0, _pad1: 0, dwExtraInfo: 0n, _fill: 0n
    }
    SendInput(2, [down, up], inputSize)
  }

  // ---- Internal ----

  /** The low-level keyboard hook procedure */
  private hookProc(nCode: number, wParam: number | bigint, lParam: any): number | bigint {
    if (nCode === HC_ACTION) {
      // Decode the KBDLLHOOKSTRUCT from the lParam pointer
      const kbd = koffi.decode(lParam, KBDLLHOOKSTRUCT)
      const vkCode = kbd.vkCode as number
      const flags = kbd.flags as number
      const wParamNum = Number(wParam)
      const isKeyDown = (wParamNum === WM_KEYDOWN || wParamNum === WM_SYSKEYDOWN)
      const isInjected = (flags & LLKHF_INJECTED) !== 0

      // Skip our own injected keys to prevent infinite loops
      if (isInjected) {
        return CallNextHookEx(this.hookHandle, nCode, wParam, lParam)
      }

      // Build event and notify JS callback
      const event: KeyEvent = {
        isKeyDown,
        keyName: vkCodeToName(vkCode)
      }

      if (this.onKeyEvent) {
        this.onKeyEvent(event)
      }

      // Suppress the key if suppression is active
      if (this._suppress && isKeyDown) {
        // Always allow Escape through (abort key)
        if (vkCode === VK_ESCAPE) {
          return CallNextHookEx(this.hookHandle, nCode, wParam, lParam)
        }

        // Always allow modifier keys through
        if (isModifierKey(vkCode)) {
          return CallNextHookEx(this.hookHandle, nCode, wParam, lParam)
        }

        // Suppress: return 1 to block the key from reaching the application
        return 1
      }
    }

    return CallNextHookEx(this.hookHandle, nCode, wParam, lParam)
  }

  /** Pump Windows messages to keep the hook alive */
  private pumpMessages(): void {
    // Process all pending messages (non-blocking)
    while (PeekMessageW(this.msgBuffer, null, 0, 0, PM_REMOVE)) {
      TranslateMessage(this.msgBuffer)
      DispatchMessageW(this.msgBuffer)
    }
  }
}
