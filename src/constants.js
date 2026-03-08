export const VIEWS = {
  thumbnail: 'thumbnail',
  fullList: 'full-list',
}

export function getViewFromHash() {
  const hash = window.location.hash.slice(1)
  return hash === 'full-list-view' ? VIEWS.fullList : VIEWS.thumbnail
}
