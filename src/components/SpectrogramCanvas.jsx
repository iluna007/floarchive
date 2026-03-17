import { useState, useRef, useEffect } from 'react'
import { FREQ_MIN, FREQ_MAX, MIN_THRESHOLD_DB } from '../utils/spectrogramUtils'

const PADDING = 8
const LAYOUT = { width: 920, height: 520, leftColW: 90, rightColW: 810, topRowH: 380, bottomRowH: 120 }

// Black to red color map
function blackToRed(t) {
  // t goes from 0 (lowest/black) to 1 (highest/red)
  return [t, 0, 0];  // Red channel increases, green and blue stay at 0
}

export default function SpectrogramCanvas({ data }) {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const { SxxFiltered, nFiltered, nWindows, psd, waveform, tStart, tEnd, audioUrl } = data

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !SxxFiltered || nFiltered === 0 || nWindows === 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { width, height, leftColW, rightColW, topRowH, bottomRowH } = LAYOUT
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)
    const psdLeft = PADDING, psdWidth = leftColW - PADDING * 2
    const specLeft = leftColW + PADDING, specWidth = rightColW - PADDING * 2
    const specTop = PADDING, specHeight = topRowH - PADDING * 2
    const waveTop = topRowH + PADDING, waveHeight = bottomRowH - PADDING * 2, waveWidth = specWidth
    const psdFreq = [], psdDb = []
    for (let i = 0; i < psd.f.length; i++) {
      if (psd.f[i] >= FREQ_MIN && psd.f[i] <= FREQ_MAX) {
        psdFreq.push(psd.f[i])
        psdDb.push(psd.psd_db[i])
      }
    }
    ctx.fillStyle = '#000'
    ctx.fillRect(psdLeft, specTop, psdWidth, specHeight)
    if (psdFreq.length > 1) {
      const logMin = Math.log10(FREQ_MIN), logMax = Math.log10(FREQ_MAX)
      const dbMin = MIN_THRESHOLD_DB, dbMax = 0
      const dbToX = (db) => {
        const t = (db - dbMin) / (dbMax - dbMin)
        return psdLeft + psdWidth * (1 - Math.max(0, Math.min(1, t)))
      }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      for (let i = 0; i < psdFreq.length - 1; i++) {
        const logF = Math.log10(psdFreq[i]), logFNext = Math.log10(psdFreq[i + 1])
        const xCurve = dbToX(psdDb[i])
        const yTop = specTop + specHeight - ((logF - logMin) / (logMax - logMin)) * specHeight
        const yBottom = specTop + specHeight - ((logFNext - logMin) / (logMax - logMin)) * specHeight
        const barH = Math.max(1, yBottom - yTop)
        ctx.fillRect(xCurve, yTop, psdLeft + psdWidth - xCurve, barH)
      }
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < psdFreq.length; i++) {
        const logF = Math.log10(psdFreq[i])
        const x = dbToX(psdDb[i])
        const y = specTop + specHeight - ((logF - logMin) / (logMax - logMin)) * specHeight
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = '9px sans-serif'
      ctx.fillText('PSD', psdLeft + 2, specTop + 12)
    }
    let specDbMin = Infinity, specDbMax = -Infinity
    for (let k = 0; k < nFiltered * nWindows; k++) {
      const v = SxxFiltered[k]
      if (v < specDbMin) specDbMin = v
      if (v > specDbMax) specDbMax = v
    }
    const specDbRange = Math.max(specDbMax - specDbMin, 1)
    const specW = Math.floor(specWidth), specH = Math.floor(specHeight)
    const offscreen = document.createElement('canvas')
    offscreen.width = specW
    offscreen.height = specH
    const offCtx = offscreen.getContext('2d')
    const specImageData = offCtx.createImageData(specW, specH)
    for (let py = 0; py < specH; py++) {
      const freqIdx = Math.min(Math.floor((1 - py / specH) * nFiltered), nFiltered - 1)
      for (let px = 0; px < specW; px++) {
        const timeIdx = Math.min(Math.floor((px / specW) * nWindows), nWindows - 1)
        const db = SxxFiltered[freqIdx * nWindows + timeIdx]
        const t = (db - specDbMin) / specDbRange
        const [r, g, b] = blackToRed(Math.max(0, Math.min(1, t)))
        const i = (py * specW + px) * 4
        specImageData.data[i] = Math.round(r * 255)
        specImageData.data[i + 1] = Math.round(g * 255)
        specImageData.data[i + 2] = Math.round(b * 255)
        specImageData.data[i + 3] = 255
      }
    }
    offCtx.putImageData(specImageData, 0, 0)
    ctx.drawImage(offscreen, specLeft, specTop, specWidth, specHeight)
    ctx.strokeStyle = '#fff'
    ctx.strokeRect(specLeft, specTop, specWidth, specHeight)
    ctx.fillStyle = '#fff'
    ctx.font = '10px sans-serif'
    ctx.fillText('Spectrogram', specLeft + specWidth / 2 - 35, specTop + 12)
    const freqTicks = [250, 500, 1000, 2000, 4000, 8000]
    ctx.font = '8px sans-serif'
    const logMin = Math.log10(FREQ_MIN), logMax = Math.log10(FREQ_MAX)
    freqTicks.forEach((f) => {
      if (f >= FREQ_MIN && f <= FREQ_MAX) {
        const logF = Math.log10(f)
        const y = specTop + specHeight - ((logF - logMin) / (logMax - logMin)) * specHeight
        ctx.fillText(f >= 1000 ? `${f / 1000}k` : String(f), specLeft + 2, y + 3)
      }
    })
    ctx.fillStyle = '#000'
    ctx.fillRect(specLeft, waveTop, waveWidth, waveHeight)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    const waveLen = waveform.length
    ctx.beginPath()
    for (let i = 0; i < waveWidth; i++) {
      const idx = Math.floor((i / waveWidth) * waveLen)
      const val = waveform[idx] || 0
      const x = specLeft + i
      const y = waveTop + waveHeight / 2 - (val * waveHeight) / 2.2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    for (let i = waveWidth - 1; i >= 0; i--) {
      const idx = Math.floor((i / waveWidth) * waveLen)
      const val = waveform[idx] || 0
      const x = specLeft + i
      const y = waveTop + waveHeight / 2 + (val * waveHeight) / 2.2
      ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    const barX = specLeft + playbackProgress * waveWidth
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(barX - 1, waveTop, 3, waveHeight)
    ctx.strokeStyle = '#fff'
    ctx.strokeRect(specLeft, waveTop, waveWidth, waveHeight)
    ctx.fillStyle = '#fff'
    ctx.font = '9px sans-serif'
    ctx.fillText('Amplitude over time', specLeft + waveWidth / 2 - 50, waveTop + 12)
    for (let i = 0; i <= 6; i++) {
      const t = tStart + (i / 6) * (tEnd - tStart)
      const x = specLeft + (i / 6) * waveWidth
      ctx.fillText(String(Math.round(t)), x - 6, waveTop + waveHeight - 2)
    }
    const cbarLeft = psdLeft, cbarWidth = psdWidth, cbarH = waveHeight * 0.6, cbarY = waveTop + (waveHeight - cbarH) / 2
    ctx.fillStyle = '#000'
    ctx.fillRect(cbarLeft, waveTop, cbarWidth, waveHeight)
    for (let i = 0; i < cbarWidth; i++) {
      const t = i / cbarWidth
      const [r, g, b] = blackToRed(t)
      ctx.fillStyle = 'rgb(' + Math.round(r*255) + ',' + Math.round(g*255) + ',' + Math.round(b*255) + ')'
      ctx.fillRect(cbarLeft + i, cbarY, 1, cbarH)
    }
    ctx.fillStyle = '#fff'
    ctx.font = '8px sans-serif'
    ctx.fillText('dBFS', cbarLeft + 2, waveTop + 10)
    ctx.fillText(Math.round(specDbMax).toString(), cbarLeft + cbarWidth - 12, cbarY + 8)
    ctx.fillText(Math.round(specDbMin).toString(), cbarLeft + 2, cbarY + cbarH - 2)
    ctx.restore()
  }, [data, playbackProgress])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) setPlaybackProgress(audio.currentTime / audio.duration)
    }
    const onEnded = () => setPlaybackProgress(0)
    const onPlay = () => setPlaybackProgress(audio.currentTime / (audio.duration || 1))
    const onPause = () => setPlaybackProgress(audio.currentTime / (audio.duration || 1))
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [audioUrl])

  return (
    <div className="spectrogram-canvas-wrapper">
      <div className="spectrogram-canvas-container">
        <canvas ref={canvasRef} className="spectrogram-canvas" />
      </div>
      <audio ref={audioRef} src={audioUrl} controls className="spectrogram-audio" />
      <p className="spectrogram-note">Spectrogram, PSD, and waveform. Play audio to see the red bar move. First 2 min shown for long recordings.</p>
    </div>
  )
}
