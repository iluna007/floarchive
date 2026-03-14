import { useState, useRef, useEffect, useCallback } from 'react'

const BG_COLOR_KEY = 'floarchive-bg-color'
const DEFAULT_LABEL = 'Default'

function normalizeHex(input) {
  let s = String(input).trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null
}

function hexToHsl(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized)
  if (!result) return null
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      default: h = ((r - g) / d + 4) / 6
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function parseHex(hex) {
  const normalized = normalizeHex(hex)
  return normalized ? hexToHsl(normalized) : null
}

function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  const r = Math.round(f(0) * 255)
  const g = Math.round(f(8) * 255)
  const b = Math.round(f(4) * 255)
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export function getStoredBgColor() {
  try {
    const s = localStorage.getItem(BG_COLOR_KEY)
    if (!s || s === 'default') return null
    return s
  } catch {
    return null
  }
}

export function setStoredBgColor(hexOrNull) {
  try {
    if (hexOrNull == null) localStorage.removeItem(BG_COLOR_KEY)
    else localStorage.setItem(BG_COLOR_KEY, hexOrNull)
  } catch {}
}

const INITIAL_HSL = { h: 200, s: 100, l: 95 }

export default function BackgroundColorPicker({ currentColor, onColorChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const wheelRef = useRef(null)
  const barRef = useRef(null)

  const getInitialHsl = useCallback(() => {
    if (currentColor) return hexToHsl(currentColor) ?? INITIAL_HSL
    return INITIAL_HSL
  }, [currentColor])

  const [hsl, setHsl] = useState(() => getInitialHsl())
  const [hexInput, setHexInput] = useState('')

  useEffect(() => {
    if (open) {
      const initial = getInitialHsl()
      setHsl(initial)
      setHexInput(hslToHex(initial.h, initial.s, initial.l))
    }
  }, [open, getInitialHsl])

  useEffect(() => {
    if (open) setHexInput(hslToHex(hsl.h, hsl.s, hsl.l))
  }, [open, hsl.h, hsl.s, hsl.l])

  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [open])

  const updateHue = useCallback((clientX, clientY) => {
    const el = wheelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const angle = Math.atan2(clientY - cy, clientX - cx)
    let deg = (angle * (180 / Math.PI) + 90 + 360) % 360
    if (deg < 0) deg += 360
    setHsl((prev) => ({ ...prev, h: Math.round(deg) }))
  }, [])

  const updateLightness = useCallback((clientY) => {
    const el = barRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))
    setHsl((prev) => ({ ...prev, l: Math.round(t * 100) }))
  }, [])

  const handleWheelMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    updateHue(e.clientX, e.clientY)
    const onMove = (e2) => updateHue(e2.clientX, e2.clientY)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleBarMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    updateLightness(e.clientY)
    const onMove = (e2) => updateLightness(e2.clientY)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const applyColor = () => {
    const hex = hslToHex(hsl.h, hsl.s, hsl.l)
    onColorChange(hex)
    setOpen(false)
  }

  const setDefault = () => {
    onColorChange(null)
    setOpen(false)
  }

  const currentHex = hslToHex(hsl.h, hsl.s, hsl.l)
  const handleHexChange = (e) => {
    const v = e.target.value
    setHexInput(v)
    const parsed = parseHex(v)
    if (parsed) setHsl(parsed)
  }
  const handleHexBlur = () => setHexInput(currentHex)

  const icon = '\u263C'
  const hueStyle = {
    background: `conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`,
  }
  const barStyle = {
    background: `linear-gradient(to top, #000, hsl(${hsl.h}, 100%, 50%), #fff)`,
  }

  return (
    <div className="bg-color-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        className="bg-color-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose background color"
        title="Background color"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="theme-icon bg-color-icon" aria-hidden>{icon}</span>
      </button>
      {open && (
        <div className="bg-color-picker bg-color-picker-retro" role="dialog" aria-label="Background color picker">
          <div className="bg-color-retro-header">Background color</div>
          <div className="bg-color-wheel-row">
            <div
              ref={wheelRef}
              className="bg-color-wheel"
              style={hueStyle}
              onMouseDown={handleWheelMouseDown}
              onClick={(e) => e.stopPropagation()}
              role="slider"
              aria-label="Hue"
              aria-valuenow={hsl.h}
              aria-valuemin={0}
              aria-valuemax={360}
            >
              <div className="bg-color-wheel-inner">
                <div
                  className="bg-color-wheel-handle"
                  style={{
                    transform: `rotate(${hsl.h}deg)`,
                  }}
                />
              </div>
            </div>
            <div className="bg-color-lightness-wrap">
              <div
                ref={barRef}
                className="bg-color-lightness-bar"
                style={barStyle}
                onMouseDown={handleBarMouseDown}
                onClick={(e) => e.stopPropagation()}
                role="slider"
                aria-label="Lightness"
                aria-valuenow={hsl.l}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bg-color-lightness-handle"
                  style={{ bottom: `${hsl.l}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-color-hex-row">
            <label htmlFor="bg-color-hex-input" className="bg-color-hex-label">Hex</label>
            <input
              id="bg-color-hex-input"
              type="text"
              className="bg-color-hex-input"
              value={hexInput}
              onChange={handleHexChange}
              onBlur={handleHexBlur}
              placeholder="#000000"
              aria-label="Color hex code"
            />
          </div>
          <div className="bg-color-retro-preview" style={{ backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l) }} />
          <div className="bg-color-retro-actions">
            <button type="button" className="bg-color-default" onClick={setDefault}>
              {DEFAULT_LABEL}
            </button>
            <button type="button" className="bg-color-apply" onClick={applyColor}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
