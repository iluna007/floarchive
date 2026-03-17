import { useRef, useState, useEffect, useMemo } from 'react'
import {
  toTimestamp,
  findNearestItem,
  formatTimestamp,
  getTickLabels,
  getGridLines,
  getScaleFromRangeMs,
} from '../utils/datetime'
import { getUniqueCategories, getItemCategories, getCategoryColor, CATEGORY_COLORS } from '../utils/categoryColors'

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS)
const ZOOM_FACTOR = 0.5
const MIN_ZOOM_RANGE_MS = 3600000

export default function InteractiveTimeline({
  items,
  visibleItems,
  selectedItem,
  onSelectItem,
  viewRange,
  onViewRangeChange,
  fullRange,
}) {
  const trackRef = useRef(null)
  const onViewRangeChangeRef = useRef(onViewRangeChange)
  onViewRangeChangeRef.current = onViewRangeChange

  const { min, max } = viewRange
  const range = max - min || 1
  const isZoomed = min > fullRange.min || max < fullRange.max

  const scale = getScaleFromRangeMs(range)
  const ticks = getTickLabels(min, max, scale, 5)
  const gridLines = getGridLines(min, max, scale)

  const handleTrackClick = (e) => {
    if (didDragRef.current) return
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const ratio = 1 - y / rect.height
    const timestamp = min + ratio * range
    const nearest = findNearestItem(visibleItems, timestamp)
    if (nearest) onSelectItem(nearest)
  }

  const handleTrackDoubleClick = (e) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const ratio = 1 - y / rect.height
    const timestamp = min + ratio * range
    const newRange = range * ZOOM_FACTOR
    const newMin = Math.max(fullRange.min, timestamp - newRange / 2)
    const newMax = Math.min(fullRange.max, newMin + newRange)
    const clampedMin = Math.max(fullRange.min, newMax - newRange)
    onViewRangeChangeRef.current({ min: clampedMin, max: newMax })
  }

  const handleResetZoom = () => {
    onViewRangeChangeRef.current({ min: fullRange.min, max: fullRange.max })
  }

  const [dragStart, setDragStart] = useState(null)
  const didDragRef = useRef(false)

  const handleZoomIn = () => {
    const centerTs = (min + max) / 2
    const newRange = Math.max(MIN_ZOOM_RANGE_MS, range * ZOOM_FACTOR)
    let newMin = centerTs - newRange / 2
    let newMax = centerTs + newRange / 2
    if (newMin < fullRange.min) {
      newMin = fullRange.min
      newMax = Math.min(fullRange.max, fullRange.min + newRange)
    }
    if (newMax > fullRange.max) {
      newMax = fullRange.max
      newMin = Math.max(fullRange.min, fullRange.max - newRange)
    }
    onViewRangeChangeRef.current({ min: newMin, max: newMax })
  }

  const handleZoomOut = () => {
    const centerTs = (min + max) / 2
    const newRange = Math.min(fullRange.max - fullRange.min, range / ZOOM_FACTOR)
    let newMin = centerTs - newRange / 2
    let newMax = centerTs + newRange / 2
    if (newMin < fullRange.min) {
      newMin = fullRange.min
      newMax = Math.min(fullRange.max, fullRange.min + newRange)
    }
    if (newMax > fullRange.max) {
      newMax = fullRange.max
      newMin = Math.max(fullRange.min, fullRange.max - newRange)
    }
    onViewRangeChangeRef.current({ min: newMin, max: newMax })
  }

  const handleStep = (direction) => {
    const step = range * 0.5
    let newMin = min + step * direction
    let newMax = max + step * direction
    const rangeSize = max - min

    if (newMin < fullRange.min) {
      newMin = fullRange.min
      newMax = fullRange.min + rangeSize
    }
    if (newMax > fullRange.max) {
      newMax = fullRange.max
      newMin = fullRange.max - rangeSize
    }

    onViewRangeChangeRef.current({ min: newMin, max: newMax })
  }

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setDragStart({ y: e.clientY, min, max })
      didDragRef.current = false
    }
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey) {
        const rect = el.getBoundingClientRect()
        const y = e.clientY - rect.top
        const ratio = 1 - y / rect.height
        const centerTs = min + ratio * range
        const delta = e.deltaY > 0 ? 1.25 : 0.8
        let newRange = range * delta
        newRange = Math.max(MIN_ZOOM_RANGE_MS, Math.min(fullRange.max - fullRange.min, newRange))
        let newMin = centerTs - newRange / 2
        let newMax = centerTs + newRange / 2
        if (newMin < fullRange.min) {
          newMin = fullRange.min
          newMax = Math.min(fullRange.max, fullRange.min + newRange)
        }
        if (newMax > fullRange.max) {
          newMax = fullRange.max
          newMin = Math.max(fullRange.min, fullRange.max - newRange)
        }
        onViewRangeChangeRef.current({ min: newMin, max: newMax })
      } else {
        const dir = e.deltaY > 0 ? 1 : -1
        handleStep(dir)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [min, max, range, fullRange.min, fullRange.max])

  useEffect(() => {
    if (!dragStart) return
    const onMove = (e) => {
      didDragRef.current = true
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return
      const dy = (e.clientY - dragStart.y) / rect.height
      const rangeSize = dragStart.max - dragStart.min
      const delta = dy * rangeSize
      const newMin = Math.max(fullRange.min, Math.min(fullRange.max - rangeSize, dragStart.min + delta))
      onViewRangeChangeRef.current({ min: newMin, max: newMin + rangeSize })
    }
    const onUp = () => setDragStart(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragStart, fullRange.min, fullRange.max])

  const itemsInView = visibleItems
  const categories = useMemo(() => {
    const fromItems = getUniqueCategories(items)
    return fromItems.length >= ALL_CATEGORIES.length
      ? fromItems
      : [...new Set([...ALL_CATEGORIES, ...fromItems])].sort()
  }, [items])

  return (
    <div className="interactive-timeline">
      <div className="timeline-header">
        <div className="timeline-controls">
          <button
            type="button"
            className="timeline-control-btn"
            onClick={() => handleStep(-1)}
            title="Mover atrás en el tiempo"
            aria-label="Move backward in time"
          >
            ↑
          </button>
          <button
            type="button"
            className="timeline-control-btn"
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            className="timeline-control-btn"
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="timeline-control-btn"
            onClick={() => handleStep(1)}
            title="Mover adelante en el tiempo"
            aria-label="Move forward in time"
          >
            ↓
          </button>
          {isZoomed && (
            <button
              type="button"
              className="timeline-reset-btn"
              onClick={handleResetZoom}
              title="View full range"
              aria-label="Reset zoom"
            >
              ⊡
            </button>
          )}
        </div>
        <div className="timeline-header-labels">
          <span className="timeline-legend-label">{formatTimestamp(max, scale)}</span>
          <span className="timeline-legend-label">{formatTimestamp(min, scale)}</span>
        </div>
      </div>
      <div className="timeline-main">
        <div className="timeline-track-wrapper">
          <div
            ref={trackRef}
            className={`timeline-track ${dragStart ? 'timeline-dragging' : ''}`}
            onClick={handleTrackClick}
            onDoubleClick={handleTrackDoubleClick}
            onMouseDown={handleMouseDown}
            role="slider"
            aria-label="Timeline: scroll to zoom, double-click to zoom in, drag to pan"
            title="Scroll: zoom · Double-click: zoom in · Drag: pan"
            tabIndex={0}
          >
          <div className="timeline-grid">
            {gridLines.map((line, i) => (
              <div
                key={i}
                className="timeline-grid-line"
                style={{ bottom: `${line.position}%` }}
              />
            ))}
          </div>
          {ticks.map((tick) => (
            <div
              key={tick.ts}
              className="timeline-tick"
              style={{ bottom: `${tick.position}%` }}
              title={tick.label}
            >
              <span className="timeline-tick-line" />
              <span className="timeline-tick-label">{tick.label}</span>
            </div>
          ))}
          <div className="timeline-bands">
            {categories.length <= 1 ? (
              <div className="timeline-band" style={{ flex: 1, minHeight: 0 }}>
                {itemsInView.map((item) => {
                  const ts = toTimestamp(item.datetime)
                  const position = ((ts - min) / range) * 100
                  const isSelected = selectedItem?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`timeline-marker ${isSelected ? 'selected' : ''}`}
                      style={{ bottom: `${position}%` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectItem(item)
                      }}
                      title={`${item.title} — ${formatTimestamp(ts, scale)}`}
                    >
                      <span className="timeline-marker-dot" />
                    </button>
                  )
                })}
              </div>
            ) : (
              categories.map((category) => (
                <div key={category} className="timeline-band timeline-band-parallel">
                  <span
                    className="timeline-band-label"
                    style={{ color: getCategoryColor(category) }}
                  >
                    {category}
                  </span>
                  {itemsInView
                    .filter((item) => getItemCategories(item).includes(category))
                    .map((item) => {
                      const ts = toTimestamp(item.datetime)
                      const position = ((ts - min) / range) * 100
                      const isSelected = selectedItem?.id === item.id
                      return (
                        <button
                          key={`${item.id}-${category}`}
                          type="button"
                          className={`timeline-marker ${isSelected ? 'selected' : ''}`}
                          style={{
                            bottom: `${position}%`,
                            ['--marker-color']: getCategoryColor(category),
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectItem(item)
                          }}
                          title={`${item.title} — ${formatTimestamp(ts, scale)} (${category})`}
                        >
                          <span className="timeline-marker-dot" />
                        </button>
                      )
                    })}
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
