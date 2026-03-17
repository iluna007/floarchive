import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  visibleLayerIds: [],
}

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    toggleLayer(state, action) {
      const id = action.payload
      if (!id) return
      if (state.visibleLayerIds.includes(id)) {
        state.visibleLayerIds = state.visibleLayerIds.filter((x) => x !== id)
      } else {
        state.visibleLayerIds.push(id)
      }
    },
    setVisibleLayers(state, action) {
      state.visibleLayerIds = Array.isArray(action.payload) ? action.payload : []
    },
  },
})

export const { toggleLayer, setVisibleLayers } = mapSlice.actions
export default mapSlice.reducer

export const selectVisibleLayerIds = (state) => state.map.visibleLayerIds

