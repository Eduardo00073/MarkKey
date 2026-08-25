// ============================================
// MacroKey — Import/Export Module
// Handles .macrokey file format (JSON-based)
// ============================================

import { app, dialog, BrowserWindow } from 'electron'
import fs from 'node:fs/promises'
import type { Macro, MacroInput, MacroMode } from '../shared/types'

/** File format version for forward compatibility */
const FORMAT_VERSION = 1

/** Export file structure */
interface MacroKeyFile {
  version: number
  exportedAt: string
  appVersion: string
  macros: ExportedMacro[]
}

/** Macro as stored in the export file (without runtime fields) */
type ExportedMacro = MacroInput

/**
 * Export macros to a .macrokey file
 * @returns The file path if saved, null if cancelled
 */
export async function exportMacros(
  macros: Macro[],
  parentWindow: BrowserWindow | null
): Promise<string | null> {
  const result = await dialog.showSaveDialog(parentWindow || BrowserWindow.getFocusedWindow()!, {
    title: 'Exportar Macros',
    defaultPath: `macrokey-backup-${getDateStamp()}.macrokey`,
    filters: [
      { name: 'MacroKey Files', extensions: ['macrokey'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ]
  })

  if (result.canceled || !result.filePath) return null

  const exportData: MacroKeyFile = {
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: app.getVersion(),
    macros: macros.map(stripRuntimeFields)
  }

  await fs.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8')
  return result.filePath
}

/**
 * Import macros from a .macrokey file
 * @returns Array of imported macros (without IDs — caller assigns them)
 */
export async function importMacros(
  parentWindow: BrowserWindow | null
): Promise<ExportedMacro[] | null> {
  const result = await dialog.showOpenDialog(parentWindow || BrowserWindow.getFocusedWindow()!, {
    title: 'Importar Macros',
    filters: [
      { name: 'MacroKey Files', extensions: ['macrokey'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const filePath = result.filePaths[0]
  const raw = await fs.readFile(filePath, 'utf-8')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Arquivo inválido: não é um JSON válido')
  }

  // Validate format
  if (
    !isRecord(parsed) ||
    !Number.isInteger(parsed.version) ||
    (parsed.version as number) < 1 ||
    !Array.isArray(parsed.macros)
  ) {
    throw new Error('Arquivo inválido: formato MacroKey não reconhecido')
  }

  const version = parsed.version as number
  if (version > FORMAT_VERSION) {
    throw new Error(
      `Versão do arquivo (${version}) é mais nova que a versão suportada (${FORMAT_VERSION}). Atualize o MacroKey.`
    )
  }

  // Validate and sanitize each macro
  return parsed.macros.map(sanitizeMacro)
}

// ---- Helpers ----

/** Strip runtime-only fields from a macro for export */
function stripRuntimeFields(macro: Macro): ExportedMacro {
  return {
    name: macro.name,
    content: macro.content,
    hotkey: macro.hotkey,
    category: macro.category,
    mode: macro.mode,
    isFavorite: macro.isFavorite,
    typingSpeed: macro.typingSpeed,
    humanize: macro.humanize
  }
}

/** Ensure all required fields exist with sensible defaults */
function sanitizeMacro(raw: unknown): ExportedMacro {
  const value = isRecord(raw) ? raw : {}
  const validModes: MacroMode[] = ['intercept', 'autotype', 'burst']
  const mode =
    typeof value.mode === 'string' && validModes.includes(value.mode as MacroMode)
      ? (value.mode as MacroMode)
      : 'intercept'

  const rawSpeed = isRecord(value.typingSpeed) ? value.typingSpeed : {}
  const firstDelay = normalizeDelay(rawSpeed.min, 30)
  const secondDelay = normalizeDelay(rawSpeed.max, 90)

  return {
    name: typeof value.name === 'string' && value.name ? value.name : 'Macro importado',
    content: typeof value.content === 'string' ? value.content : '',
    hotkey: typeof value.hotkey === 'string' ? value.hotkey : '',
    category: typeof value.category === 'string' && value.category ? value.category : 'general',
    mode,
    isFavorite: value.isFavorite === true,
    typingSpeed: {
      min: Math.min(firstDelay, secondDelay),
      max: Math.max(firstDelay, secondDelay)
    },
    humanize: value.humanize !== false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeDelay(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.round(value), 0), 500)
}

/** Format date stamp for file names */
function getDateStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
