import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE = 'mapbox://styles/ikerluna/cmich0yur000w01s372rm5vgw'

export default function LocationMap({ coordinates }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!MAPBOX_TOKEN || !coordinates || !mapContainer.current) return

    const [lng, lat] = Array.isArray(coordinates) ? coordinates : [coordinates.lng, coordinates.lat]

    if (!mapRef.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [lng, lat],
        zoom: 12,
      })
    }

    const map = mapRef.current

    if (markerRef.current) {
      markerRef.current.remove()
    }

    markerRef.current = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map)

    map.flyTo({ center: [lng, lat], zoom: 12, duration: 800 })

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
    }
  }, [coordinates])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  if (!MAPBOX_TOKEN || !coordinates) return null

  return <div ref={mapContainer} className="location-map" aria-label="Location map" />
}
