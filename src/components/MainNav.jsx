import { NAV_ITEMS } from '../constants'
import ThemeToggle from './ThemeToggle'
import BackgroundColorPicker from './BackgroundColorPicker'

export default function MainNav({ currentRoute, theme, onThemeToggle, bgColor, onBgColorChange }) {
  const isArchiveActive = currentRoute === 'archive' || currentRoute === 'fullList'

  return (
    <nav className="main-nav">
      <div className="main-nav-links">
        {NAV_ITEMS.map(({ key, label, hash }) => {
          const isActive = key === 'archive' ? isArchiveActive : currentRoute === key
          return (
            <a
              key={key}
              href={hash}
              className={`main-nav-link ${isActive ? 'active' : ''}`}
            >
              {label}
            </a>
          )
        })}
      </div>
      <div className="main-nav-actions">
        <BackgroundColorPicker currentColor={bgColor} onColorChange={onBgColorChange} />
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </nav>
  )
}
