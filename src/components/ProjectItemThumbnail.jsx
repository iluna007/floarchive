import ProjectRow from './ProjectRow'

export default function ProjectItemThumbnail({ item, isSelected, onSelect }) {
  return (
    <article className="project-item">
      <button
        className={`project-row ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(item.id)}
        aria-pressed={isSelected}
      >
        <ProjectRow item={item} />
      </button>
      <hr className="project-divider" />
    </article>
  )
}
