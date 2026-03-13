/**
 * Client-side spectrogram computation - matches Python scipy.signal.spectrogram
 * Uses ml-fft for FFT (power of 2 required)
 */

import { FFT } from 'ml-fft'

export const FREQ_MIN = 100
export const FREQ_MAX = 10000
export const MIN_THRESHOLD_DB = -80
const TIME_RESOLUTION = 0.05

// Viridis colormap (sampled) - dark blue -> green -> yellow
const VIRIDIS = [
  [0.267004, 0.004874, 0.329415],
  [0.282327, 0.140926, 0.457517],
  [0.253935, 0.265254, 0.529983],
  [0.206756, 0.371758, 0.553117],
  [0.163625, 0.471133, 0.558148],
  [0.127568, 0.566949, 0.550556],
  [0.134692, 0.658636, 0.517649],
  [0.266941, 0.748751, 0.440573],
  [0.477504, 0.821444, 0.318195],
  [0.741388, 0.873449, 0.149561],
  [0.993248, 0.906157, 0.143936],
]

export function viridis(t) {
  t = Math.max(0, Math.min(1, t))
  const i = t * (VIRIDIS.length - 1)
  const i0 = Math.floor(i)
  const i1 = Math.min(i0 + 1, VIRIDIS.length - 1)
  const frac = i - i0
  const c0 = VIRIDIS[i0]
  const c1 = VIRIDIS[i1]
  return [
    c0[0] + frac * (c1[0] - c0[0]),
    c0[1] + frac * (c1[1] - c0[1]),
    c0[2] + frac * (c1[2] - c0[2]),
  ]
}

function hanningWindow(n) {
  const w = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))
  }
  return w
}

/**
 * Compute spectrogram - returns { f, t, Sxx_db } matching Python
 */
export function computeSpectrogram(samples, sampleRate) {
  const nperseg = Math.pow(2, Math.ceil(Math.log2(sampleRate * TIME_RESOLUTION)))
  const noverlap = Math.floor(nperseg / 2)
  const step = nperseg - noverlap

  const window = hanningWindow(nperseg)
  FFT.init(nperseg)

  const nFreqs = nperseg / 2 + 1
  const freqStep = sampleRate / nperseg
  const f = Array.from({ length: nFreqs }, (_, i) => i * freqStep)

  const nWindows = Math.floor((samples.length - noverlap) / step)
  const Sxx = new Float32Array(nFreqs * nWindows)

  const re = new Array(nperseg)
  const im = new Array(nperseg)

  for (let w = 0; w < nWindows; w++) {
    const start = w * step
    for (let i = 0; i < nperseg; i++) {
      re[i] = samples[start + i] * window[i]
      im[i] = 0
    }
    FFT.fft(re, im)

    for (let k = 0; k < nFreqs; k++) {
      const power = (re[k] * re[k] + im[k] * im[k]) / (nperseg * nperseg)
      let db = 10 * Math.log10(power + 1e-10)
      db = Math.max(db, MIN_THRESHOLD_DB)
      Sxx[k * nWindows + w] = db
    }
  }

  const t = Array.from({ length: nWindows }, (_, i) => (i * step) / sampleRate)

  return { f, t, Sxx, nFreqs, nWindows, freqStep }
}

/**
 * Compute Welch PSD - matches Python signal.welch
 */
export function computeWelchPSD(samples, sampleRate) {
  const nperseg = Math.pow(2, Math.ceil(Math.log2(sampleRate * TIME_RESOLUTION)))
  const noverlap = Math.floor(nperseg / 2)
  const step = nperseg - noverlap

  const window = hanningWindow(nperseg)
  FFT.init(nperseg)

  const nFreqs = nperseg / 2 + 1
  const freqStep = sampleRate / nperseg
  const f = Array.from({ length: nFreqs }, (_, i) => i * freqStep)

  const nWindows = Math.floor((samples.length - noverlap) / step)
  const windowPower = window.reduce((s, v) => s + v * v, 0) / nperseg
  const scale = 1 / (sampleRate * windowPower * nWindows)

  const psdSum = new Float32Array(nFreqs)
  const re = new Array(nperseg)
  const im = new Array(nperseg)

  for (let w = 0; w < nWindows; w++) {
    const start = w * step
    for (let i = 0; i < nperseg; i++) {
      re[i] = samples[start + i] * window[i]
      im[i] = 0
    }
    FFT.fft(re, im)

    for (let k = 0; k < nFreqs; k++) {
      const power = (re[k] * re[k] + im[k] * im[k]) / (nperseg * nperseg)
      psdSum[k] += power * scale
    }
  }

  const psd_db = new Float32Array(nFreqs)
  for (let k = 0; k < nFreqs; k++) {
    let db = 10 * Math.log10(psdSum[k] + 1e-10)
    db = Math.max(db, MIN_THRESHOLD_DB)
    psd_db[k] = db
  }

  return { f, psd_db }
}

/**
 * Filter spectrogram to freq range and get 2D matrix
 */
export function filterSpectrogram(result) {
  const { f, Sxx, nFreqs, nWindows } = result
  const indices = []
  const fFiltered = []
  for (let i = 0; i < nFreqs; i++) {
    if (f[i] >= FREQ_MIN && f[i] <= FREQ_MAX) {
      indices.push(i)
      fFiltered.push(f[i])
    }
  }
  const nFiltered = indices.length
  const SxxFiltered = new Float32Array(nFiltered * nWindows)
  for (let i = 0; i < nFiltered; i++) {
    const srcRow = indices[i]
    for (let col = 0; col < nWindows; col++) {
      SxxFiltered[i * nWindows + col] = Sxx[srcRow * nWindows + col]
    }
  }
  return { fFiltered, SxxFiltered, nFiltered, nWindows }
}
