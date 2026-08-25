import { useState, useEffect, useCallback, useRef, type FC } from 'react'

interface HotkeyPickerProps {
  value: string
  onChange: (hotkey: string) => void
  usedHotkeys?: string[]
}

/** Available function keys and special keys for macro hotkeys */
const PRESET_KEYS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']

/** Component to capture and display a keyboard hotkey */
export const HotkeyPicker: FC<HotkeyPickerProps> = ({ value, onChange, usedHotkeys = [] }) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [captureError, setCaptureError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  /** Listen for keydown when in capture mode */
  useEffect(() => {
    if (!isCapturing) return

    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const parts: string[] = []
      if (e.ctrlKey) parts.push('Ctrl')
      if (e.shiftKey) parts.push('Shift')
      if (e.altKey) parts.push('Alt')
      if (e.metaKey) parts.push('Meta')

      // Ignore modifier-only presses
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      } else {
        return
      }

      const hotkey = parts.join('+')

      if (e.key === 'Escape') {
        setCaptureError('Escape é reservado para cancelar uma macro.')
        setIsCapturing(false)
        setShowDropdown(true)
        return
      }

      const duplicate = usedHotkeys.some(
        (used) => used.toUpperCase() === hotkey.toUpperCase() && used.toUpperCase() !== value.toUpperCase()
      )
      if (duplicate) {
        setCaptureError('Esse atalho já está em uso por outra macro.')
        setIsCapturing(false)
        setShowDropdown(true)
        return
      }

      setCaptureError('')
      onChange(hotkey)
      setIsCapturing(false)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isCapturing, onChange, usedHotkeys, value])

  /** Close dropdown when clicking outside */
  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [showDropdown])

  const handlePresetClick = useCallback(
    (key: string) => {
      setCaptureError('')
      onChange(key)
      setShowDropdown(false)
    },
    [onChange]
  )

  const isUsed = (key: string) =>
    usedHotkeys.some(
      (used) => used.toUpperCase() === key.toUpperCase() && used.toUpperCase() !== value.toUpperCase()
    )

  return (
    <div className="hotkey-picker" ref={dropdownRef}>
      <div className="hotkey-picker__display" onClick={() => setShowDropdown(!showDropdown)}>
        {isCapturing ? (
          <span className="hotkey-picker__capturing">Pressione uma tecla...</span>
        ) : (
          <span className="hotkey-picker__value">{value || 'Nenhum'}</span>
        )}
      </div>

      {showDropdown && (
        <div className="hotkey-picker__dropdown animate-fade-in-scale">
          <div className="hotkey-picker__section-title">Teclas de Função</div>
          <div className="hotkey-picker__grid">
            {PRESET_KEYS.map((key) => (
              <button
                key={key}
                className={`hotkey-picker__key ${value === key ? 'hotkey-picker__key--selected' : ''} ${
                  isUsed(key) ? 'hotkey-picker__key--used' : ''
                }`}
                onClick={() => handlePresetClick(key)}
                disabled={isUsed(key)}
                title={isUsed(key) ? 'Já em uso por outro macro' : `Usar ${key}`}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="hotkey-picker__separator" />
          {captureError && <div className="hotkey-picker__error">{captureError}</div>}
          <button
            className="hotkey-picker__capture-btn"
            onClick={() => {
              setCaptureError('')
              setIsCapturing(true)
              setShowDropdown(false)
            }}
          >
            ⌨ Capturar tecla personalizada...
          </button>
        </div>
      )}
    </div>
  )
}
