import { createSlice } from '@reduxjs/toolkit'

const THEME_KEY = 'floarchive-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(THEME_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initialState = {
  theme: getInitialTheme(),
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_KEY, state.theme)
      }
    },
    setTheme(state, action) {
      state.theme = action.payload === 'dark' ? 'dark' : 'light'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_KEY, state.theme)
      }
    },
  },
})

export const { toggleTheme, setTheme } = uiSlice.actions
export default uiSlice.reducer

