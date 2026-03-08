export default function Header({ isThumbnailView }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">
          {isThumbnailView ? 'Project Overview' : 'full list view'}
        </h1>
        <a href="#" className="nav-link">Previous Page</a>
      </div>
      <a
        href={isThumbnailView ? '#full-list-view' : '#pages'}
        className="nav-link view-toggle"
      >
        {isThumbnailView ? 'List View' : 'Thumbnail View'}
      </a>
    </header>
  )
}
