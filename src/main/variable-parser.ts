// ============================================
// MacroKey — Dynamic Variable Parser
// Replaces {{variable}} tokens in macro content
// at execution time with live values
// ============================================

import { clipboard } from 'electron'
import { randomUUID } from 'node:crypto'
import os from 'node:os'

/** Token format: {{variableName}} or {{variableName:format}} */
const TOKEN_SINGLE_REGEX = /\{\{([a-zA-Z_]+)(?::([^}]*))?\}\}/
const TOKEN_GLOBAL_REGEX = /\{\{([a-zA-Z_]+)(?::([^}]*))?\}\}/g

/** Available variable definitions */
interface VariableContext {
  macroIndex: number
}

/**
 * Parse a macro content string and replace all {{variable}} tokens
 * with their current values.
 *
 * Supported variables:
 * - {{data}}           → Current date (DD/MM/YYYY)
 * - {{data:ISO}}       → ISO date (YYYY-MM-DD)
 * - {{data:US}}        → US date (MM/DD/YYYY)
 * - {{hora}}           → Current time (HH:MM:SS)
 * - {{hora:curta}}     → Short time (HH:MM)
 * - {{timestamp}}      → Unix timestamp
 * - {{clipboard}}      → Current clipboard text
 * - {{usuario}}        → OS username
 * - {{hostname}}       → Computer hostname
 * - {{random:N}}       → Random number with N digits
 * - {{uuid}}           → UUIDv4
 * - {{contador}}       → Execution count of this macro
 * - {{quebra}}         → Line break (\n)
 * - {{tab}}            → Tab character (\t)
 * - {{saudacao}}       → Time-aware greeting
 */
export async function parseVariables(content: string, context: VariableContext): Promise<string> {
  let clipboardText = ''
  if (listVariables(content).includes('clipboard')) {
    try {
      clipboardText = await clipboard.readText()
    } catch {
      clipboardText = ''
    }
  }

  return content.replace(TOKEN_GLOBAL_REGEX, (match, variable: string, format?: string) => {
    const varLower = variable.toLowerCase()

    switch (varLower) {
      // ---- Date/Time ----
      case 'data': {
        const now = new Date()
        if (format === 'ISO') {
          return now.toISOString().slice(0, 10)
        }
        if (format === 'US') {
          return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`
        }
        // Default: DD/MM/YYYY
        return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
      }

      case 'hora': {
        const now = new Date()
        if (format === 'curta') {
          return `${pad(now.getHours())}:${pad(now.getMinutes())}`
        }
        return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      }

      case 'timestamp':
        return String(Date.now())

      // ---- System ----
      case 'clipboard':
        return clipboardText

      case 'usuario':
        return os.userInfo().username

      case 'hostname':
        return os.hostname()

      // ---- Random/UUID ----
      case 'random': {
        const requestedDigits = parseInt(format || '6', 10)
        const digits = Number.isFinite(requestedDigits)
          ? Math.min(Math.max(requestedDigits, 1), 15)
          : 6
        const max = Math.pow(10, digits)
        return String(Math.floor(Math.random() * max)).padStart(digits, '0')
      }

      case 'uuid':
        return randomUUID()

      // ---- Macro context ----
      case 'contador':
        return String(context.macroIndex + 1)

      // ---- Special chars ----
      case 'quebra':
        return '\n'

      case 'tab':
        return '\t'

      // ---- Smart greeting ----
      case 'saudacao': {
        const hour = new Date().getHours()
        if (hour < 12) return 'Bom dia'
        if (hour < 18) return 'Boa tarde'
        return 'Boa noite'
      }

      default:
        // Unknown variable — leave as-is
        return match
    }
  })
}

/** Pad a number with leading zero */
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/**
 * Check if a content string contains any variables.
 * Useful to skip parsing when not needed.
 */
export function hasVariables(content: string): boolean {
  return TOKEN_SINGLE_REGEX.test(content)
}

/**
 * Get a list of all variable names used in the content.
 */
function listVariables(content: string): string[] {
  const vars: string[] = []
  let m: RegExpExecArray | null
  const regex = new RegExp(TOKEN_GLOBAL_REGEX.source, 'g')
  while ((m = regex.exec(content)) !== null) {
    vars.push(m[1].toLowerCase())
  }
  return [...new Set(vars)]
}
