import { useState, useEffect } from 'react'
import { getViewFromHash, VIEWS } from './constants'
import { Header, FullListView, ThumbnailView } from './components'
import './App.css'

export default function App() {
  const [view, setView] = useState(getViewFromHash)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    const handleHashChange = () => setView(getViewFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const selectProject = (id) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const openInThumbnailView = (id) => {
    setSelectedId(id)
    window.location.hash = '#pages'
  }

  const isThumbnailView = view === VIEWS.thumbnail

  return (
    <div className="app">
      <Header isThumbnailView={isThumbnailView} />

      <main className="main">
        {isThumbnailView ? (
          <ThumbnailView selectedId={selectedId} onSelect={selectProject} />
        ) : (
          <FullListView onProjectClick={openInThumbnailView} />
        )}
      </main>
    </div>
  )
}
