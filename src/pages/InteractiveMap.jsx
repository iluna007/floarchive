import { useEffect, useRef, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { archive } from '../data/archive'
import { GEOJSON_LAYERS } from '../data/geojsonLayers'
import DetailPanel from '../components/DetailPanel'
import InteractiveTimeline from '../components/InteractiveTimeline'
import MapLayersPanel from '../components/MapLayersPanel'
import { getTimeRange, filterItemsByRange } from '../utils/datetime'
import { getItemPrimaryColor } from '../utils/categoryColors'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE_LIGHT = 'mapbox://styles/ikerluna/cmmp9964u005401rzhlycalmk'
const MAP_STYLE_DARK = 'mapbox://styles/ikerluna/cmmp97lzz001o01s46t647djn'

const itemsWithCoords = archive.filter(
  (item) => item.coordinates && item.coordinates.lat != null && item.coordinates.lng != null
)

const itemsWithDatetime = archive.filter(
  (item) => item.datetime && typeof item.datetime === 'object'
)

const itemsWithDatetimeAndCoords = itemsWithDatetime.filter(
  (item) => item.coordinates && item.coordinates.lat != null && item.coordinates.lng != null
)

const fullRange = getTimeRange(itemsWithDatetime)

function createMapMarker(item, map, onSelect) {
  const [lng, lat] = [item.coordinates.lng, item.coordinates.lat]
  const el = document.createElement('div')
  el.className = 'map-marker'
  const pin = document.createElement('span')
  pin.className = 'map-marker-pin'
  pin.style.backgroundColor = getItemPrimaryColor(item)
  el.appendChild(pin)
  el.dataset.id = item.id
  const marker = new mapboxgl.Marker({ element: el })
    .setLngLat([lng, lat])
    .addTo(map)
  el.addEventListener('click', () => onSelect(item))
  return marker
}

function geometryTypeToMapboxLayer(geomType) {
  const t = (geomType || '').toLowerCase()
  if (t === 'point' || t === 'multipoint') return 'circle'
  if (t === 'linestring' || t === 'multilinestring') return 'line'
  if (t === 'polygon' || t === 'multipolygon') return 'fill'
  return 'line'
}

async function addGeojsonLayer(map, layerConfig, visible) {
  const sourceId = `geojson-${layerConfig.id}`
  const layerId = `geojson-${layerConfig.id}-layer`
  try {
    const res = await fetch(layerConfig.url)
    if (!res.ok) throw new Error(res.statusText)
    const geojson = await res.json()
    const firstType =
      geojson?.features?.[0]?.geometry?.type ?? (layerConfig.type === 'point' ? 'Point' : 'Polygon')
    const layerType = layerConfig.type === 'point' ? 'circle' : geometryTypeToMapboxLayer(firstType)

    const outlineLayerId = `${layerId}-line`
    if (map.getSource(sourceId)) {
      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId)
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      map.removeSource(sourceId)
    }

    map.addSource(sourceId, { type: 'geojson', data: geojson })
    const visibility = visible ? 'visible' : 'none'

    const c = layerConfig

    if (layerType === 'circle') {
      map.addLayer(
        {
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': c.pointRadius ?? 6,
            'circle-color': c.pointColor ?? '#2563eb',
            'circle-stroke-width': c.pointStrokeWidth ?? 1,
            'circle-stroke-color': c.pointStrokeColor ?? '#fff',
          },
          layout: { visibility },
        },
        undefined
      )
    } else if (layerType === 'line') {
      const linePaint = {
        'line-color': c.lineColor ?? '#2563eb',
        'line-width': c.lineWidth ?? 2,
      }
      if (c.lineDasharray && c.lineDasharray.length) linePaint['line-dasharray'] = c.lineDasharray
      map.addLayer(
        {
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: linePaint,
          layout: { visibility },
        },
        undefined
      )
    } else {
      map.addLayer(
        {
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': c.fillColor ?? '#2563eb',
            'fill-opacity': c.fillOpacity ?? 0.35,
            'fill-outline-color': c.fillOutlineColor ?? '#1d4ed8',
          },
          layout: { visibility },
        },
        undefined
      )
      if (c.lineDasharray && c.lineDasharray.length) {
        map.addLayer(
          {
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': c.lineColor ?? c.fillOutlineColor ?? '#1d4ed8',
              'line-width': c.lineWidth ?? 2,
              'line-dasharray': c.lineDasharray,
            },
            layout: { visibility },
          },
          undefined
        )
      }
    }
    return layerId
  } catch (err) {
    console.warn('GeoJSON layer failed:', layerConfig.id, err)
    return null
  }
}

