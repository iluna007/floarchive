export function normalizeHex(input) {
  let s = String(input).trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null
}
export function hexToHsl(hex) {
  const n = normalizeHex(hex)
  if (!n) return null
  const r = parseInt(n.slice(1,3), 16) / 255, g = parseInt(n.slice(3,5), 16) / 255, b = parseInt(n.slice(5,7), 16) / 255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h, s
  const l = (max+min)/2
  if (max === min) h = s = 0
  else { const d = max - min; s = l > 0.5 ? d/(2-max-min) : d/(max+min)
    switch(max){ case r: h=((g-b)/d+(g<b?6:0))/6;break; case g: h=((b-r)/d+2)/6;break; default: h=((r-g)/d+4)/6 }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) }
}
export function parseHex(hex) { const n = normalizeHex(hex); return n ? hexToHsl(n) : null }
export function hslToHex(h,s,l) {
  s/=100; l/=100
  const a = s*Math.min(l,1-l)
  const f = n => { const k = (n+h/30)%12; return l - a*Math.max(Math.min(k-3,9-k,1),-1) }
  return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')
}
