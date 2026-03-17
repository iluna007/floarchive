import { createSlice } from '@reduxjs/toolkit'
import { archive } from '../data/archive'
import { getTimeRange, toTimestamp } from '../utils/datetime'

const itemsWithDatetime = archive.filter(
  (item) => item.datetime && typeof item.datetime === 'object'
)

const fullRangeCalculated = getTimeRange(itemsWithDatetime)

const initialState = {
  fullRange: fullRangeCalculated,
  viewRange: { min: fullRangeCalculated.min, max: fullRangeCalculated.max },
  selectedItemId: null,
}

const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setViewRange(state, action) {
      const { min, max } = action.payload || {}
      if (typeof min === 'number' && typeof max === 'number' && max > min) {
        state.viewRange = { min, max }
      }
    },
    resetViewRange(state) {
      state.viewRange = { ...state.fullRange }
    },
    selectItem(state, action) {
      state.selectedItemId = action.payload ?? null
    },
  },
})

export const { setViewRange, resetViewRange, selectItem } = timelineSlice.actions
export default timelineSlice.reducer

export const selectTimeline = (state) => state.timeline
export const selectViewRange = (state) => state.timeline.viewRange
export const selectFullRange = (state) => state.timeline.fullRange
export const selectSelectedItemId = (state) => state.timeline.selectedItemId

export const selectItemsInView = (state) => {
  const { min, max } = state.timeline.viewRange
  return itemsWithDatetime.filter((item) => {
    const ts = toTimestamp(item.datetime)
    return ts >= min && ts <= max
  })
}

