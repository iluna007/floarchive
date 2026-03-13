import { useState, useRef, useEffect } from "react"
import CreateSpectrogram from "./CreateSpectrogram"

export default function SoundTrackRow({ item, index }) {
  const [expanded, setExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const m = Math.floor(audio.duration / 60)
        const s = Math.floor(audio.duration % 60)
        setDuration(m + ":" + s.toString().padStart(2, "0"))
      }
    }
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    if (audio.readyState >= 1) onLoadedMetadata()
    return () => audio.removeEventListener("loadedmetadata", onLoadedMetadata)
  }, [item.audioRecording])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  const handlePlayPause = (e) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return
    if (playing) audio.pause()
    else audio.play()
  }

  const thumbnail = item.images?.[0]

  return (
    <li className={"sound-track-row " + (expanded ? "expanded " : "") + (playing ? "playing" : "")} onClick={() => setExpanded((prev) => !prev)}>
      <audio ref={audioRef} src={item.audioRecording} preload="metadata" />
      <div className="sound-track-play" onClick={handlePlayPause} aria-label={playing ? "Pause" : "Play"}>
        <span className="sound-track-play-icon">{playing ? '⏸' : '▶'}</span>
      </div>
      <span className="sound-track-num">{index + 1}</span>
      <div className="sound-track-artwork">
        {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : <div className="sound-track-artwork-placeholder" />}
      </div>
      <div className="sound-track-info">
        <span className="sound-track-title">{item.title}</span>
        <span className="sound-track-meta">{item.category} · {item.date}</span>
      </div>
      <span className="sound-track-duration">{duration ?? '—'}</span>
      <div className="sound-track-waveform">
        <div className="sound-track-waveform-bars">
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} className="sound-track-waveform-bar" style={{ height: `${20 + (i % 5) * 15}%` }} />
          ))}
        </div>
      </div>
      {expanded && (
        <div className="sound-track-expanded" onClick={(e) => e.stopPropagation()}>
          <div className="sound-track-audio-full">
            <audio src={item.audioRecording} controls />
          </div>
          <CreateSpectrogram item={item} />
        </div>
      )}
    </li>
  )
}
