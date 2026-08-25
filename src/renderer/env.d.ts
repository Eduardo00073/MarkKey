import type { MacroKeyAPI } from '../preload/index'

declare global {
  interface Window {
    api: MacroKeyAPI
  }
}
