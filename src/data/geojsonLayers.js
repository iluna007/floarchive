/**
 * GeoJSON layers available for the map.
 * Files live in /public/geojson/*.geojson
 *
 * Paint options per geometry type (all optional):
 * - Point/circle: pointColor, pointRadius, pointStrokeColor, pointStrokeWidth
 * - Line: lineColor, lineWidth, lineDasharray (e.g. [2, 2])
 * - Fill (polygon): fillColor, fillOpacity, fillOutlineColor
 */
export const GEOJSON_LAYERS = [
  {
    id: 'hidroelectricas',
    name: 'Hidroeléctricas',
    url: '/geojson/hidroelectricas.geojson',
    type: 'point',
    pointColor: '#2563eb',
    pointRadius: 8,
    pointStrokeColor: '#ffffff',
    pointStrokeWidth: 1.5,
  },
  {
    id: 'territorios-indigenas',
    name: 'Territorios indígenas',
    url: '/geojson/territorios-indigenas.geojson',
    type: 'auto',
    fillColor: '#16a34a',
    fillOpacity: 0.4,
    fillOutlineColor: '#15803d',
    lineColor: '#15803d',
    lineWidth: 2,
  },
  {
    id: 'limite-nacional',
    name: 'Límite territorio nacional',
    url: '/geojson/limite-territorio-nacional.geojson',
    type: 'auto',
    lineColor: '#dc2626',
    lineWidth: 2.5,
    lineDasharray: [2, 2],
    fillColor: '#dc2626',
    fillOpacity: 0.25,
    fillOutlineColor: 'transparent',
  },
]
