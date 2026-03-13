import LocationMap from './LocationMap'

export default function DetailPanel({ item, hideMap, theme = 'light' }) {
  if (!item) return null

  const title = item.title ?? ''
  const hasImages = item.images?.length > 0
  const hasCoordinates = item.coordinates && (item.coordinates.lat != null && item.coordinates.lng != null)

  return (
    <aside className="detail-panel">
      {hasImages && (
        <div className="project-images">
          {item.images.map((src, i) => (
            <div key={i} className="project-image">
              <img src={src} alt={`${title} ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      )}
      <h3 className="detail-title">{title}</h3>
      <p className="project-description">{item.description}</p>
      {hasCoordinates && (
        <>
          <p className="detail-gps">
            <small>📍 {item.gpsCoordinates ?? `${item.coordinates.lat}, ${item.coordinates.lng}`}</small>
          </p>
          {!hideMap && <LocationMap coordinates={item.coordinates} theme={theme} />}
          {item.audioRecording && (
            <div className="detail-media">
              <audio src={item.audioRecording} controls />
            </div>
          )}
        </>
      )}
      {!hasCoordinates && item.audioRecording && (
        <div className="detail-media">
          <audio src={item.audioRecording} controls />
        </div>
      )}
      {item.video && (
        <div className="detail-media">
          <video src={item.video} controls />
        </div>
      )}
    </aside>
  )
}