export default function InteractiveMap({ theme = 'light' }) {
  const mapStyle = theme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const geojsonLayerIdsRef = useRef([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [visibleLayerIds, setVisibleLayerIds] = useState([])
  const [viewRange, setViewRange] = useState({ min: fullRange.min, max: fullRange.max })

  const visibleItems = useMemo(
    () => filterItemsByRange(itemsWithDatetime, viewRange.min, viewRange.max),
    [viewRange.min, viewRange.max]
  )

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    if (item?.coordinates && mapRef.current) {
      const [lng, lat] = [item.coordinates.lng, item.coordinates.lat]
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 800 })
    }
  }

  useEffect(() => {
    if (selectedItem && !visibleItems.some((i) => i.id === selectedItem.id)) {
      setSelectedItem(null)
    }
  }, [visibleItems, selectedItem])

  const handleSelectRef = useRef(handleSelectItem)
  handleSelectRef.current = handleSelectItem
  const visibleLayerIdsRef = useRef(visibleLayerIds)
  visibleLayerIdsRef.current = visibleLayerIds

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || itemsWithDatetimeAndCoords.length === 0) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const bounds = new mapboxgl.LngLatBounds()
    itemsWithDatetimeAndCoords.forEach((item) => {
      bounds.extend([item.coordinates.lng, item.coordinates.lat])
    })

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      bounds: bounds,
      fitBoundsOptions: { padding: 50, maxZoom: 10 },
    })

    mapRef.current = map
    geojsonLayerIdsRef.current = []

    const onSelect = (item) => handleSelectRef.current(item)

    map.once('load', () => {
      const markers = itemsWithDatetimeAndCoords.map((item) =>
        createMapMarker(item, map, onSelect)
      )
      markersRef.current = markers

      GEOJSON_LAYERS.forEach((cfg) => {
        const visible = visibleLayerIdsRef.current.includes(cfg.id)
        addGeojsonLayer(map, cfg, visible).then((layerId) => {
          if (layerId) {
            geojsonLayerIdsRef.current.push(layerId)
            const nowVisible = visibleLayerIdsRef.current.includes(cfg.id)
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', nowVisible ? 'visible' : 'none')
            }
          }
        })
      })
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
      geojsonLayerIdsRef.current = []
    }
  }, [])

  const isInitialMount = useRef(true)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    map.setStyle(mapStyle)
    map.once('style.load', () => {
      const onSelect = (item) => handleSelectRef.current(item)
      markersRef.current.forEach((m) => m.remove())
      const markers = itemsWithDatetimeAndCoords.map((item) =>
        createMapMarker(item, map, onSelect)
      )
      markersRef.current = markers
      geojsonLayerIdsRef.current = []
      GEOJSON_LAYERS.forEach((cfg) => {
        const visible = visibleLayerIdsRef.current.includes(cfg.id)
        addGeojsonLayer(map, cfg, visible).then((layerId) => {
          if (layerId) {
            geojsonLayerIdsRef.current.push(layerId)
            const nowVisible = visibleLayerIdsRef.current.includes(cfg.id)
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', nowVisible ? 'visible' : 'none')
            }
          }
        })
      })
    })
  }, [mapStyle])

  useEffect(() => {
    const visibleIds = new Set(visibleItems.map((i) => i.id))
    markersRef.current.forEach((marker) => {
      const id = marker.getElement()?.dataset?.id
      const el = marker.getElement()
      if (el) el.style.display = visibleIds.has(id) ? '' : 'none'
    })
  }, [visibleItems])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    GEOJSON_LAYERS.forEach((cfg) => {
      const layerId = `geojson-${cfg.id}-layer`
      if (!map.getLayer(layerId)) return
      const visible = visibleLayerIds.includes(cfg.id)
      const v = visible ? 'visible' : 'none'
      map.setLayoutProperty(layerId, 'visibility', v)
      const outlineId = `${layerId}-line`
      if (map.getLayer(outlineId)) map.setLayoutProperty(outlineId, 'visibility', v)
    })
  }, [visibleLayerIds])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="interactive-map-page">
        <p className="map-error">Mapbox token not configured. Add VITE_MAPBOX_TOKEN to .env</p>
      </div>
    )
  }

  if (itemsWithDatetimeAndCoords.length === 0 || itemsWithDatetime.length === 0) {
    return (
      <div className="interactive-map-page">
        <p className="map-error">No archive items with coordinates and datetime to display.</p>
      </div>
    )
  }

  const handleToggleLayer = (layerId) => {
    setVisibleLayerIds((prev) =>
      prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]
    )
  }

  return (
    <div className="interactive-map-page">
      <div className="interactive-map-left">
        <InteractiveTimeline
          items={itemsWithDatetime}
          visibleItems={visibleItems}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
          viewRange={viewRange}
          onViewRangeChange={setViewRange}
          fullRange={fullRange}
        />
      </div>
      <div className="interactive-map-container" aria-label="Map area">
        <div ref={mapContainer} className="interactive-map-gl" />
        <div className="map-layers-overlay">
          <MapLayersPanel
            layers={GEOJSON_LAYERS}
            visibleLayerIds={visibleLayerIds}
            onToggleLayer={handleToggleLayer}
          />
        </div>
      </div>
      {selectedItem && (
        <div
          className="interactive-map-detail"
          style={{
            borderLeftColor: getItemPrimaryColor(selectedItem),
          }}
        >
          <button
            type="button"
            className="interactive-map-close"
            onClick={() => setSelectedItem(null)}
            aria-label="Close detail panel"
          >
            ×
          </button>
          <DetailPanel item={selectedItem} hideMap theme={theme} />
        </div>
      )}
    </div>
  )
}
