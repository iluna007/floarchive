import { SORT_OPTIONS } from '../utils/sortArchive'

export default function SortSelect({ value, onChange }) {
  return (
    <div className="sort-select">
      <label htmlFor="sort-by">Sort by:</label>
      <select
        id="sort-by"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sort-select-input"
      >
        {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
