import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './uiSlice'
import timelineReducer from './timelineSlice'
import mapReducer from './mapSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    timeline: timelineReducer,
    map: mapReducer,
  },
})

